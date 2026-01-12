/**
 * Cloudflare Worker - Still-Alive 邮件发送服务
 * 
 * 使用方法：
 * 1. 在 Cloudflare Workers 控制台创建新的 Worker
 * 2. 将以下代码全部复制粘贴到编辑器
 * 3. 在 Worker 设置中添加环境变量 RESEND_API_KEY
 * 4. 部署 Worker
 * 5. 复制 Worker URL，在 EdgeOne Pages 环境变量中设置 VITE_EMAIL_PROXY_URL
 */

// 处理 CORS 预检请求
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// 主处理函数
async function handleRequest(request, env) {
  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions();
  }

  // 只处理 POST 请求
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: `方法 ${request.method} 不被允许。此端点仅支持 POST 请求。`
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // 解析请求体
    const body = await request.json();
    const { to, subject, html } = body;

    // 验证必要参数
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '缺少必要参数：to, subject, html'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 验证邮箱格式
    if (!to.includes('@')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '收件人邮箱地址无效。'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 获取环境变量
    const RESEND_API_KEY = env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'RESEND_API_KEY 未配置。请在 Cloudflare Workers 设置中添加环境变量。'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 调用 Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
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
    const contentType = resendResponse.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await resendResponse.json();
    } else {
      // 如果不是 JSON，读取文本内容
      const text = await resendResponse.text();
      console.error('Resend API 返回非 JSON 响应:', {
        status: resendResponse.status,
        statusText: resendResponse.statusText,
        contentType,
        body: text.substring(0, 500)
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: `邮件服务返回了意外的响应格式。状态码: ${resendResponse.status}`
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.message || data.error || `发送失败: ${resendResponse.status} ${resendResponse.statusText}`
        }),
        {
          status: resendResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 成功响应
    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('邮件发送错误:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Cloudflare Worker 入口（ES Modules 格式）
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};
