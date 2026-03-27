import React from 'react';
import { Check, Phone, AlertTriangle } from 'lucide-react';
import { authService } from '../services/auth';
import { useToast } from '../contexts/ToastContext';
import { PLANS } from '../constants';

const Subscription: React.FC = () => {
  const { addToast } = useToast();
  const user = authService.getUserProfile();
  const currentPlan = authService.getCurrentPlan();
  const trialDays = authService.getTrialDaysRemaining();
  const isExpired = authService.isTrialExpired();

  const proPlan = PLANS.find(p => p.id === 'professional')!;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">Assinatura e Planos</h2>
        <p className="text-text-secondary">Gerencie sua licença e limites do Storm CRM</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Status */}
        <div className="bg-bg-secondary border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4">Status Atual</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-bg-tertiary rounded-lg">
              <span className="text-text-secondary text-sm">Plano</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${currentPlan.id === 'starter' ? 'bg-bg-secondary text-text-secondary' : 'bg-storm-green/10 text-storm-green'}`}>
                {currentPlan.nome.toUpperCase()}
              </span>
            </div>

            {user?.subscriptionStatus === 'trial' && (
              <div className={`p-4 rounded-lg border ${isExpired ? 'bg-storm-red/10 border-storm-red/20' : 'bg-storm-cyan/10 border-storm-cyan/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-5 h-5 ${isExpired ? 'text-storm-red' : 'text-storm-cyan'}`} />
                  <span className={`font-bold ${isExpired ? 'text-storm-red' : 'text-storm-cyan'}`}>
                    {isExpired ? 'Período de Teste Expirado' : 'Período de Teste Ativo'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {isExpired 
                    ? 'Seu acesso foi limitado. Atualize para o Pro para continuar.' 
                    : `Você tem ${trialDays} dias restantes de teste grátis.`}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-text-secondary uppercase mb-3">Seus Limites</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Leads (Testes)</span>
                  <span className="text-text-primary font-medium">{currentPlan.limites.leads === -1 ? 'Ilimitado' : `Até ${currentPlan.limites.leads}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Clientes Ativos</span>
                  <span className="text-text-primary font-medium">{currentPlan.limites.clientes === -1 ? 'Ilimitado' : `Até ${currentPlan.limites.clientes}`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-storm-green/30 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-storm-green/5">
          <div className="absolute top-0 right-0 bg-storm-green text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Recomendado
          </div>

          <h3 className="text-xl font-bold text-text-primary mb-2">Plano Pro</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-3xl font-bold text-storm-green">R$ 49,90</span>
            <span className="text-text-secondary text-sm">/mês</span>
          </div>

          <ul className="space-y-3 mb-8">
            {proPlan.recursos.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-storm-green" /> {r}
              </li>
            ))}
          </ul>

          <div className="bg-bg-primary/50 border border-border rounded-xl p-4 mb-6">
            <p className="text-[10px] font-bold text-text-secondary uppercase mb-2">Pagamento via PIX</p>
            <div className="flex items-center justify-between gap-2">
              <code className="text-storm-purple font-mono font-bold text-sm">19 98837 40258</code>
              <button 
                onClick={() => { navigator.clipboard.writeText('199883740258'); addToast('Chave PIX copiada!', 'success'); }}
                className="text-[10px] bg-storm-purple/10 text-storm-purple px-2 py-1 rounded hover:bg-storm-purple/20 transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>

          <a 
            href="https://wa.me/55199883740258?text=Olá! Quero ativar o Plano Pro do Storm CRM. Já fiz o PIX de R$ 49,90."
            target="_blank"
            rel="noreferrer"
            className="w-full bg-storm-green hover:bg-storm-green/90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-storm-green/20"
          >
            <Phone className="w-5 h-5" />
            Ativar via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
