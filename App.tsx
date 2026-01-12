import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { CyberButton } from './components/CyberButton';
import { VIPModal } from './components/VIPModal';
import { StatusMonitor } from './components/StatusMonitor';
import { ProgressRing } from './components/ProgressRing';
import { AlertOverlay } from './components/AlertOverlay';
import { saveState, loadState, checkStatusLogic, saveLogs, loadLogs } from './services/storage';
import { sendTestEmail } from './services/email';
import { UserState, View } from './types';

function App() {
  const [state, setState] = useState<UserState>(() => loadState());
  const [currentView, setCurrentView] = useState<View>(state.isAuthenticated ? View.DASHBOARD : View.LOGIN);
  const [isVIPOpen, setIsVIPOpen] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  
  // UI States
  const [logs, setLogs] = useState<string[]>(() => loadLogs());
  const [isAlertTriggered, setIsAlertTriggered] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testEmailMessage, setTestEmailMessage] = useState<string>('');

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Persist logs changes
  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, message].slice(-50));
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
        }
      } else {
        if (isAlertTriggered) {
          setIsAlertTriggered(false); // Reset if user checks in
        }
      }

      // 2. Random ambiance logs (only if safe)
      if (status === "SAFE" && Math.random() > 0.98) {
         addLog(`[监控] 脉冲频率正常。存活状态确认。`);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [state.lastCheckIn, state.settings.alertThresholdHours, state.isAuthenticated, isAlertTriggered, addLog]);

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
  };

  const handleCheckIn = () => {
    // 1. Update timestamp
    setState(prev => ({
      ...prev,
      lastCheckIn: Date.now()
    }));
    
    // 2. Clear alert state if it was active
    setIsAlertTriggered(false);

    // 3. Log
    const packetId = Math.random().toString(16).substring(2, 10).toUpperCase();
    const timestamp = new Date().toLocaleTimeString('zh-CN', {hour12: false});
    addLog(`[脉冲] 生命信号 0x${packetId} 已确认 于 ${timestamp}.`);
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emergencyEmail = (form.elements.namedItem('emergencyEmail') as HTMLInputElement).value;
    const threshold = (form.elements.namedItem('threshold') as HTMLSelectElement).value;

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
    
    const result = await sendTestEmail(testEmail);
    
    if (result.success) {
      setTestEmailStatus('success');
      setTestEmailMessage('测试邮件发送成功！请检查您的邮箱。');
      addLog(`[测试] 测试邮件已发送至: ${testEmail}`);
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
        <AlertOverlay email={state.settings.emergencyEmail} />
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