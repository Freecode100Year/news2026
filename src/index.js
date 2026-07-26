/**
 * 新闻提词器一体化 Worker & Durable Object (PrompterRoom)
 */

export class PrompterRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // Map<WebSocket, { role: 'director' | 'anchor', anchorRole: string }>
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
      liveCountdown: null, // 开播倒计时目标时间戳
      hasPassword: false,
      expiresAt: null,
      updatedAt: Date.now(),
    };
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
    const anchorRole = url.searchParams.get('anchorRole') || 'ALL'; // 'A', 'B', 'ALL'
    const pass = url.searchParams.get('pass') || '';

    // 检查密码与过期状态
    const validateErr = this.validateAuth(pass);
    if (validateErr) {
      return new Response(validateErr, { status: 403 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.handleSession(server, role, anchorRole);
    return new Response(null, { status: 101, webSocket: client });
  }

  validateAuth(pass) {
    if (this.expiresAt && Date.now() > this.expiresAt) {
      return '房间已过期，请重新生成房间';
    }
    if (this.password && this.password !== pass) {
      return '房间密码错误';
    }
    return null;
  }

  handleSession(ws, role, anchorRole) {
    ws.accept();
    this.sessions.set(ws, { role, anchorRole });

    // 发送当前初始状态
    ws.send(JSON.stringify({ type: 'state', payload: this.lastState }));
    this.broadcastPresence();

    ws.addEventListener('message', (e) => this.onMessage(ws, role, e.data));

    const cleanup = () => {
      this.sessions.delete(ws);
      this.broadcastPresence();
    };
    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }

  onMessage(ws, role, data) {
    let msg;
    try { msg = JSON.parse(data); } catch (e) { return; }

    if (role === 'director' && msg.type === 'command') {
      this.updateStateFromDirector(msg.payload);
      this.broadcast({ type: 'state', payload: this.lastState }, ws);
    } else if (msg.type === 'action') {
      this.broadcast({ type: 'action', payload: msg.payload }, ws);
    } else if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: msg.t }));
    }
  }

  updateStateFromDirector(payload) {
    if (payload.password !== undefined) {
      this.password = payload.password;
    }
    if (payload.expiresAt !== undefined) {
      this.expiresAt = payload.expiresAt;
    }
    this.lastState = {
      ...this.lastState,
      ...payload,
      hasPassword: !!this.password,
      expiresAt: this.expiresAt,
      updatedAt: Date.now(),
    };
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
    const match = url.pathname.match(/^\/room\/([A-Za-z0-9-]{3,32})\/ws$/);

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
