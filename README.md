# Still-Alive (我还在) | Life Pulse Monitoring System

> "保持信号连接。不要关闭您的终端。"
> "Keep your signal alive. Do not turn off your terminal."

![Style](https://img.shields.io/badge/style-Cyberpunk-00ff41.svg) ![PWA](https://img.shields.io/badge/PWA-Ready-facc15.svg)

**Still-Alive (我还在)** 是一款极简主义、赛博朋克风格的 **Web MVP (最小可行性产品)**，核心概念为"生命脉冲监控系统 (Life Pulse Monitoring System)"。它模仿了末日生存环境下的通信终端，用户通过定期发送脉冲信号来向系统确认"我还在"。一旦超过设定的时间阈值未发送脉冲，系统将进入红色警戒状态，并模拟触发紧急联系协议。

## 核心功能 (Core Protocols)

*   **脉冲确认 (Pulse Confirmation)**: 巨大的"我还在"按钮，点击即发送生命脉冲信号，重置倒计时。
*   **可视化倒计时 (Visual Countdown)**: 带有动态颜色变化的进度环（绿 -> 黄 -> 红），直观展示剩余生存时间。
*   **红色警戒模式 (Red Alert Mode)**: 当倒计时归零，界面切换至“系统故障”的红色警戒主题，并弹出全屏告警覆盖层。
*   **本地数据持久化 (Local Persistence)**: 使用 `localStorage` 模拟数据库，保存用户身份、设置及日志，刷新页面不丢失状态。
*   **PWA 支持 (Progressive Web App)**: 支持“添加到主屏幕”，离线可用，提供原生 App 般的沉浸式体验。
*   **VIP 模拟支付**: 集成模拟的微信支付流程，用于解锁“高级功能”（演示用途）。
*   **沉浸式 UI**: 包含扫描线 (Scanlines)、故障文字 (Glitch Text)、冲击波 (Shockwave) 动画及动态终端日志。

## 技术栈 (Tech Stack)

本项目采用现代前端技术构建，邮件发送功能通过 Cloudflare Workers 代理实现。

*   **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (大量自定义配置实现赛博特效)
*   **Build/Runtime**: [Vite](https://vitejs.dev/) (开发与构建工具)
*   **Email Service**: [Resend](https://resend.com/) (邮件发送服务)
*   **Proxy**: [Cloudflare Workers](https://workers.cloudflare.com/) (免费边缘函数，用于代理邮件发送，避免 CORS 问题)
*   **PWA**: Service Worker + Manifest.json
*   **Icons**: SVG (内联与文件)

## 快速开始 (Initialization)

### 环境要求
*   Node.js (推荐 v16+)
*   现代浏览器 (Chrome, Safari, Edge, Firefox)

### 环境变量配置

在项目根目录创建 `.env` 文件：

**推荐方式（使用 Cloudflare Workers 代理）：**
```bash
VITE_EMAIL_PROXY_URL=https://your-worker.your-subdomain.workers.dev
```

**或直接调用 Resend API（可能遇到 CORS 问题）：**
```bash
VITE_RESEND_API_KEY=your_resend_api_key_here
```

> **注意**：推荐使用 Cloudflare Workers 代理方式，可以避免 CORS 问题并保护 API Key。详细设置步骤请参考 `cloudflare-worker.js` 文件中的注释。

### 本地开发

1.  **克隆仓库**
    ```bash
    git clone https://github.com/your-username/still-alive.git
    cd still-alive
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    创建 `.env` 文件并填入环境变量（参考上面的环境变量配置说明）

4.  **启动开发服务器**
    ```bash
    npm run dev
    ```

5.  **访问应用**
    打开浏览器访问 `http://localhost:3000`

### 生产环境部署

1.  **构建项目**
    ```bash
    npm run build
    ```

2.  **部署静态文件**
    
    构建完成后，`dist` 目录包含所有静态文件。
    
    **重要：部署的是 `dist` 目录里的内容，而不是 `dist` 文件夹本身！**
    
    将 `dist` 目录下的所有文件和文件夹（`index.html`, `assets/`, `icon.svg`, `sw.js` 等）上传到部署平台的**根目录**。
    
    可以部署到以下静态文件托管服务：
    - **EdgeOne Pages**（推荐）
    - **Vercel**
    - **Netlify**
    - **GitHub Pages**
    - **Cloudflare Pages**
    - 或其他静态文件托管服务
    
    > **注意**：如果使用 Vercel、Netlify 等支持自动构建的平台，通常只需要连接 Git 仓库，平台会自动识别 `dist` 目录并部署。如果手动上传，则需要上传 `dist` 目录里的内容到根目录。

3.  **配置环境变量**
    
    在部署平台配置环境变量：
    - `VITE_EMAIL_PROXY_URL`（推荐）- Cloudflare Workers URL
    - 或 `VITE_RESEND_API_KEY` - Resend API Key（可能遇到 CORS 问题）

4.  **预览构建结果（本地测试）**
    ```bash
    npm run preview
    ```

5.  **部署检查**
    
    部署前请参考 `DEPLOY_CHECKLIST.md` 进行部署前检查，确保所有文件正确构建和配置。

## PWA 安装指南 (Mobile Access)

本项目针对移动端进行了深度优化。

1.  **iOS (Safari)**:
    *   点击底部“分享”按钮。
    *   向下滑动选择“添加到主屏幕”。
    *   即可以全屏模式运行，无浏览器地址栏。

2.  **Android (Chrome)**:
    *   点击右上角菜单。
    *   选择“安装应用”或“添加到主屏幕”。

## 项目结构 (System Architecture)

```text
/
├── components/           # UI Module (UI 组件库)
│   ├── AlertOverlay.tsx  # 红色警戒覆盖层
│   ├── CyberButton.tsx   # 通用赛博按钮
│   ├── GlobalStats.tsx   # 顶部全局数据栏
│   ├── Layout.tsx        # 主布局 (含扫描线特效)
│   ├── ProgressRing.tsx  # 倒计时圆环
│   ├── StatusMonitor.tsx # 底部日志终端
│   └── VIPModal.tsx      # 支付弹窗
├── services/             # Logic Core (逻辑服务)
│   └── storage.ts        # 本地存储逻辑封装
├── cloudflare-worker.js  # Cloudflare Worker 代码（邮件代理服务）
├── .env                  # Environment Variables (环境变量)
├── App.tsx               # Main Application (主应用)
├── index.html            # Entry Point (HTML 入口)
├── index.tsx             # Bootstrapper (React 入口)
├── types.ts              # Type Definitions (类型定义)
├── manifest.json         # PWA Config (清单配置)
├── sw.js                 # Service Worker (离线缓存)
├── icon.svg              # App Icon (应用图标)
├── vite.config.ts        # Vite 配置文件
├── tsconfig.json         # TypeScript 配置
├── public/
│   ├── icon.svg          # App Icon (应用图标)
│   ├── qr_code.JPG       # Payment Asset (支付二维码)
│   └── sw.js             # Service Worker (离线缓存)
├── README.md             # Documentation (项目文档)
└── DEPLOY_CHECKLIST.md   # Deployment Guide (部署检查清单)
```

## 邮件服务配置 (Email Service Setup)

### 使用 Cloudflare Workers（推荐）

1. **创建 Cloudflare Worker**
   - 访问 https://workers.cloudflare.com/
   - 创建新的 Worker
   - 复制 `cloudflare-worker.js` 中的代码到编辑器
   - 在 Worker 设置中添加环境变量 `RESEND_API_KEY`
   - 部署 Worker 并复制 Worker URL

2. **配置环境变量**
   - 在项目 `.env` 文件中设置：`VITE_EMAIL_PROXY_URL=https://your-worker.workers.dev`
   - 或在部署平台的环境变量中配置

### 直接使用 Resend API（不推荐）

如果直接使用 Resend API，可能遇到 CORS 问题：
- 在 `.env` 文件中设置：`VITE_RESEND_API_KEY=your_api_key`

## 自定义配置 (Configuration)

在 `tailwind.config` (位于 `index.html` 内或独立文件) 中，定义了核心色板：

*   `cyber-green`: `#00ff41` (主色调 - 正常)
*   `cyber-red`: `#ff003c` (警告色 - 故障)
*   `cyber-yellow`: `#facc15` (辅助色 - VIP)
*   `cyber-black`: `#050505` (背景色)


---

**Protocol Status:** `ONLINE`
**Version:** `2.0.4-BETA`
**System:** `Still-Alive Pulse Monitoring Grid`