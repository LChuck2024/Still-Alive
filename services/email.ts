/**
 * 邮件发送服务
 * 
 * 通过本地后端代理服务器发送邮件，避免 CORS 问题并保护 API Key。
 */

// 生产环境和开发环境都使用相对路径，由同一个服务器提供服务
const API_BASE_URL = '';

/**
 * 生成协议失效风格的 HTML 邮件内容
 */
const generateAlertEmailHTML = (): string => {
  const timestamp = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>紧急警报 - Still-Alive 协议失效</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Courier New', monospace;
      background: #000000;
      color: #ff003c;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 2px solid #ff003c;
      background: #0a0000;
      padding: 30px;
      box-shadow: 0 0 30px rgba(255, 0, 60, 0.3);
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #ff003c;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .alert-title {
      font-size: 32px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 10px;
      text-shadow: 0 0 10px #ff003c;
      animation: blink 1s infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .subtitle {
      font-size: 14px;
      color: #ff003c;
      opacity: 0.8;
      letter-spacing: 2px;
    }
    .terminal {
      background: #000000;
      border: 1px solid #ff003c;
      padding: 20px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    .terminal-line {
      margin: 8px 0;
      color: #ff003c;
    }
    .terminal-line::before {
      content: "> ";
      color: #ff003c;
    }
    .status-failed {
      color: #ff003c;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ff003c;
      text-align: center;
      font-size: 10px;
      color: #ff003c;
      opacity: 0.6;
      letter-spacing: 1px;
    }
    .timestamp {
      color: #ff003c;
      opacity: 0.7;
      font-size: 11px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-title">⚠️ 协议失效</div>
      <div class="subtitle">STILL-ALIVE PROTOCOL FAILURE</div>
    </div>
    
    <div class="terminal">
      <div class="terminal-line">正在检测生命体征... <span class="status-failed">无/阴性</span></div>
      <div class="terminal-line">未检测到心跳信号</div>
      <div class="terminal-line">超出安全阈值</div>
      <div class="terminal-line">正在启动紧急联系协议...</div>
      <div class="terminal-line">紧急响应单元_V2 已激活</div>
      <div class="terminal-line">数据包传输中...</div>
    </div>
    
    <div style="margin: 20px 0; padding: 15px; background: rgba(255, 0, 60, 0.1); border-left: 3px solid #ff003c;">
      <p style="margin-bottom: 10px; font-weight: bold;">紧急通知</p>
      <p style="font-size: 13px; line-height: 1.8;">
        您设置的 Still-Alive 监控系统检测到用户生命体征信号中断。<br>
        系统在设定的时间阈值内未收到用户的"我还在"脉冲确认信号。<br>
        请立即联系用户确认其安全状态。
      </p>
    </div>
    
    <div class="footer">
      <div>Still-Alive 生命脉冲监控系统</div>
      <div class="timestamp">警报时间: ${timestamp}</div>
      <div style="margin-top: 10px; font-size: 9px;">
        此邮件由自动化系统发送，请勿回复。
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * 发送紧急告警邮件
 * @param to 收件人邮箱地址
 * @returns Promise<{ success: boolean; error?: string }>
 */
export const sendAlertEmail = async (to: string): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  if (!to || !to.includes('@')) {
    return {
      success: false,
      error: '收件人邮箱地址无效。'
    };
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: '[紧急警报] Still-Alive 协议已失效 - 生命体征待确认',
        html: generateAlertEmailHTML(),
        isTest: false,
      }),
    });

    // 检查响应内容类型
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // 如果不是 JSON，尝试读取文本内容
      const text = await response.text();
      console.error('服务器返回非 JSON 响应:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: text.substring(0, 200)
      });
      
      return {
        success: false,
        error: `服务器返回了意外的响应格式。请检查服务器配置。状态码: ${response.status}`
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `发送失败: ${response.status} ${response.statusText}`
      };
    }

    return {
      success: data.success || true,
      messageId: data.messageId
    };
  } catch (error) {
    // 处理 JSON 解析错误
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        success: false,
        error: '服务器返回了无效的 JSON 响应。请检查服务器配置和 EdgeOne 设置。'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误：无法连接到邮件服务器'
    };
  }
};

/**
 * 发送测试邮件（发送到用户自己的邮箱）
 * @param to 收件人邮箱地址（通常是用户自己的邮箱）
 * @returns Promise<{ success: boolean; error?: string }>
 */
export const sendTestEmail = async (to: string): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  if (!to || !to.includes('@')) {
    return {
      success: false,
      error: '收件人邮箱地址无效。'
    };
  }

  try {
    const testHTML = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试邮件 - Still-Alive</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #000000;
      color: #00ff41;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 2px solid #00ff41;
      background: #000a00;
      padding: 30px;
      box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #00ff41;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 10px;
      color: #00ff41;
    }
    .terminal {
      background: #000000;
      border: 1px solid #00ff41;
      padding: 20px;
      margin: 20px 0;
      font-size: 12px;
    }
    .terminal-line {
      margin: 8px 0;
      color: #00ff41;
    }
    .terminal-line::before {
      content: "> ";
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">✓ 测试邮件</div>
      <div style="font-size: 12px; color: #00ff41; opacity: 0.8;">TEST EMAIL</div>
    </div>
    
    <div class="terminal">
      <div class="terminal-line">系统连接正常</div>
      <div class="terminal-line">邮件服务已激活</div>
      <div class="terminal-line">测试数据包传输成功</div>
    </div>
    
    <p style="margin-top: 20px; font-size: 13px; line-height: 1.8; color: #00ff41;">
      这是一封测试邮件。如果您收到此邮件，说明 Still-Alive 系统的邮件通知功能正常工作。
      当系统检测到生命体征信号中断时，您将收到类似的紧急告警邮件。
    </p>
  </div>
</body>
</html>
    `.trim();

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: '[测试] Still-Alive 邮件通知功能测试',
        html: testHTML,
        isTest: true,
      }),
    });

    // 检查响应内容类型
    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // 如果不是 JSON，尝试读取文本内容
      const text = await response.text();
      console.error('服务器返回非 JSON 响应:', {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: text.substring(0, 200)
      });
      
      return {
        success: false,
        error: `服务器返回了意外的响应格式。请检查服务器配置。状态码: ${response.status}`
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `发送失败: ${response.status} ${response.statusText}`
      };
    }

    return {
      success: data.success || true,
      messageId: data.messageId
    };
  } catch (error) {
    // 处理 JSON 解析错误
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        success: false,
        error: '服务器返回了无效的 JSON 响应。请检查服务器配置和 EdgeOne 设置。'
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误：无法连接到邮件服务器'
    };
  }
};
