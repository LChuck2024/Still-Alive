import React, { useState, useEffect } from 'react';
import { CyberButton } from './CyberButton';

interface VIPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'MENU' | 'PAYMENT' | 'SUCCESS';

export const VIPModal: React.FC<VIPModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('MENU');
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) setStep('MENU');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setLoadingPayment(true);
    setTimeout(() => {
      setLoadingPayment(false);
      setStep('SUCCESS');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      {/* Container with terminal border */}
      <div className="bg-cyber-black border border-cyber-yellow w-full max-w-sm relative shadow-[0_0_50px_rgba(250,204,21,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-cyber-yellow/10 border-b border-cyber-yellow/30 p-2 flex justify-between items-center">
            <span className="text-cyber-yellow text-xs font-mono uppercase tracking-widest">VIP_接入终端</span>
            <button onClick={onClose} className="text-cyber-yellow hover:bg-cyber-yellow hover:text-black px-2 text-xs">X</button>
        </div>

        <div className="p-6">
          {step === 'MENU' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-cyber-yellow mb-2 uppercase font-tech glitch-text">
                升级协议
              </h2>
              <div className="text-sm text-cyber-yellow/80 mb-6 font-mono border-l-2 border-cyber-yellow/50 pl-4 space-y-2">
                <p>{'>'} 启用短信 (SMS) 紧急信道</p>
                <p>{'>'} 卫星定位追踪 (GPS Level 2)</p>
                <p>{'>'} 移除系统广告</p>
              </div>
              
              <div className="bg-cyber-yellow/5 border border-dashed border-cyber-yellow/30 p-3 mb-6">
                 <div className="flex justify-between text-cyber-yellow text-xs mb-1">
                   <span>标准版</span>
                   <span className="line-through opacity-50">¥ 99.00</span>
                 </div>
                 <div className="flex justify-between text-cyber-yellow text-lg font-bold">
                   <span>黑客特惠</span>
                   <span>¥ 9.90</span>
                 </div>
              </div>

              <CyberButton variant="vip" onClick={() => setStep('PAYMENT')} className="w-full">
                初始化交易
              </CyberButton>
            </div>
          )}

          {step === 'PAYMENT' && (
            <div className="animate-in fade-in slide-in-from-right duration-300 text-center">
              <div className="mb-4 relative inline-block">
                 {/* QR Code Container */}
                 <div className="w-48 h-48 bg-white p-2 mx-auto relative overflow-hidden">
                    <img 
                      src="/qr_code.JPG" 
                      alt="Payment QR" 
                      className={`w-full h-full object-contain ${loadingPayment ? 'blur-sm opacity-50' : ''}`}
                      onError={(e) => {
                        // Fallback if user hasn't replaced the image yet
                        e.currentTarget.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PleaseReplaceFile";
                      }}
                    />
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-scan opacity-50 shadow-[0_0_10px_red]"></div>
                 </div>
                 
                 {loadingPayment && (
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-black text-cyber-yellow text-xs px-2 py-1 animate-pulse border border-cyber-yellow">
                        正在验证区块链...
                      </span>
                   </div>
                 )}
              </div>
              
              <p className="text-xs text-cyber-yellow/60 mb-6 font-mono">
                 扫描二维码以传输信用点.<br/>
                 通道加密等级: AES-256
              </p>

              <div className="flex gap-2">
                 <CyberButton variant="danger" size="sm" onClick={() => setStep('MENU')} className="flex-1 text-[10px]">
                   取消
                 </CyberButton>
                 <CyberButton variant="vip" size="sm" onClick={handleSimulatePayment} disabled={loadingPayment} className="flex-1 text-[10px]">
                   {loadingPayment ? '处理中...' : '我已支付'}
                 </CyberButton>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
             <div className="animate-in zoom-in duration-300 flex flex-col items-center justify-center py-4">
                <div className="w-16 h-16 rounded-full border-2 border-cyber-yellow flex items-center justify-center mb-4 text-cyber-yellow text-3xl animate-bounce">
                  ✓
                </div>
                <h3 className="text-xl text-cyber-yellow font-bold mb-2">访问已授权</h3>
                <p className="text-xs text-cyber-yellow/60 text-center mb-6">
                  VIP 协议已激活。<br/>
                  系统将在 3 秒后重启界面...
                </p>
                <CyberButton variant="vip" onClick={onClose} className="w-full">
                   立即返回
                </CyberButton>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};