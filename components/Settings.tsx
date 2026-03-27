import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { authService } from '../services/auth';
import { isSupabaseConfigured } from '../services/supabase';
import { Download, Upload, Trash2, ShieldAlert, Save, Lock, Smartphone, Shield, Globe, Clock, AlertTriangle, Key, Monitor, CheckCircle2, History, Database } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { UserSession, SecurityLog } from '../types';
import Modal from './ui/Modal';

const Settings: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [userProfile, setUserProfile] = useState(authService.getUserProfile());

  // Security States
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(1);
  const [verifyCode, setVerifyCode] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  
  // Password Change
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [pwdChecks, setPwdChecks] = useState({ length: false, upper: false, lower: false, number: false, special: false });

  useEffect(() => {
    if (activeTab === 'security') {
      loadSecurityData();
    }
  }, [activeTab]);

  const loadSecurityData = () => {
    setSessions(authService.getActiveSessions());
    setLogs(authService.getSecurityLogs());
    setUserProfile(authService.getUserProfile());
  };

  // --- GENERAL TAB HANDLERS ---
  const handleBackup = () => {
    try {
      const data = storageService.createBackup();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storm_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      authService.logEvent('DATA_EXPORT');
      addToast('Backup gerado e baixado com sucesso!', 'success');
    } catch (e) {
      addToast('Erro ao gerar backup.', 'error');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
              if (confirm('ATENÇÃO: Isso irá substituir todos os dados atuais pelos do backup. Deseja continuar?')) {
                  const success = storageService.restoreBackup(content);
                  if (success) {
                      alert('Backup restaurado com sucesso! A página será recarregada.');
                      window.location.reload();
                  } else {
                      addToast('Erro ao restaurar arquivo. Formato inválido.', 'error');
                  }
              }
          }
      };
      reader.readAsText(file);
  };

  const handleReset = () => {
      const confirmation = prompt("DIGITE 'DELETAR' PARA CONFIRMAR O RESET TOTAL DO SISTEMA:");
      if (confirmation === 'DELETAR') {
          storageService.fullReset();
      }
  };

  // --- SECURITY TAB HANDLERS ---

  const checkPwdStrength = (p: string) => {
    setPwdChecks({
        length: p.length >= 8,
        upper: /[A-Z]/.test(p),
        lower: /[a-z]/.test(p),
        number: /[0-9]/.test(p),
        special: /[!@#$%^&*]/.test(p)
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (passData.new !== passData.confirm) {
          addToast('As senhas novas não coincidem.', 'error');
          return;
      }
      if (!Object.values(pwdChecks).every(Boolean)) {
          addToast('A nova senha não atende aos requisitos de segurança.', 'error');
          return;
      }
      
      if (userProfile && passData.current === userProfile.password) {
          authService.updateUserProfile({ ...userProfile, password: passData.new });
          authService.logEvent('PASSWORD_CHANGED');
          addToast('Senha alterada com sucesso!', 'success');
          setPassData({ current: '', new: '', confirm: '' });
      } else {
          addToast('Senha atual incorreta.', 'error');
          authService.recordFailedAttempt(); // Treat as failed attempt
      }
  };

  const start2FASetup = () => {
      // Simulate Secret Generation (Base32 like)
      const secret = "JBSWY3DPEHPK3PXP"; 
      setGeneratedSecret(secret);
      
      // Generate Backup Codes
      const codes = Array.from({length: 8}, () => Math.random().toString(36).substr(2, 8).toUpperCase());
      setGeneratedBackupCodes(codes);
      
      setTwoFactorStep(1);
      setShow2FAModal(true);
  };

  const confirm2FA = () => {
      // Simulation: Accept any 6 digit code or specifically 123456
      if (verifyCode.length === 6) {
          authService.enable2FA(generatedSecret, generatedBackupCodes);
          setShow2FAModal(false);
          loadSecurityData();
          addToast('Autenticação de 2 Fatores ativada!', 'success');
      } else {
          addToast('Código inválido.', 'error');
      }
  };

  const disable2FA = () => {
      if (confirm('Tem certeza que deseja desativar a proteção 2FA?')) {
          authService.disable2FA();
          loadSecurityData();
          addToast('2FA desativado.', 'info');
      }
  };

  const revokeSession = (id: string) => {
      authService.logout(id);
      loadSecurityData();
      addToast('Sessão encerrada.', 'success');
  };

  const renderGeneralTab = () => (
      <div className="space-y-6">
        <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-bg-tertiary">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Save className="w-5 h-5 text-storm-cyan" />
                    Gerenciamento de Dados
                </h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-bg-primary/30">
                    <div>
                        <h4 className="font-medium text-text-primary mb-1">Fazer Backup (Local)</h4>
                        <p className="text-sm text-text-secondary">Baixe uma cópia de segurança de todos os seus clientes e dados.</p>
                    </div>
                    <button onClick={handleBackup} className="px-4 py-2 bg-storm-cyan hover:bg-storm-cyan/90 text-white rounded-lg flex items-center gap-2 transition-colors font-medium">
                        <Download className="w-4 h-4" />
                        Baixar .JSON
                    </button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-bg-primary/30">
                    <div>
                        <h4 className="font-medium text-text-primary mb-1">Restaurar Dados</h4>
                        <p className="text-sm text-text-secondary">Importe um arquivo de backup para recuperar suas informações.</p>
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary border border-border text-text-primary rounded-lg flex items-center gap-2 transition-colors font-medium">
                        <Upload className="w-4 h-4" />
                        Selecionar Arquivo
                        <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                    </label>
                </div>
                
                {isSupabaseConfigured() && (
                    <div className="flex items-center justify-between p-4 border border-storm-green/30 rounded-lg bg-storm-green/5">
                        <div>
                            <h4 className="font-medium text-text-primary mb-1">Migração para Nuvem (Supabase)</h4>
                            <p className="text-sm text-text-secondary">Supabase detectado. Seus dados novos já estão sendo salvos na nuvem.</p>
                        </div>
                        <div className="px-4 py-2 bg-storm-green/20 text-storm-green rounded-lg flex items-center gap-2 font-medium">
                            <Database className="w-4 h-4" />
                            Conectado
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="border border-storm-red/30 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-storm-red/20 bg-storm-red/5">
                <h3 className="font-semibold text-storm-red flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    Zona de Perigo
                </h3>
            </div>
            <div className="p-6 bg-bg-secondary">
                 <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-text-primary mb-1">Resetar Sistema</h4>
                        <p className="text-sm text-text-secondary">Apaga TODOS os dados locais e reinicia a aplicação como nova.</p>
                    </div>
                    <button onClick={handleReset} className="px-4 py-2 bg-transparent border border-storm-red text-storm-red hover:bg-storm-red hover:text-white rounded-lg flex items-center gap-2 transition-all font-medium">
                        <Trash2 className="w-4 h-4" />
                        Resetar Tudo
                    </button>
                </div>
            </div>
        </div>
      </div>
  );

  const renderSecurityTab = () => (
      <div className="space-y-6">
          {/* 2FA Section */}
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-bg-tertiary flex justify-between">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-storm-purple" />
                      Autenticação de 2 Fatores (2FA)
                  </h3>
                  {userProfile?.twoFactorEnabled && (
                      <span className="text-xs bg-storm-green/20 text-storm-green px-2 py-1 rounded font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ATIVO
                      </span>
                  )}
              </div>
              <div className="p-6">
                  <p className="text-sm text-text-secondary mb-4">
                      Adicione uma camada extra de segurança à sua conta exigindo um código do seu celular ao fazer login.
                  </p>
                  {userProfile?.twoFactorEnabled ? (
                       <div className="flex items-center gap-4">
                           <button onClick={disable2FA} className="px-4 py-2 border border-storm-red text-storm-red hover:bg-storm-red/10 rounded-lg text-sm font-medium transition-colors">
                               Desativar 2FA
                           </button>
                           <p className="text-xs text-text-secondary">Códigos de backup restantes: <strong>{userProfile.backupCodes?.length || 0}</strong></p>
                       </div>
                  ) : (
                      <button onClick={start2FASetup} className="px-4 py-2 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-lg text-sm font-medium transition-colors">
                          Ativar Autenticação de 2 Fatores
                      </button>
                  )}
              </div>
          </div>

          {/* Password Change */}
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-bg-tertiary">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                      <Lock className="w-5 h-5 text-storm-cyan" />
                      Alterar Senha
                  </h3>
              </div>
              <div className="p-6">
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div>
                          <label className="block text-xs text-text-secondary mb-1">Senha Atual</label>
                          <input 
                              type="password" 
                              required
                              value={passData.current}
                              onChange={e => setPassData({...passData, current: e.target.value})}
                              className="w-full bg-bg-tertiary border border-border rounded-lg p-2 text-text-primary focus:ring-1 focus:ring-storm-cyan outline-none" 
                          />
                      </div>
                      <div>
                          <label className="block text-xs text-text-secondary mb-1">Nova Senha</label>
                          <input 
                              type="password" 
                              required
                              value={passData.new}
                              onChange={e => {
                                  setPassData({...passData, new: e.target.value});
                                  checkPwdStrength(e.target.value);
                              }}
                              className="w-full bg-bg-tertiary border border-border rounded-lg p-2 text-text-primary focus:ring-1 focus:ring-storm-cyan outline-none" 
                          />
                          {/* Strength Checklist */}
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-text-secondary">
                              <div className={pwdChecks.length ? 'text-storm-green' : ''}>• Min 8 caracteres</div>
                              <div className={pwdChecks.upper ? 'text-storm-green' : ''}>• Maiúscula (A-Z)</div>
                              <div className={pwdChecks.lower ? 'text-storm-green' : ''}>• Minúscula (a-z)</div>
                              <div className={pwdChecks.number ? 'text-storm-green' : ''}>• Número (0-9)</div>
                              <div className={pwdChecks.special ? 'text-storm-green' : ''}>• Especial (!@#)</div>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs text-text-secondary mb-1">Confirmar Nova Senha</label>
                          <input 
                              type="password" 
                              required
                              value={passData.confirm}
                              onChange={e => setPassData({...passData, confirm: e.target.value})}
                              className="w-full bg-bg-tertiary border border-border rounded-lg p-2 text-text-primary focus:ring-1 focus:ring-storm-cyan outline-none" 
                          />
                      </div>
                      <button type="submit" className="px-4 py-2 bg-bg-tertiary hover:bg-storm-cyan hover:text-white text-text-primary border border-border rounded-lg text-sm font-medium transition-colors">
                          Atualizar Senha
                      </button>
                  </form>
              </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-bg-tertiary">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-storm-orange" />
                      Sessões Ativas
                  </h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-bg-tertiary/50 text-text-secondary">
                          <tr>
                              <th className="p-3">Dispositivo</th>
                              <th className="p-3">IP</th>
                              <th className="p-3">Último Acesso</th>
                              <th className="p-3 text-right">Ação</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {sessions.map(session => {
                              const isCurrent = session.id === JSON.parse(localStorage.getItem('storm_auth_session') || '{}').id;
                              return (
                                  <tr key={session.id} className="hover:bg-bg-tertiary/20">
                                      <td className="p-3">
                                          <div className="font-medium text-text-primary flex items-center gap-2">
                                              {session.device === 'Mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                              {session.browser} / {session.device}
                                              {isCurrent && <span className="text-[10px] bg-storm-green/20 text-storm-green px-1.5 rounded">ATUAL</span>}
                                          </div>
                                      </td>
                                      <td className="p-3 text-text-secondary font-mono text-xs">{session.ip}</td>
                                      <td className="p-3 text-text-secondary">
                                          {new Date(session.lastActive).toLocaleDateString()} {new Date(session.lastActive).toLocaleTimeString()}
                                      </td>
                                      <td className="p-3 text-right">
                                          {!isCurrent && (
                                              <button onClick={() => revokeSession(session.id)} className="text-storm-red hover:bg-storm-red/10 px-2 py-1 rounded text-xs font-bold">
                                                  Encerrar
                                              </button>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Security Logs */}
          <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border bg-bg-tertiary">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                      <History className="w-5 h-5 text-text-secondary" />
                      Histórico de Segurança
                  </h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-bg-tertiary/50 text-text-secondary sticky top-0">
                          <tr>
                              <th className="p-3">Data/Hora</th>
                              <th className="p-3">Evento</th>
                              <th className="p-3">Detalhes</th>
                              <th className="p-3 text-right">IP</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          {logs.map(log => (
                              <tr key={log.id} className="hover:bg-bg-tertiary/20">
                                  <td className="p-3 text-text-secondary text-xs">
                                      {new Date(log.timestamp).toLocaleString()}
                                  </td>
                                  <td className="p-3 font-medium text-text-primary">
                                      {log.event.replace(/_/g, ' ')}
                                  </td>
                                  <td className="p-3 text-text-secondary text-xs">{log.details || '-'}</td>
                                  <td className="p-3 text-right text-text-secondary text-xs font-mono">{log.ip}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Configurações</h2>
        
        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
            <button 
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'general' ? 'border-storm-purple text-storm-purple' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
                Geral
            </button>
            <button 
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'security' ? 'border-storm-purple text-storm-purple' : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
                <Shield className="w-4 h-4" />
                Segurança
            </button>
        </div>

        {activeTab === 'general' ? renderGeneralTab() : renderSecurityTab()}

        <div className="mt-8 text-center text-xs text-text-secondary">
            Storm CRM v3.0 - Build Security Patch
        </div>

        {/* 2FA Setup Modal */}
        <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="Configurar 2FA">
            {twoFactorStep === 1 && (
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                        1. Baixe o <strong>Google Authenticator</strong> ou <strong>Authy</strong> no seu celular.<br/>
                        2. Escaneie o QR Code abaixo (Simulado):
                    </p>
                    <div className="flex justify-center my-4">
                        <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center">
                             {/* Mock QR Code */}
                            <div className="w-full h-full bg-black/10 flex items-center justify-center text-xs text-black font-mono text-center">
                                [QR CODE SIMULADO]<br/>Secret: {generatedSecret}
                            </div>
                        </div>
                    </div>
                    <div className="bg-bg-tertiary p-3 rounded-lg">
                        <p className="text-xs text-text-secondary mb-1">Códigos de Backup (Guarde em local seguro!):</p>
                        <div className="grid grid-cols-2 gap-2">
                            {generatedBackupCodes.slice(0, 4).map(c => <code key={c} className="text-xs font-mono bg-black/20 px-2 py-1 rounded">{c}</code>)}
                        </div>
                    </div>
                    <button onClick={() => setTwoFactorStep(2)} className="w-full btn-primary bg-storm-purple hover:bg-storm-purple/90 text-white py-2 rounded-lg">
                        Próximo
                    </button>
                </div>
            )}

            {twoFactorStep === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                        3. Digite o código de 6 dígitos gerado pelo aplicativo para confirmar.
                    </p>
                    <input 
                        type="text" 
                        placeholder="000 000"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        className="w-full text-center text-2xl tracking-widest bg-bg-tertiary border border-border rounded-lg py-3 focus:ring-2 focus:ring-storm-purple outline-none"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setTwoFactorStep(1)} className="flex-1 py-2 border border-border rounded-lg hover:bg-bg-tertiary">Voltar</button>
                        <button onClick={confirm2FA} className="flex-1 bg-storm-purple text-white py-2 rounded-lg hover:bg-storm-purple/90">Confirmar</button>
                    </div>
                </div>
            )}
        </Modal>
    </div>
  );
};

export default Settings;