# 新闻直播双端提词系统 (News Prompter 2.2)

> **最新版本 2.2.0 (2026-07-26) 直播高压场景核心痛点解决方案日志**：
> - ⚡️ **临场无感改稿 (Live Hot Script Patching)**：解决突发改稿跳变痛点。导播控制台支持`⚡ 临场无感改稿推送`，修改或插播后文台词时，主播当前镜头阅读的位置保持零跳变、零跳帧平滑衔接。
> - 👁 **眼神自然出镜收窄模式 (Eye-Contact Margin Guard)**：解决“眼神斜视/看穿在读稿”痛点。开启后文本自动收窄至中央 45% 视线黄金区域，行字数受限，瞳孔直视镜头完全无需左右扫视，镜头出镜极度自然。
> - 🔄 **双向视线游标与跟播感应 (Bi-directional Cursor Back-feed)**：解决多人协同抢读/卡顿痛点。主播阅读进度反向毫秒级向导播端汇报，导播台段落跳转按钮实时高亮【👁 主播 A 正在读此段】，双向协同万无一失。
> - 💬 ** Toast 消息气泡断网提示**：导播/主播端网络异常或恢复时，自动浮出平滑 Toast 气泡（`⚠️ 物理网络已断开` / `🌐 频道已连通`）。
> - 💾 **云端 SQLite (Durable Object) + 端侧本地双重容灾**：Durable Object 落盘持久化与客户端 LocalStorage 离线快照，断网或页面刷新秒级恢复，不丢一字。
> - 🔒 **房间密码与有效期保护**：支持自定义房间密码与到期时间（1/6/24小时/永久）。
> - 👥 **多路主播与双人主持模式**：支持 `[主播A]` / `[主播B]` 视角隔离与高亮，支持独立本地字号。
> - ⏱ **时间戳与直播倒计时联动**：一键插入时间戳 `[HH:MM:SS]`，倒计时归零自动启动提词。
> - 📱 **纯离线二维码安全入房**：内置纯 JS QRCode 引擎，主播扫码即用。
> - 🌐 **云端发布**：原生部署至 Cloudflare Workers + Durable Objects 架构，域名 `ticiqi.freedom8964.com`。

---

## 🌟 新闻提词器本质痛点与解决方案

在直播高压场景下，新闻提词器的核心不是“能不能滚字”，而是能否解决以下五大现场难题：

1. **实时跟播 (Live Follow)**：支持键盘 `Space` 暂停、`↑`/`↓` 无级调速、鼠标滚轮随心控制，拒绝人在等字或字跑比人快的机械感。
2. **临场无感改稿 (Hot Script Patching)**：突发插播时导播点击无感改稿，只增量更新后文，正在进行的画面不闪烁跳变。
3. **多人协同 (Multi-User Collaboration)**：双向视线游标回传，导播时刻掌握主播读到了哪一行。
4. **自然出镜 (Natural Eye-Contact)**：眼神收窄模式将文字限制在镜头中央正方，主播瞳孔无需左右平移，出镜自然大方。
5. **稳定容灾 (Ultra-Reliable Storage)**：云端 SQLite + 端侧缓存双保险，即使物理断网提词器依然持续顺畅播放。

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

生产域名：`ticiqi.freedom8964.com`

---

## 🛠 软件架构

```
news2026/
├── src/
│   └── index.js              # Cloudflare Worker & Durable Object (SQLite 落盘 + 双向视线游标)
├── public/
│   ├── index.html            # 系统导航入口 (开源仓库标识)
│   ├── director.html         # 导播控制台 (临场无感改稿 + 主播视线追踪)
│   ├── anchor.html           # 主播显示端 (眼神收窄保护 + 焦点行高斯高亮)
│   ├── qrcode.min.js         # 纯 JS 离线二维码生成引擎
│   └── service-worker.js     # PWA 离线缓存支持
├── wrangler.toml             # Cloudflare 部署与域名配置文件
└── README.md                 # 项目文档
```

---

## 📄 开源许可
MIT License
