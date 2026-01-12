import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { CyberButton } from './components/CyberButton';
import { VIPModal } from './components/VIPModal';
import { StatusMonitor } from './components/StatusMonitor';
import { ProgressRing } from './components/ProgressRing';
import { AlertOverlay } from './components/AlertOverlay';
import { saveState, loadState, checkStatusLogic, saveLogs, loadLogs } from './services/storage';
import { UserState, View } from './types';

function App() {
  const initialState = loadState();
  const [state, setState] = useState<UserState>(initialState);
  const [currentView, setCurrentView] = useState<View>(initialState.isAuthenticated ? View.DASHBOARD : View.LOGIN);
  const [isVIPOpen, setIsVIPOpen] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  
  // UI States
  const [logs, setLogs] = useState<string[]>(() => loadLogs());
  const [isAlertTriggered, setIsAlertTriggered] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testEmailMessage, setTestEmailMessage] = useState<string>('');
  const [alertEmailSent, setAlertEmailSent] = useState(false); // 跟踪告警邮件是否已发送
  const [alertEmailStatus, setAlertEmailStatus] = useState<'sending' | 'success' | 'error'>('sending');
  const [alertEmailError, setAlertEmailError] = useState<string>('');

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Persist logs changes
  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  // 页面加载时同步状态
  useEffect(() => {
    if (state.isAuthenticated && state.settings.email) {
      syncStatus();
    }
  }, [state.isAuthenticated, state.settings.email, syncStatus]); // 只在认证状态或邮箱变化时执行

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, message].slice(-50));
  }, []);

  // 无感记录用户操作到 TiDB
  const logAction = useCallback(async (
    actionType: 'LOGIN' | 'PULSE_CHECK' | 'UPDATE_EMERGENCY' | 'TEST_SEND',
    actionData?: Record<string, any>
  ) => {
    const email = state.settings.email || tempEmail;
    if (!email) {
      console.warn('[操作记录] 邮箱为空，跳过记录');
      return;
    }

    try {
      const response = await fetch('/api/log-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          action_type: actionType,
          action_data: actionData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[操作记录] 记录失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        addLog(`[错误] 操作记录失败: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        console.log('[操作记录] 记录成功:', data);
      } else {
        console.error('[操作记录] 记录失败:', data);
        addLog(`[错误] 操作记录失败: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      // 显示错误信息，帮助调试
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[操作记录] 记录错误:', error);
      addLog(`[错误] 操作记录异常: ${errorMessage}`);
    }
  }, [state.settings.email, tempEmail, addLog]);

  // 同步状态：从 TiDB 获取最后一次 PULSE_CHECK 时间
  const syncStatus = useCallback(async () => {
    const email = state.settings.email;
    if (!email || !state.isAuthenticated) return;

    try {
      const response = await fetch(`/api/get-status?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        console.error('[状态同步] 获取状态失败:', response.statusText);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.lastCheckIn) {
        // 如果数据库中的时间比本地时间更新，则同步
        if (!state.lastCheckIn || data.lastCheckIn > state.lastCheckIn) {
          setState(prev => ({
            ...prev,
            lastCheckIn: data.lastCheckIn,
          }));
          addLog(`[同步] 状态已从服务器同步。`);
        }
      }
    } catch (error) {
      // 静默失败，不影响用户体验
      console.error('[状态同步] 同步错误:', error);
    }
  }, [state.settings.email, state.isAuthenticated, state.lastCheckIn, addLog]);

  // 生成协议失效风格的 HTML 邮件内容
  const generateAlertEmailHTML = useCallback((): string => {
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
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: #000000; color: #ff003c; padding: 20px; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; border: 2px solid #ff003c; background: #0a0000; padding: 30px; box-shadow: 0 0 30px rgba(255, 0, 60, 0.3); }
    .header { text-align: center; border-bottom: 1px solid #ff003c; padding-bottom: 20px; margin-bottom: 30px; }
    .alert-title { font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 10px; text-shadow: 0 0 10px #ff003c; animation: blink 1s infinite; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .subtitle { font-size: 14px; color: #ff003c; opacity: 0.8; letter-spacing: 2px; }
    .terminal { background: #000000; border: 1px solid #ff003c; padding: 20px; margin: 20px 0; font-family: 'Courier New', monospace; font-size: 12px; }
    .terminal-line { margin: 8px 0; color: #ff003c; }
    .terminal-line::before { content: "> "; color: #ff003c; }
    .status-failed { color: #ff003c; font-weight: bold; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ff003c; text-align: center; font-size: 10px; color: #ff003c; opacity: 0.6; letter-spacing: 1px; }
    .timestamp { color: #ff003c; opacity: 0.7; font-size: 11px; margin-top: 10px; }
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
      <div style="margin-top: 10px; font-size: 9px;">此邮件由自动化系统发送，请勿回复。</div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }, []);

  // 生成测试邮件 HTML
  const generateTestEmailHTML = useCallback((): string => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试邮件 - Still-Alive</title>
  <style>
    body { font-family: 'Courier New', monospace; background: #000000; color: #00ff41; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; border: 2px solid #00ff41; background: #000a00; padding: 30px; box-shadow: 0 0 30px rgba(0, 255, 65, 0.3); }
    .header { text-align: center; border-bottom: 1px solid #00ff41; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px; color: #00ff41; }
    .terminal { background: #000000; border: 1px solid #00ff41; padding: 20px; margin: 20px 0; font-size: 12px; }
    .terminal-line { margin: 8px 0; color: #00ff41; }
    .terminal-line::before { content: "> "; }
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
  }, []);

  // 发送邮件函数
  // 如果设置了 VITE_EMAIL_PROXY_URL，则使用代理（推荐，避免 CORS 问题）
  // 否则直接调用 Resend API（可能遇到 CORS 错误）
  const sendEmail = useCallback(async (
    to: string, 
    subject: string, 
    html: string
  ): Promise<{ success: boolean; error?: string; messageId?: string }> => {
    const EMAIL_PROXY_URL = import.meta.env.VITE_EMAIL_PROXY_URL;
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

    // 调试信息（生产环境可以移除）
    console.log('[邮件服务] 环境变量检查:', {
      hasProxy: !!EMAIL_PROXY_URL,
      hasApiKey: !!RESEND_API_KEY,
      proxyUrl: EMAIL_PROXY_URL || '未设置',
      envMode: import.meta.env.MODE,
      isProd: import.meta.env.PROD
    });

    // 如果使用代理，不需要 API Key（API Key 在代理服务器上）
    if (!EMAIL_PROXY_URL && !RESEND_API_KEY) {
      const errorMsg = '未配置邮件服务。请在 EdgeOne Pages 的环境变量中设置 VITE_EMAIL_PROXY_URL（推荐）或 VITE_RESEND_API_KEY。';
      console.error('[邮件服务]', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }

    if (!to || !to.includes('@')) {
      return {
        success: false,
        error: '收件人邮箱地址无效。'
      };
    }

    try {
      // 如果设置了代理 URL，使用代理（推荐方式，避免 CORS 问题）
      if (EMAIL_PROXY_URL) {
        const response = await fetch(EMAIL_PROXY_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            html,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        let data;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error('代理返回非 JSON 响应:', {
            status: response.status,
            statusText: response.statusText,
            contentType,
            body: text.substring(0, 500)
          });
          
          return {
            success: false,
            error: `代理服务返回了意外的响应格式。状态码: ${response.status}`
          };
        }

        if (!response.ok) {
          return {
            success: false,
            error: data.error || data.message || `发送失败: ${response.status} ${response.statusText}`
          };
        }

        return {
          success: true,
          messageId: data.id || data.messageId
        };
      }

      // 直接调用 Resend API（可能遇到 CORS 错误）
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        mode: 'cors',
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

      const contentType = response.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Resend API 返回非 JSON 响应:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text.substring(0, 500)
        });
        
        return {
          success: false,
          error: `邮件服务返回了意外的响应格式。状态码: ${response.status}`
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `发送失败: ${response.status} ${response.statusText}`
        };
      }

      return {
        success: true,
        messageId: data.id
      };
    } catch (error) {
      console.error('[邮件服务] 发送错误:', error);
      console.error('[邮件服务] 错误详情:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // 处理 CORS 或网络错误
      if (error instanceof TypeError) {
        // 检查是否是网络错误
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          const errorMsg = '网络错误：无法连接到邮件服务。这通常是因为 CORS 限制 - Resend API 不允许直接从浏览器调用。请使用 Cloudflare Workers 代理（免费）。查看 QUICK-FIX.md 了解如何设置。';
          console.error('[邮件服务]', errorMsg);
          return {
            success: false,
            error: errorMsg
          };
        }
        return {
          success: false,
          error: `网络错误: ${error.message}`
        };
      }
      
      // 处理其他错误
      if (error instanceof Error) {
        // 检查是否是 CORS 错误
        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          const errorMsg = 'CORS 错误：浏览器阻止了跨域请求。Resend API 不允许直接从浏览器调用。请使用 Cloudflare Workers 代理（免费）。查看 QUICK-FIX.md 了解如何设置。';
          console.error('[邮件服务]', errorMsg);
          return {
            success: false,
            error: errorMsg
          };
        }
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: '未知错误：请检查浏览器控制台获取详细信息。'
      };
    }
  }, []);

  // Main System Timer & Status Check
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(() => {
      // 1. Check Status
      const status = checkStatusLogic(state.lastCheckIn, state.settings.alertThresholdHours);
      
      if (status === "ALERT_TRIGGERED") {
        if (!isAlertTriggered) {
          setIsAlertTriggered(true);
          addLog(`[警告] 脉冲信号中断。生命体征检测失败。`);
          
          // 倒计时归零时自动发送告警邮件
          if (!alertEmailSent && state.settings.emergencyEmail) {
            setAlertEmailSent(true);
            setAlertEmailStatus('sending');
            setAlertEmailError('');
            
            sendEmail(
              state.settings.emergencyEmail,
              '[紧急警报] Still-Alive 协议已失效 - 生命体征待确认',
              generateAlertEmailHTML()
            ).then(result => {
              if (result.success) {
                setAlertEmailStatus('success');
                addLog(`[邮件] 紧急告警邮件已发送至: ${state.settings.emergencyEmail}`);
              } else {
                setAlertEmailStatus('error');
                setAlertEmailError(result.error || '发送失败');
                addLog(`[错误] 告警邮件发送失败: ${result.error}`);
              }
            });
          }
        }
      } else {
        if (isAlertTriggered) {
          setIsAlertTriggered(false); // Reset if user checks in
          setAlertEmailSent(false); // 重置邮件发送状态
          setAlertEmailStatus('sending');
          setAlertEmailError('');
        }
      }

      // 2. Random ambiance logs (only if safe)
      if (status === "SAFE" && Math.random() > 0.98) {
         addLog(`[监控] 脉冲频率正常。存活状态确认。`);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [
    state.lastCheckIn, 
    state.settings.alertThresholdHours, 
    state.settings.emergencyEmail,
    state.isAuthenticated, 
    isAlertTriggered, 
    alertEmailSent,
    addLog, 
    sendEmail, 
    generateAlertEmailHTML
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail) return;
    
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      settings: { ...prev.settings, email: tempEmail }
    }));
    setCurrentView(View.DASHBOARD);
    addLog(`[系统] 身份已验证: ${tempEmail}`);
    
    // 记录登录操作
    logAction('LOGIN', { email: tempEmail });
  };

  const handleCheckIn = () => {
    // 1. Update timestamp
    const checkInTime = Date.now();
    setState(prev => ({
      ...prev,
      lastCheckIn: checkInTime
    }));
    
    // 2. Clear alert state if it was active
    setIsAlertTriggered(false);

    // 3. Log
    const packetId = Math.random().toString(16).substring(2, 10).toUpperCase();
    const timestamp = new Date().toLocaleTimeString('zh-CN', {hour12: false});
    addLog(`[脉冲] 生命信号 0x${packetId} 已确认 于 ${timestamp}.`);
    
    // 4. 记录脉冲检查操作
    logAction('PULSE_CHECK', { 
      timestamp: checkInTime,
      packetId 
    });
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emergencyEmail = (form.elements.namedItem('emergencyEmail') as HTMLInputElement).value;
    const threshold = (form.elements.namedItem('threshold') as HTMLSelectElement).value;

    const oldEmergencyEmail = state.settings.emergencyEmail;
    const hasEmergencyEmailChanged = oldEmergencyEmail !== emergencyEmail;

    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        emergencyEmail,
        alertThresholdHours: parseInt(threshold)
      }
    }));
    setCurrentView(View.DASHBOARD);
    addLog(`[配置] 协议已更新。阈值: ${threshold}小时`);
    
    // 如果紧急联系人邮箱发生变化，记录更新操作
    if (hasEmergencyEmailChanged) {
      logAction('UPDATE_EMERGENCY', {
        oldEmergencyEmail,
        newEmergencyEmail: emergencyEmail,
        threshold: parseInt(threshold)
      });
    }
  };

  const handleTestEmail = async () => {
    const testEmail = state.settings.email || state.settings.emergencyEmail;
    
    if (!testEmail) {
      setTestEmailStatus('error');
      setTestEmailMessage('请先设置用户邮箱或紧急联系人邮箱');
      return;
    }

    setTestEmailStatus('sending');
    setTestEmailMessage('正在发送测试邮件...');
    
    const result = await sendEmail(
      testEmail,
      '[测试] Still-Alive 邮件通知功能测试',
      generateTestEmailHTML()
    );
    
    if (result.success) {
      setTestEmailStatus('success');
      setTestEmailMessage('测试邮件发送成功！请检查您的邮箱。');
      addLog(`[测试] 测试邮件已发送至: ${testEmail}`);
      
      // 记录测试发信操作
      logAction('TEST_SEND', {
        recipient: testEmail,
        messageId: result.messageId
      });
    } else {
      setTestEmailStatus('error');
      setTestEmailMessage(result.error || '发送失败');
      addLog(`[错误] 测试邮件发送失败: ${result.error}`);
    }
  };

  return (
    <Layout isAlert={isAlertTriggered}>
      <VIPModal isOpen={isVIPOpen} onClose={() => setIsVIPOpen(false)} />
      
      {/* Alert Overlay */}
      {isAlertTriggered && (
        <AlertOverlay 
          email={state.settings.emergencyEmail}
          emailStatus={alertEmailStatus}
          emailError={alertEmailError}
          onCheckIn={handleCheckIn}
        />
      )}

      {/* LOGIN VIEW */}
      {currentView === View.LOGIN && (
        <div className="flex flex-col items-center justify-center flex-grow h-full animate-in fade-in zoom-in duration-500 my-auto">
          <div className="w-full max-w-md border border-cyber-green p-8 bg-black/60 backdrop-blur shadow-neon relative">
            <h2 className="text-xl mb-6 text-center border-b border-cyber-green/30 pb-4 tracking-widest font-bold">访问控制</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs uppercase mb-2 opacity-80 font-mono">用户标识符</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-black/50 border border-cyber-green p-3 text-cyber-green focus:outline-none focus:shadow-neon transition-all font-mono"
                  placeholder="USER@DOMAIN.COM"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                />
              </div>
              <CyberButton type="submit" className="w-full">
                初始化系统
              </CyberButton>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {currentView === View.DASHBOARD && (
        <div className="flex flex-col h-full w-full animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Interactive Area */}
          <div className="flex-grow flex flex-col justify-center items-center relative py-4">
            <ProgressRing 
              radius={160} 
              stroke={4} 
              lastCheckIn={state.lastCheckIn}
              thresholdHours={state.settings.alertThresholdHours}
            >
              <CyberButton
                variant="round"
                size="xl"
                onClick={handleCheckIn}
                className="relative z-20 mb-8" // mb-8 to offset the text below
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold font-tech mb-1 drop-shadow-lg">我还在</span>
                  <span className="text-[10px] opacity-60 tracking-[0.3em] uppercase">SEND PULSE</span>
                </div>
              </CyberButton>
            </ProgressRing>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <CyberButton onClick={() => setCurrentView(View.SETTINGS)} className="w-full text-xs md:text-sm">
              协议设置
            </CyberButton>
            <CyberButton variant="vip" onClick={() => setIsVIPOpen(true)} className="w-full text-xs md:text-sm">
              VIP 链路
            </CyberButton>
          </div>

          {/* Live Logs */}
          <div className="w-full flex-shrink-0">
             <StatusMonitor logs={logs} />
          </div>
        </div>
      )}

      {/* SETTINGS VIEW */}
      {currentView === View.SETTINGS && (
        <div className="w-full max-w-lg mx-auto animate-in slide-in-from-right-8 duration-300 my-auto">
           <div className="border-l-4 border-cyber-green pl-4 mb-8">
             <h2 className="text-xl font-bold uppercase font-tech">故障保护配置</h2>
             <p className="text-xs opacity-60 font-mono">更新紧急联系人及阈值</p>
           </div>
           
           <form onSubmit={handleSettingsSave} className="space-y-6 bg-black/40 backdrop-blur p-6 border border-cyber-green/20">
              <div>
                <label className="block text-xs uppercase mb-2 opacity-80 flex justify-between font-mono">
                  <span>紧急联系人</span>
                  <span className="text-cyber-red/80 text-[10px]">必填</span>
                </label>
                <input 
                  name="emergencyEmail"
                  type="email" 
                  defaultValue={state.settings.emergencyEmail}
                  className="w-full bg-black/50 border border-cyber-green p-3 focus:shadow-neon focus:outline-none text-sm font-mono"
                  placeholder="contact@rescue.com"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase mb-2 opacity-80 font-mono">超时阈值</label>
                <select 
                  name="threshold"
                  defaultValue={state.settings.alertThresholdHours}
                  className="w-full bg-black/50 border border-cyber-green p-3 focus:shadow-neon focus:outline-none text-cyber-green text-sm font-mono"
                >
                  <option value="24">24 小时</option>
                  <option value="48">48 小时</option>
                  <option value="72">72 小时</option>
                </select>
              </div>

              {/* 测试邮件发送 */}
              <div className="pt-2 pb-2 border-t border-cyber-green/20">
                <label className="block text-xs uppercase mb-3 opacity-80 font-mono">邮件通知测试</label>
                <CyberButton 
                  type="button" 
                  onClick={handleTestEmail}
                  disabled={testEmailStatus === 'sending'}
                  className="w-full mb-2"
                  variant={testEmailStatus === 'success' ? 'vip' : undefined}
                >
                  {testEmailStatus === 'sending' ? '发送中...' : '测试发送邮件'}
                </CyberButton>
                {testEmailStatus !== 'idle' && (
                  <div className={`mt-2 p-2 text-xs font-mono border ${
                    testEmailStatus === 'success' 
                      ? 'border-cyber-green text-cyber-green bg-cyber-green/10' 
                      : testEmailStatus === 'error'
                      ? 'border-cyber-red text-cyber-red bg-cyber-red/10'
                      : 'border-cyber-green/50 text-cyber-green/80'
                  }`}>
                    {testEmailMessage}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-cyber-green/60 font-mono">
                  测试邮件将发送到您的用户邮箱或紧急联系人邮箱
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <CyberButton type="button" variant="danger" onClick={() => setCurrentView(View.DASHBOARD)} className="flex-1">
                  取消
                </CyberButton>
                <CyberButton type="submit" className="flex-1">
                  保存配置
                </CyberButton>
              </div>
           </form>
        </div>
      )}

    </Layout>
  );
}

export default App;