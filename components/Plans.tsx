import React, { useState } from 'react';
import { PLANS } from '../constants';
import { authService } from '../services/auth';
import { Plan, PlanId } from '../types';
import { Check, Star, Zap, Shield, HelpCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface PlansProps {
  onPlanSelected?: () => void; // Callback when plan is updated
}

const Plans: React.FC<PlansProps> = ({ onPlanSelected }) => {
  const { addToast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const currentPlan = authService.getCurrentPlan();
  const trialDays = authService.getTrialDaysRemaining();
  const isExpired = authService.isTrialExpired();

  const handleSubscribe = (planId: PlanId) => {
    // In a real app, this would redirect to Stripe/Gateway
    if (window.confirm(`Confirmar assinatura do plano ${planId.toUpperCase()}? (Simulação de Pagamento)`)) {
       authService.updatePlan(planId);
       addToast(`Plano ${planId} ativado com sucesso!`, 'success');
       if (onPlanSelected) onPlanSelected();
       else window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-6 flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Escolha o plano ideal para você</h1>
          <p className="text-text-secondary text-lg">
             Gerencie seus clientes de IPTV com a melhor tecnologia do mercado.
          </p>
          
          {isExpired && (
             <div className="mt-4 p-3 bg-storm-red/10 border border-storm-red/30 rounded-lg inline-block text-storm-red font-bold animate-pulse">
                Seu período de teste expirou. Assine para continuar.
             </div>
          )}

          {/* Toggle */}
          <div className="flex items-center justify-center mt-8 gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-white' : 'text-text-secondary'}`}>Mensal</span>
            <button 
               onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
               className="w-14 h-7 bg-bg-tertiary rounded-full relative border border-border transition-colors focus:outline-none"
            >
               <div className={`absolute top-1 left-1 w-4 h-4 bg-storm-purple rounded-full transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-white' : 'text-text-secondary'}`}>
               Anual <span className="text-storm-green text-xs ml-1">(Economize 2 meses)</span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {PLANS.map(plan => {
             const isCurrent = currentPlan.id === plan.id && !isExpired;
             const price = billingCycle === 'monthly' ? plan.precoMensal : (plan.precoAnual / 12);
             
             return (
               <div 
                 key={plan.id} 
                 className={`
                    relative bg-bg-secondary rounded-2xl p-8 border-2 transition-transform duration-300 hover:-translate-y-2
                    ${plan.popular ? 'border-storm-purple shadow-xl shadow-storm-purple/10' : 'border-border'}
                    ${isCurrent ? 'ring-2 ring-storm-green ring-offset-2 ring-offset-bg-primary' : ''}
                 `}
               >
                 {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-storm-purple text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                       <Star className="w-3 h-3 fill-current" /> MAIS POPULAR
                    </div>
                 )}

                 <h3 className="text-xl font-bold text-text-primary mb-2 capitalize">{plan.nome}</h3>
                 <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-sm text-text-secondary">R$</span>
                    <span className="text-4xl font-bold text-white">{price.toFixed(2)}</span>
                    <span className="text-text-secondary">/mês</span>
                 </div>

                 <p className="text-sm text-text-secondary mb-6 border-b border-border pb-6">
                    {billingCycle === 'yearly' ? `Faturado R$ ${plan.precoAnual.toFixed(2)} anualmente` : 'Faturado mensalmente'}
                 </p>

                 <ul className="space-y-4 mb-8">
                    {/* Limites Display */}
                    <li className="flex items-center gap-3 text-sm">
                       <Zap className="w-4 h-4 text-storm-purple" />
                       <span className="text-text-primary">
                          {plan.limites.clientes === -1 ? 'Clientes Ilimitados' : <strong>{plan.limites.clientes} clientes</strong>}
                       </span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                       <Shield className="w-4 h-4 text-storm-cyan" />
                       <span className="text-text-primary">
                          {plan.limites.stormAI === -1 ? 'IA Ilimitada' : <strong>{plan.limites.stormAI} consultas IA/mês</strong>}
                       </span>
                    </li>

                    {plan.recursos.map((feature, idx) => (
                       <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                          <Check className="w-4 h-4 text-storm-green mt-0.5 shrink-0" />
                          {feature}
                       </li>
                    ))}
                 </ul>

                 <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent}
                    className={`
                       w-full py-3 rounded-xl font-bold transition-all
                       ${plan.popular 
                          ? 'bg-storm-purple hover:bg-storm-purple/90 text-white' 
                          : 'bg-bg-tertiary hover:bg-bg-primary text-text-primary border border-border'}
                       ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                 >
                    {isCurrent ? 'Plano Atual' : 'Assinar Agora'}
                 </button>
               </div>
             );
           })}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center border-t border-border pt-8">
           <div className="inline-flex items-center gap-2 text-text-secondary bg-bg-secondary px-4 py-2 rounded-lg border border-border">
              <HelpCircle className="w-4 h-4" />
              <span>Dúvidas? Fale com nosso suporte no WhatsApp: <strong>(19) 99339-2902</strong></span>
           </div>
           
           <div className="mt-4 flex justify-center gap-4 text-xs text-text-secondary">
              <span>💳 Pagamento seguro via Pix</span>
              <span>🔒 Dados criptografados</span>
              <span>⚡ Ativação imediata</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;