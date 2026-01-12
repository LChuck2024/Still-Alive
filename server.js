import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// 中间件
app.use(cors());
app.use(express.json());

// API 路由（必须在静态文件服务之前）
// 邮件发送代理端点
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html, isTest } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要参数：to, subject, html' 
    });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    return res.status(500).json({ 
      success: false, 
      error: 'RESEND_API_KEY 未配置' 
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Still-Alive <alerts@lchuckstudio.com>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || `发送失败: ${response.status} ${response.statusText}`
      });
    }

    res.json({
      success: true,
      messageId: data.id
    });
  } catch (error) {
    console.error('邮件发送错误:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '邮件服务代理运行正常' });
});

// 生产环境：提供静态文件服务和前端路由支持
if (isProduction) {
  const distPath = join(__dirname, 'dist');
  // 提供静态文件服务（CSS、JS、图片等）
  app.use(express.static(distPath));
  console.log(`📦 静态文件目录: ${distPath}`);
  
  // 所有非 API 路由返回 index.html（支持前端路由）
  app.get('*', (req, res) => {
    // 排除 API 路由
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📧 API Key 已加载: ${process.env.RESEND_API_KEY ? '✓' : '✗'}`);
  console.log(`🌍 环境: ${isProduction ? '生产环境' : '开发环境'}`);
  if (isProduction) {
    console.log(`📦 提供静态文件服务`);
  } else {
    console.log(`💡 开发模式：仅提供 API 服务，前端请使用 Vite 开发服务器`);
  }
});
