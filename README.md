# 新闻直播双端提词系统 (News Prompter 2.0)

> **最新版本 2.0.0 (2026-07-26) 更新日志**：
> - 🔒 **房间密码与有效期保护**：支持自定义房间密码与到期时间（1/6/24小时/永久），防止误连与房间被非法侵入。
> - 👥 **多路主播与双人主持模式**：支持 `[主播A]` / `[主播B]` 对话区分，主播端支持独立选择视角，高亮专属台词并暗化对方台词；同时支持双端独立配置本地字号与行距。
> - ⏱ **时间戳与直播倒计时联动**：稿件支持一键插入时间戳 `[HH:MM:SS]`，支持设定开播倒计时联动，倒计时归零自动触发 3-2-1 开播动画并启动提词滚动。
> - 📱 **纯离线二维码安全入房**：内置纯 JS QRCode 生成库，导播端一键生成带房间号与密钥的主播专属二维码，主播扫码即用、免去繁琐输入。
> - 🌐 **域名发布与 Cloudflare Workers 部署**：原生支持部署至 Cloudflare Workers + Durable Objects 架构，已绑定生产域名 `ticiqi.freedom8964.com`。

---

## 🌟 系统架构与特性

本系统采用 Cloudflare Workers + Durable Objects 构建，将静态 Web 界面与高并发毫秒级 WebSocket 实时同步引擎融合为一体，具备极高的可靠性与现场抗风险能力：

1. **导播控制台 (`/director.html`)**：
   - 稿件导入、编排、分段与快速标签插入 (`[主播A]`, `[主播B]`, `[时间戳]`)
   - 房间密码与生命周期管理
   - 实时播放/暂停、快进/快退、滚动速度及参考字号调节
   - 扫码邀请与复制离线一键入房链接
   - 直播倒计时联动控制器

2. **主播提词端 (`/anchor.html`)**：
   - 适配硬件反射屏（支持左右镜像翻转）
   - 主播视角选择（主播 A / 主播 B / 所有人视角）
   - 独立字号/行距随心调节（保存在本地 LocalStorage，不受设备尺寸制约）
   - 全屏开播倒计时动画与断网离线自愈运行

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

已配置自定义域名：`ticiqi.freedom8964.com`

---

## 🛠 软件架构

```
news2026/
├── src/
│   └── index.js              # Cloudflare Worker & Durable Object 消息路由与状态广播
├── public/
│   ├── index.html            # 系统导航入口
│   ├── director.html         # 导播控制台
│   ├── anchor.html           # 主播显示端
│   ├── qrcode.min.js         # 纯 JS 离线二维码生成引擎
│   └── service-worker.js     # PWA 离线缓存支持
├── wrangler.toml             # Cloudflare 部署与域名配置文件
└── README.md                 # 项目文档
```

---

## 📄 开源许可
MIT License
