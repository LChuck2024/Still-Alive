# Still-Alive (我还在) | Life Pulse Monitoring System

> "保持信号连接。不要关闭您的终端。"
> "Keep your signal alive. Do not turn off your terminal."

![License](https://img.shields.io/badge/license-MIT-green.svg) ![Style](https://img.shields.io/badge/style-Cyberpunk-00ff41.svg) ![PWA](https://img.shields.io/badge/PWA-Ready-facc15.svg)

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

本项目采用现代前端技术构建，邮件发送功能直接在前端调用 Resend API。

*   **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (大量自定义配置实现赛博特效)
*   **Build/Runtime**: [Vite](https://vitejs.dev/) (开发与构建工具)
*   **Email Service**: [Resend](https://resend.com/) (邮件发送服务 - 直接在前端调用)
*   **PWA**: Service Worker + Manifest.json
*   **Icons**: SVG (内联与文件)

## 快速开始 (Initialization)

### 环境要求
*   Node.js (推荐 v16+)
*   现代浏览器 (Chrome, Safari, Edge, Firefox)

### 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
RESEND_API_KEY=your_resend_api_key_here
```

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
    创建 `.env` 文件并填入 `RESEND_API_KEY`

4.  **启动开发服务器**
    
    **方式一：同时启动前端和 API 服务器（推荐）**
    ```bash
    npm run dev:all
    ```
    
    **方式二：分别启动**
    ```bash
    # 终端1：启动 API 服务器
    npm run dev:server
    
    # 终端2：启动前端开发服务器
    npm run dev
    ```

5.  **访问终端**
    打开浏览器访问 `http://localhost:3000`

### 生产环境部署

1.  **构建项目**
    ```bash
    npm run build
    ```

2.  **启动生产服务器**
    ```bash
    npm start
    ```
    
    服务器将在 `http://localhost:3001` 启动（或通过 `PORT` 环境变量指定端口）

3.  **使用 PM2 管理进程（推荐）**
    ```bash
    # 安装 PM2
    npm install -g pm2
    
    # 启动应用
    pm2 start npm --name "still-alive" -- start
    
    # 查看状态
    pm2 status
    
    # 查看日志
    pm2 logs still-alive
    ```

4.  **使用 Nginx 反向代理（可选）**
    
    在 Nginx 配置中添加：
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

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
├── components/       # UI Module (UI 组件库)
│   ├── AlertOverlay.tsx  # 红色警戒覆盖层
│   ├── CyberButton.tsx   # 通用赛博按钮
│   ├── GlobalStats.tsx   # 顶部全局数据栏
│   ├── Layout.tsx        # 主布局 (含扫描线特效)
│   ├── ProgressRing.tsx  # 倒计时圆环
│   ├── StatusMonitor.tsx # 底部日志终端
│   └── VIPModal.tsx      # 支付弹窗
├── services/         # Logic Core (逻辑服务)
│   └── storage.ts        # 本地存储逻辑封装
├── .env              # Environment Variables (环境变量)
├── App.tsx           # Main Application (主应用)
├── index.html        # Entry Point (HTML 入口)
├── index.tsx         # Bootstrapper (React 入口)
├── types.ts          # Type Definitions (类型定义)
├── manifest.json     # PWA Config (清单配置)
├── sw.js             # Service Worker (离线缓存)
├── icon.svg          # App Icon (应用图标)
├── public/
│   └── qr_code.JPG   # Payment Asset (支付二维码)
└── README.md         # Documentation (文档)
```

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