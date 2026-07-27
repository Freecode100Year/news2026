# 新闻直播双端提词系统 (News Prompter 2.4)

> 🔗 **在线体验与生产体验入口**：[https://ticiqi.freedom8964.com/](https://ticiqi.freedom8964.com/)

> **最新版本 2.4.1 (2026-07-27) 核心稳定性重构与 Bug 修复更新**：
> - 🐛 **[P0] 彻底修复 `scrollRatio` 覆盖跳变 Bug**：导播端调速/调字号/镜像操作改为广播增量 command 消息，不再带过时的 `scrollRatio` 快照，完美兑现“临场无感改稿与操作零跳变”。
> - 📡 **[P0] WebSocket 自动心跳与指数退避重连**：客户端（主播端/导播端）增加 15s 定时 `ping`/`pong` 链路检测与 1s->2s->5s->10s 退避自动重连，保障直播高可靠抗抖动。
> - ⚡️ **[P1] 导播端滑杆操作 120ms 节流 (Throttle)**：对字号与滚动速度滑杆增加节流防抖，极大降低 Cloudflare DO 存储高频写入开销。
> - 🔄 **[P1] Service Worker 升级为 Network-First 策略**：增加 `activate` 生命周期清理旧 Cache，并对 HTML/JS 文件开启 Network-First，保证线上版本升级即刻推送生效。
> - 🛡️ **[P2] 过期数据销毁与掉线状态清理**：在 Durable Object 中增加 `alarm` 自动销毁到期数据；主播掉线自动清理并广播移除 `anchorProgress`。

> **版本 2.4.0 (2026-07-26) 自动跟播滚屏引擎与全量优化日志**：
> - 🚀 **`requestAnimationFrame` 60FPS 毫秒级自动滚屏引擎**：修复主播端在播放状态下不自动滚屏的问题，实现极为平滑且高帧率的无级滚动。
> - 🔒 **强化频道安全生命周期**：清除“永不过期”选项，所有房间均具有 1h / 6h / 24h / 7d 等有限期效。
> - 🔤 **生僻字/发音注音与重音支持**：支持 `{生僻字|shēng pì zì}` 语法自动渲染拼音注音标签，支持 `*重音强调*` 语法自动下划线标红强调。
> - 🪞 **硬件二维双向镜像 (2D Mirroring)**：支持左右翻转 (`scaleX`)、上下翻转 (`scaleY`) 及双向翻转，完美适配倒挂/潜望式专业实体分光屏。
> - 🚨 **突发新闻插播标签 (`Breaking News`)**：支持一键插入 `[突发新闻]` 节点，主播端闪烁醒目框提醒。
> - ⚡️ **临场无感改稿 (Live Hot Script Patching)**：修改后文台词时，主播当前镜头阅读位置零跳变、零跳帧。
> - 👁 **眼神自然出镜收窄模式 (Eye-Contact Guard)**：文本限制在中央 45% 视线区域，瞳孔无需左右摆动。
> - 🔄 **双向视线游标与跟播感应**：主播进度反向回传导播台，跳转按钮实时高亮【👁 主播 A 正在读此段】。
> - 💬 **Glassmorphism 消息气泡断网提示**：修复重连与初始化时的误弹提示，采用高斯毛玻璃样式。
> - 🌐 **云端发布**：原生部署至 Cloudflare Workers + Durable Objects 架构，生产域名 `ticiqi.freedom8964.com`。

---

## 🌟 新闻提词器 8 大本质痛点与解决方案

1. **跟词节奏难精准匹配**：支持 `requestAnimationFrame` 自动平滑滚动，配合鼠标滚轮微调、键盘 `Space` / `↑` / `↓` 极速控制。
2. **突发改稿支持不足**：临场无感改稿，修改后文不跳变画面；支持 `[突发新闻]` 醒目标签。
3. **可读性与出镜冲突**：支持拼音注音 `{字|zì}` 与重音 `*强调*`；眼神收窄保护模式防止瞳孔左右摇晃。
4. **稳定性要求极高**：云端 SQLite (DO) 持久化与端侧 LocalStorage 双重快照，断网绝不卡顿。
5. **成本高、部署复杂**：完全开源免费，一键托管部署至 Cloudflare Workers 节点。
6. **多机位/多屏同步难**：多路视角隔离，支持左右/上下硬件双向镜像及侧机位/返看屏适配。
7. **人机协同体验差**：双向视线游标反向回传，导播一键闪光警示召回。
8. **商业化过重**：纯净无广告、无订阅门槛。

---

## 🚀 部署指南

### 本地开发与调试
```bash
npm install -g wrangler
npx wrangler dev
```

### 部署至 Cloudflare Workers
```bash
npx wrangler deploy
```

生产域名：[https://ticiqi.freedom8964.com/](https://ticiqi.freedom8964.com/)

---

## 🛠 软件架构

```
news2026/
├── src/
│   └── index.js              # Cloudflare Worker & Durable Object (SQLite 强落盘 + 双向视线游标)
├── public/
│   ├── index.html            # 系统导航入口 (开源仓库标识)
│   ├── director.html         # 导播控制台 (无感改稿 + 视线追踪 + 一键召回警示)
│   ├── anchor.html           # 主播显示端 (拼音注音 + 二维硬件镜像 + 眼神收窄保护 + RAF 自动跟播引擎)
│   ├── qrcode.min.js         # 纯 JS 离线二维码生成引擎
│   └── service-worker.js     # PWA 离线缓存支持
├── wrangler.toml             # Cloudflare 部署与域名配置文件
└── README.md                 # 项目文档
```

---

## 📄 开源许可
MIT License
