import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { Lock, Mail, ArrowRight, ShieldCheck, Check, AlertTriangle, KeyRound, User, Phone, Briefcase, Shield, HelpCircle, Chrome } from 'lucide-react';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { isSupabaseConfigured } from '../services/supabase';
import { isFirebaseConfigured } from '../services/firebase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { addToast } = useToast();
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Register State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    businessName: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  // Welcome Modal
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  // States for 2FA and Lockout
  const [step, setStep] = useState<'credentials' | '2fa' | 'locked'>('credentials');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [lockoutMsg, setLockoutMsg] = useState('');

  // Password Strength State
  const [pwdStrength, setPwdStrength] = useState(0);
  const [pwdChecks, setPwdChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (authService.isLockedOut()) {
      setStep('locked');
      setLockoutMsg(`Muitas tentativas. Bloqueado por ${authService.getLockoutTimeRemaining()}.`);
    }
  }, []);

  const checkPasswordStrength = (pass: string) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*]/.test(pass)
    };
    setPwdChecks(checks);
    const score = Object.values(checks).filter(Boolean).length;
    setPwdStrength(score);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (mode === 'login') {
        setPassword(val);
    } else {
        setRegData({...regData, password: val});
        checkPasswordStrength(val);
    }
  };

  const fillAdmin = () => {
      setEmail('admin@stormcrm.com.br');
      setPassword('admin');
      addToast('Dados de Admin preenchidos', 'info');
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'locked') return;

    if (mode === 'login') {
      // --- LOGIN LOGIC ---
      if (!email || !password) {
        setError('Preencha todos os campos');
        return;
      }

      if (!validateEmail(email)) {
        setError('Formato de email inválido');
        return;
      }

      if (step === 'credentials') {
          try {
              const result = await authService.login(email, password);
              
              if (!result.success) {
                if (result.error?.includes('bloqueada')) {
                  setStep('locked');
                  setLockoutMsg(result.error);
                } else {
                  setError(result.error || 'Erro desconhecido');
                }
              } else if (result.require2FA) {
                setStep('2fa');
              } else {
                // Check trial expiration
                if (authService.isTrialExpired()) {
                  setShowUpgradeModal(true);
                } else {
                  onLogin();
                }
              }
          } catch (e) {
              setError('Erro de conexão.');
          }
      } else if (step === '2fa') {
          const isValid = authService.verify2FA(twoFactorCode);
          if (isValid) {
            onLogin();
          } else {
            setError('Código inválido.');
            if (authService.isLockedOut()) {
              setStep('locked');
              setLockoutMsg(`Bloqueado por ${authService.getLockoutTimeRemaining()}.`);
            }
          }
      }
    } else {
      // --- REGISTER LOGIC ---
      if (!regData.name || !regData.email || !regData.password || !regData.businessName) {
          setError('Todos os campos marcados com * são obrigatórios.');
          return;
      }
      if (!validateEmail(regData.email)) {
          setError('Formato de email inválido.');
          return;
      }
      if (regData.password !== regData.confirmPassword) {
          setError('As senhas não coincidem.');
          return;
      }
      if (!regData.termsAccepted) {
          setError('Você precisa aceitar os Termos de Uso.');
          return;
      }
      if (pwdStrength < 3) {
          setError('Escolha uma senha mais forte.');
          return;
      }

      const result = await authService.register({
          name: regData.name,
          email: regData.email,
          whatsapp: regData.whatsapp,
          businessName: regData.businessName,
          password: regData.password
      });

      if (result.success) {
          if (isSupabaseConfigured()) {
             addToast('Verifique seu email para confirmar o cadastro.', 'success');
             setMode('login');
          } else {
             setShowWelcome(true);
          }
      } else {
          setError(result.error || 'Erro ao criar conta.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const result = await authService.loginWithGoogle();
    if (result.success) {
      onLogin();
    } else {
      setError(result.error || 'Erro ao entrar com Google');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!forgotEmail) {
          addToast('Digite seu email.', 'error');
          return;
      }
      if (!validateEmail(forgotEmail)) {
          addToast('Formato de email inválido.', 'error');
          return;
      }
      const res = await authService.resetPassword(forgotEmail);
      if (res.success) {
          addToast(res.message || 'Email enviado!', 'success');
          setShowForgotModal(false);
          setForgotEmail('');
      } else {
          addToast(res.error || 'Erro ao enviar email.', 'error');
      }
  };

  const closeWelcome = () => {
      setShowWelcome(false);
      onLogin(); // Proceed to app
  };

  const getStrengthColor = () => {
    if (pwdStrength <= 2) return 'bg-storm-red';
    if (pwdStrength === 3) return 'bg-storm-yellow';
    if (pwdStrength === 4) return 'bg-storm-green';
    return 'bg-storm-cyan';
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-storm-purple/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-storm-cyan/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md bg-bg-secondary border border-border p-8 rounded-2xl shadow-xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-storm-purple to-storm-cyan rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-storm-purple/20">
            <span className="font-bold text-white text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Storm CRM</h1>
          <p className="text-text-secondary mt-2">
            {step === 'locked' ? 'Acesso Temporariamente Bloqueado' : 
             mode === 'register' ? 'Crie sua conta e comece grátis' :
             step === '2fa' ? 'Verificação em 2 Etapas' :
             'Entre para gerenciar seu negócio'}
          </p>
        </div>

        {step === 'locked' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-storm-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-storm-red" />
            </div>
            <p className="text-storm-red font-medium">{lockoutMsg}</p>
            <p className="text-text-secondary text-sm mt-4">Por motivos de segurança, aguarde o tempo indicado.</p>
          </div>
        ) : step === '2fa' ? (
           <form onSubmit={handleSubmit} className="space-y-6">
             {/* 2FA UI */}
             <div className="text-center">
                <div className="w-16 h-16 bg-storm-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-storm-cyan/30">
                   <ShieldCheck className="w-8 h-8 text-storm-cyan" />
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Digite o código de 6 dígitos do seu app autenticador.
                </p>
             </div>
             <div>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-bg-tertiary border border-border rounded-lg py-3 text-center text-2xl tracking-[0.5em] font-mono text-text-primary focus:ring-2 focus:ring-storm-cyan focus:border-transparent outline-none transition-all"
                  placeholder="000000"
                  autoFocus
                />
             </div>
             {error && (
                <div className="p-3 bg-storm-red/10 border border-storm-red/20 rounded-lg text-storm-red text-sm text-center">{error}</div>
             )}
             <button type="submit" className="w-full bg-storm-cyan hover:bg-storm-cyan/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                Verificar
             </button>
             <button type="button" onClick={() => setStep('credentials')} className="w-full text-sm text-text-secondary hover:text-text-primary">Voltar</button>
           </form>
        ) : mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border rounded-lg py-2.5 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-text-secondary">Senha</label>
                 <button 
                    type="button" 
                    onClick={() => { setShowForgotModal(true); setForgotEmail(email); }}
                    className="text-xs text-storm-purple hover:text-storm-cyan transition-colors"
                 >
                    Esqueci minha senha
                 </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full bg-bg-tertiary border border-border rounded-lg py-2.5 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-storm-red/10 border border-storm-red/20 rounded-lg text-storm-red text-sm text-center">{error}</div>
            )}

            <button type="submit" className="w-full bg-storm-purple hover:bg-storm-purple/90 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 group">
              Entrar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {isFirebaseConfigured() && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-bg-secondary px-2 text-text-secondary">Ou continue com</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-3 border border-gray-300 shadow-sm"
                >
                  <Chrome className="w-5 h-5 text-[#4285F4]" />
                  Entrar com Google
                </button>
              </>
            )}

            <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-text-secondary">Ainda não tem conta?</p>
                <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-storm-cyan font-bold hover:underline mt-1">
                    Criar Conta - 15 Dias Grátis
                </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
              {/* REGISTER FORM */}
              <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Nome Completo *</label>
                  <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full bg-bg-tertiary border border-border rounded-lg py-2 pl-9 pr-4 text-sm text-text-primary focus:ring-1 focus:ring-storm-purple outline-none" placeholder="Seu nome" />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Nome da Empresa *</label>
                  <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      <input type="text" required value={regData.businessName} onChange={e => setRegData({...regData, businessName: e.target.value})} className="w-full bg-bg-tertiary border border-border rounded-lg py-2 pl-9 pr-4 text-sm text-text-primary focus:ring-1 focus:ring-storm-purple outline-none" placeholder="Ex: Storm TV" />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Email *</label>
                      <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full bg-bg-tertiary border border-border rounded-lg py-2 px-3 text-sm text-text-primary focus:ring-1 focus:ring-storm-purple outline-none" placeholder="email@exemplo.com" />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">WhatsApp *</label>
                      <input type="tel" required value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} className="w-full bg-bg-tertiary border border-border rounded-lg py-2 px-3 text-sm text-text-primary focus:ring-1 focus:ring-storm-purple outline-none" placeholder="11999999999" />
                   </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Senha *</label>
                      <input type="password" required value={regData.password} onChange={handlePasswordChange} className="w-full bg-bg-tertiary border border-border rounded-lg py-2 px-3 text-sm text-text-primary focus:ring-1 focus:ring-storm-purple outline-none" placeholder="******" />
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Confirmar *</label>
                      <input type="password" required value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} className="w-full bg-bg-tertiary border border-border rounded-lg py-2 px-3 text-sm text-text-primary focus:ring-1 focus:ring-storm-purple outline-none" placeholder="******" />
                  </div>
              </div>

              {/* Strength Meter */}
              {regData.password.length > 0 && (
                 <div className="h-1 w-full bg-bg-tertiary rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{ width: `${(pwdStrength / 5) * 100}%` }} />
                 </div>
              )}

              <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" id="terms" checked={regData.termsAccepted} onChange={e => setRegData({...regData, termsAccepted: e.target.checked})} className="mt-1" />
                  <label htmlFor="terms" className="text-xs text-text-secondary cursor-pointer select-none">
                      Li e aceito os <span className="text-storm-purple hover:underline">Termos de Uso</span> e <span className="text-storm-purple hover:underline">Política de Privacidade</span>.
                  </label>
              </div>

              {error && <div className="p-2 bg-storm-red/10 border border-storm-red/20 rounded text-storm-red text-xs text-center">{error}</div>}

              <button type="submit" className="w-full bg-storm-purple hover:bg-storm-purple/90 text-white font-bold py-2.5 rounded-lg transition-colors">
                  Criar Conta
              </button>

              <div className="text-center">
                  <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-xs text-text-secondary hover:text-text-primary hover:underline">
                      Já tenho conta. Fazer Login.
                  </button>
              </div>
          </form>
        )}

        <p className="text-center text-xs text-text-secondary mt-6">
          v3.0 • Secure Local Storage • 2FA Enabled
          {isSupabaseConfigured() && <span className="block text-storm-green">Supabase Connected</span>}
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} title="Recuperar Senha">
         <div className="space-y-4">
             <div className="text-center p-2">
                <div className="w-16 h-16 mx-auto bg-bg-tertiary rounded-full flex items-center justify-center mb-2">
                   <KeyRound className="w-8 h-8 text-storm-purple" />
                </div>
                <p className="text-sm text-text-secondary">
                    Digite seu email cadastrado para receber um link de redefinição de senha.
                </p>
             </div>
             <form onSubmit={handleForgotSubmit}>
                 <div className="mb-4">
                     <label className="block text-xs font-medium text-text-secondary mb-1">Seu Email</label>
                     <input 
                       type="email" 
                       required
                       value={forgotEmail} 
                       onChange={e => setForgotEmail(e.target.value)} 
                       placeholder="seu@email.com"
                       className="w-full bg-bg-tertiary border border-border rounded-lg p-3 text-text-primary outline-none focus:ring-2 focus:ring-storm-purple"
                     />
                 </div>
                 <button type="submit" className="w-full bg-storm-purple hover:bg-storm-purple/90 text-white font-bold py-2.5 rounded-lg transition-colors">
                     Enviar Email de Recuperação
                 </button>
             </form>
         </div>
      </Modal>

      {/* Welcome Modal */}
      <Modal isOpen={showWelcome} onClose={() => {}} title="Bem-vindo ao Storm CRM!">
          <div className="text-center">
             <div className="w-16 h-16 mx-auto bg-storm-green/20 rounded-full flex items-center justify-center text-2xl mb-4">🎉</div>
             <h3 className="text-xl font-bold text-text-primary mb-2">Conta criada com sucesso!</h3>
             <p className="text-text-secondary mb-6">
                 Seu teste grátis de <strong>15 dias</strong> começou agora.<br/>
                 Aproveite todos os recursos ilimitados durante este período.
             </p>
             <button onClick={closeWelcome} className="w-full bg-storm-purple text-white py-3 rounded-lg font-bold hover:bg-storm-purple/90">
                 Começar a Usar
             </button>
          </div>
      </Modal>

      {/* Upgrade/Payment Modal */}
      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Assinatura Expirada">
          <div className="text-center p-2">
             <div className="w-16 h-16 mx-auto bg-storm-red/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-storm-red" />
             </div>
             <h3 className="text-xl font-bold text-text-primary mb-2">Seu período de teste acabou!</h3>
             <p className="text-text-secondary mb-6">
                Para continuar utilizando o Storm CRM e gerenciar seus clientes, atualize para o <strong>Plano Pro</strong>.
             </p>
             
             <div className="bg-bg-tertiary border border-border rounded-xl p-6 mb-6 text-left">
                <div className="flex justify-between items-center mb-4">
                   <span className="font-bold text-lg text-text-primary">Plano Pro</span>
                   <span className="text-storm-green font-bold text-xl">R$ 49,90 <small className="text-xs text-text-secondary">/mês</small></span>
                </div>
                
                <div className="space-y-3 mb-6">
                   <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-storm-green" /> Clientes Ilimitados
                   </div>
                   <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-storm-green" /> Leads Ilimitados
                   </div>
                   <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-storm-green" /> Suporte VIP via WhatsApp
                   </div>
                </div>

                <div className="border-t border-border pt-4">
                   <p className="text-xs font-bold text-text-secondary uppercase mb-3">Pagamento via PIX</p>
                   <div className="bg-bg-secondary p-3 rounded-lg border border-dashed border-storm-purple/50 flex items-center justify-between mb-4">
                      <code className="text-storm-purple font-mono font-bold">19 98837 40258</code>
                      <button 
                        onClick={() => { navigator.clipboard.writeText('199883740258'); addToast('Chave PIX copiada!', 'success'); }}
                        className="text-[10px] bg-storm-purple/10 text-storm-purple px-2 py-1 rounded hover:bg-storm-purple/20"
                      >
                        Copiar
                      </button>
                   </div>
                   <p className="text-[10px] text-text-secondary leading-relaxed">
                      * Após o pagamento, envie o comprovante para o WhatsApp acima para liberar sua licença imediatamente.
                   </p>
                </div>
             </div>

             <a 
               href="https://wa.me/55199883740258?text=Olá! Acabei de fazer o pagamento do Storm CRM Pro. Segue o comprovante."
               target="_blank"
               rel="noreferrer"
               className="w-full bg-storm-green text-white py-3 rounded-lg font-bold hover:bg-storm-green/90 flex items-center justify-center gap-2 shadow-lg shadow-storm-green/20"
             >
                <Phone className="w-5 h-5" />
                Enviar Comprovante via WhatsApp
             </a>
          </div>
      </Modal>
    </div>
  );
};

export default Login;