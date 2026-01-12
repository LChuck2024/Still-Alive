# EdgeOne Pages 环境变量配置指南

本文档说明在 EdgeOne Pages 控制台中需要配置的环境变量。

## 必需的环境变量

### TiDB 数据库配置

以下环境变量用于连接 TiDB 数据库：

| 环境变量 | 说明 | 示例值 | 是否必需 |
|---------|------|--------|---------|
| `TIDB_HOST` | TiDB 数据库主机地址 | `gateway01.ap-northeast-1.prod.aws.tidbcloud.com` | ✅ 必需 |
| `TIDB_USER` | TiDB 数据库用户名 | `your_username` | ✅ 必需 |
| `TIDB_PASSWORD` | TiDB 数据库密码 | `your_password` | ✅ 必需 |
| `TIDB_DATABASE` | 数据库名称 | `still_alive` | ⚠️ 可选（默认: `still_alive`） |
| `TIDB_PORT` | 数据库端口 | `4000` | ⚠️ 可选（默认: `4000`） |
| `TIDB_SSL` | 是否启用 SSL | `true` 或 `false` | ⚠️ 可选（默认: `false`） |

### 邮件服务配置

以下环境变量用于邮件发送功能：

| 环境变量 | 说明 | 示例值 | 是否必需 |
|---------|------|--------|---------|
| `RESEND_API_KEY` | Resend API 密钥 | `re_xxxxxxxxxxxxx` | ⚠️ 可选（如果使用邮件代理则不需要） |
| `VITE_EMAIL_PROXY_URL` | 邮件代理 URL（推荐） | `https://your-worker.workers.dev` | ⚠️ 可选（推荐使用） |

> **注意**：`VITE_EMAIL_PROXY_URL` 和 `RESEND_API_KEY` 二选一即可。推荐使用 `VITE_EMAIL_PROXY_URL`（通过 Cloudflare Workers 代理），可以避免 CORS 问题。

## 配置步骤

1. 登录 [EdgeOne Pages 控制台](https://console.cloud.tencent.com/edgeone/pages)
2. 选择您的项目
3. 进入「环境变量」或「设置」页面
4. 添加上述环境变量
5. 保存并重新部署项目

## 安全提示

⚠️ **重要**：
- 严禁在代码中硬编码数据库密码或其他敏感信息
- 所有敏感信息必须通过环境变量配置
- 定期更换数据库密码和 API 密钥
- 不要将包含敏感信息的 `.env` 文件提交到 Git 仓库

## 数据库初始化

在配置环境变量之前，请先执行数据库初始化脚本：

```bash
# 连接到 TiDB 数据库
mysql -h <TIDB_HOST> -P <TIDB_PORT> -u <TIDB_USER> -p < database-init.sql
```

或者使用 TiDB Cloud 控制台的 SQL 编辑器执行 `database-init.sql` 文件中的 SQL 语句。

## 验证配置

配置完成后，可以通过以下方式验证：

1. 访问应用并登录
2. 检查浏览器控制台是否有数据库连接错误
3. 执行一次"我还在"操作，检查数据库中是否有记录

## 故障排查

### 数据库连接失败

- 检查 `TIDB_HOST`、`TIDB_USER`、`TIDB_PASSWORD` 是否正确
- 检查 TiDB 防火墙设置，确保允许 EdgeOne Pages 的 IP 访问
- 检查 `TIDB_PORT` 是否正确（TiDB Cloud 通常使用 4000 端口）

### API 接口返回 500 错误

- 检查环境变量是否已正确配置
- 查看 EdgeOne Pages 的日志输出
- 确认数据库表是否已创建（执行 `database-init.sql`）

### 邮件发送失败

- 如果使用 `VITE_EMAIL_PROXY_URL`，检查 Cloudflare Worker 是否正常运行
- 如果使用 `RESEND_API_KEY`，检查 API 密钥是否有效
- 检查发件人邮箱是否已在 Resend 中验证
