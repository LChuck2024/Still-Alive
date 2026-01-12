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
app.use(cors({
  origin: '*', // 允许所有来源（生产环境可以限制）
  credentials: true
}));
app.use(express.json());

// 添加请求日志（用于调试）
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    // 确保 API 响应始终是 JSON 格式
    res.setHeader('Content-Type', 'application/json');
  }
  next();
});

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

    // 检查响应内容类型
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // 如果不是 JSON，读取文本内容用于错误诊断
      const text = await response.text();
      console.error('Resend API 返回非 JSON 响应:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: text.substring(0, 500) // 只记录前500字符
      });
      
      return res.status(500).json({
        success: false,
        error: `邮件服务返回了意外的响应格式。状态码: ${response.status}`
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || data.error || `发送失败: ${response.status} ${response.statusText}`
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
  res.setHeader('Content-Type', 'application/json');
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
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(join(distPath, 'index.html'));
  });
}

// 全局错误处理中间件（必须在所有路由之后）
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  // 如果是 API 路由，返回 JSON 错误
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    res.status(err.status || 500).json({
      success: false,
      error: err.message || '服务器内部错误'
    });
  } else {
    // 非 API 路由，返回 HTML 错误页面
    res.status(err.status || 500).send('服务器错误');
  }
});

// 404 处理（必须在所有路由之后）
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
      success: false,
      error: 'API endpoint not found'
    });
  } else if (!isProduction) {
    res.status(404).send('页面未找到');
  }
  // 生产环境中，静态文件路由会处理 404
});

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
