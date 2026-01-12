# 部署指南 (Deployment Guide)

## 生产环境部署步骤

### 1. 服务器准备

确保服务器已安装：
- Node.js (v16 或更高版本)
- npm 或 yarn

### 2. 上传代码

将项目代码上传到服务器，或使用 Git 克隆：

```bash
git clone <your-repo-url>
cd still-alive
```

### 3. 安装依赖

```bash
npm install --production
```

### 4. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
RESEND_API_KEY=your_resend_api_key_here
PORT=3001  # 可选，默认 3001
NODE_ENV=production
```

### 5. 构建前端

```bash
npm run build
```

这将生成 `dist/` 目录，包含所有前端静态文件。

### 6. 启动服务器

**方式一：直接启动**
```bash
npm start
```

**方式二：使用 PM2（推荐）**

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "still-alive" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs still-alive
```

**方式三：使用 systemd（Linux）**

创建 `/etc/systemd/system/still-alive.service`：

```ini
[Unit]
Description=Still-Alive Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/still-alive
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

然后启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable still-alive
sudo systemctl start still-alive
sudo systemctl status still-alive
```

### 7. 配置反向代理（可选但推荐）

使用 Nginx 作为反向代理：

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

然后重启 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8. 配置 HTTPS（推荐）

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 9. 验证部署

1. 访问 `http://your-domain.com` 或 `http://your-server-ip:3001`
2. 测试邮件发送功能
3. 检查服务器日志确认没有错误

### 10. 监控和维护

**查看日志：**
```bash
# PM2
pm2 logs still-alive

# systemd
sudo journalctl -u still-alive -f
```

**重启应用：**
```bash
# PM2
pm2 restart still-alive

# systemd
sudo systemctl restart still-alive
```

## 故障排查

### 问题：邮件发送失败

1. 检查 `.env` 文件中的 `RESEND_API_KEY` 是否正确
2. 检查服务器日志中的错误信息
3. 确认 Resend 账户状态正常
4. 验证发件人域名是否已验证（`alerts@lchuckstudio.com`）

### 问题：静态文件无法加载

1. 确认已运行 `npm run build`
2. 检查 `dist/` 目录是否存在
3. 检查服务器日志中的路径信息

### 问题：API 请求失败

1. 检查服务器是否正在运行
2. 检查端口是否被占用
3. 检查防火墙设置
4. 查看浏览器控制台的网络请求

### 问题：CORS 错误

1. 确认前端请求使用相对路径 `/api/...`
2. 检查 `server.js` 中的 CORS 配置
3. 如果使用 Nginx，确保代理配置正确

## 环境变量说明

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `RESEND_API_KEY` | 是 | Resend API 密钥 | `re_xxxxx` |
| `PORT` | 否 | 服务器端口（默认 3001） | `3001` |
| `NODE_ENV` | 否 | 运行环境（默认 development） | `production` |

## 安全建议

1. **保护 API Key**：确保 `.env` 文件不在版本控制中（已在 `.gitignore` 中）
2. **使用 HTTPS**：在生产环境中始终使用 HTTPS
3. **限制访问**：使用防火墙限制服务器端口访问
4. **定期更新**：保持依赖包和 Node.js 版本更新
5. **监控日志**：定期检查服务器日志，发现异常及时处理

## 性能优化

1. **启用 Gzip 压缩**（Nginx）：
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

2. **使用 CDN**：将静态资源（如图片）托管到 CDN

3. **缓存策略**：配置适当的 HTTP 缓存头

## 备份和恢复

定期备份：
- `.env` 文件（包含 API Key）
- 数据库文件（如果有）
- 服务器配置

恢复步骤：
1. 上传备份文件
2. 恢复 `.env` 配置
3. 重新构建和启动应用
