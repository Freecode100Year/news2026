/**
 * 新闻提词器一体化 Worker & Durable Object (PrompterRoom)
 * 修复：
 * 1. P0 - 增加对 director 'action' 消息的广播支持 (如 flashCue 一键警示召回)
 * 2. P0 - 导播 command 更新状态时广播给房间所有人 (包括导播自己)，保证状态 100% 对齐
 * 3. 修复短房间码匹配正则
 */

export class PrompterRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.password = '';
    this.expiresAt = null;

    this.lastState = {
      script: '',
      scrollRatio: 0,
      playing: false,
      speed: 1,
      mirrored: false,
      fontSize: 48,
      lineHeight: 1.55,
      eyeContactGuard: true,
      liveCountdown: null,
      anchorProgress: {},
      hasPassword: false,
      expiresAt: null,
      updatedAt: Date.now(),
    };

    this.state.blockConcurrencyWhile(async () => {
      const saved = await this.state.storage.get('roomState');
      if (saved) {
        this.lastState = { ...this.lastState, ...saved };
        this.password = saved.password || '';
        this.expiresAt = saved.expiresAt || null;
      }
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/ws')) {
      return this.handleWsUpgrade(request, url);
    }
    return new Response('Prompter Room Active', { status: 200 });
  }

  handleWsUpgrade(request, url) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('WebSocket Required', { status: 426 });
    }

    const role = url.searchParams.get('role') === 'director' ? 'director' : 'anchor';
    const anchorRole = url.searchParams.get('anchorRole') || 'ALL';
    const pass = url.searchParams.get('pass') || '';

    const validateErr = this.validateAuth(pass, role);
    if (validateErr) {
      return new Response(validateErr, { status: 403 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.handleSession(server, role, anchorRole);
    return new Response(null, { status: 101, webSocket: client });
  }

  validateAuth(pass, role) {
    if (this.expiresAt && Date.now() > this.expiresAt) {
      return '房间已过期，请重新创建房间';
    }
    if (this.password && this.password !== pass) {
      return '房间密码错误';
    }
    return null;
  }

  handleSession(ws, role, anchorRole) {
    ws.accept();
    this.sessions.set(ws, { role, anchorRole });

    ws.send(JSON.stringify({ type: 'state', payload: this.lastState }));
    this.broadcastPresence();

    ws.addEventListener('message', (e) => this.onMessage(ws, role, anchorRole, e.data));

    const cleanup = () => {
      this.sessions.delete(ws);
      if (role === 'anchor' && this.lastState.anchorProgress[anchorRole]) {
        delete this.lastState.anchorProgress[anchorRole];
        this.broadcast({ type: 'anchorProgress', payload: { role: anchorRole, progress: null } });
      }
      this.broadcastPresence();
    };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  onMessage(ws, role, anchorRole, data) {
    let msg;
    try { msg = JSON.parse(data); } catch (e) { return; }

    if (role === 'director' && msg.type === 'command') {
      this.updateStateFromDirector(msg.payload);
      // P0 修复：导播 command 广播只包含本次修改增量及必要的派生字段，避免用服务端过时的 scrollRatio 覆盖主播端本地滑动进度
      this.broadcast({
        type: 'state',
        payload: {
          ...msg.payload,
          hasPassword: !!this.password,
          expiresAt: this.expiresAt,
          updatedAt: this.lastState.updatedAt,
        },
      });
    } else if (role === 'director' && msg.type === 'action') {
      // P0 修复：转发 action 消息（例如一键警示召回 flashCue）
      this.broadcast({ type: 'action', payload: msg.payload });
    } else if (role === 'anchor' && msg.type === 'anchorProgress') {
      this.lastState.anchorProgress[anchorRole] = msg.payload;
      this.broadcast({ type: 'anchorProgress', payload: { role: anchorRole, progress: msg.payload } }, ws);
    } else if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: msg.t }));
    }
  }

  updateStateFromDirector(payload) {
    if (payload.password !== undefined) this.password = payload.password;
    if (payload.expiresAt !== undefined) this.expiresAt = payload.expiresAt;

    this.lastState = {
      ...this.lastState,
      ...payload,
      hasPassword: !!this.password,
      expiresAt: this.expiresAt,
      updatedAt: Date.now(),
    };

    this.state.storage.put('roomState', {
      ...this.lastState,
      password: this.password,
      expiresAt: this.expiresAt,
    }).catch(() => {});

    if (this.expiresAt) {
      this.state.storage.setAlarm(this.expiresAt).catch(() => {});
    }
  }

  async alarm() {
    if (this.expiresAt && Date.now() >= this.expiresAt) {
      await this.state.storage.deleteAll();
    }
  }

  broadcast(message, exclude) {
    const data = JSON.stringify(message);
    for (const ws of this.sessions.keys()) {
      if (ws !== exclude) {
        try { ws.send(data); } catch (e) { this.sessions.delete(ws); }
      }
    }
  }

  broadcastPresence() {
    const list = Array.from(this.sessions.values());
    const directors = list.filter(s => s.role === 'director').length;
    const anchors = list.filter(s => s.role === 'anchor');
    this.broadcast({
      type: 'presence',
      payload: {
        directorOnline: directors > 0,
        anchorOnline: anchors.length > 0,
        anchorCount: anchors.length,
        anchorRoles: anchors.map(a => a.anchorRole),
        totalCount: list.length,
      },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/room\/([A-Za-z0-9-]{1,32})\/ws$/);

    if (match) {
      const roomCode = match[1].toUpperCase();
      const id = env.PROMPTER_ROOM.idFromName(roomCode);
      const stub = env.PROMPTER_ROOM.get(id);
      const forwardUrl = new URL(request.url);
      forwardUrl.pathname = '/ws';
      return stub.fetch(new Request(forwardUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};
