import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { UserProfile, Cliente } from '../types';

interface OnboardingProps {
  user: UserProfile | null;
  clientesCount: number;
  onNavigate: (tab: number) => void;
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ user, clientesCount, onNavigate, onClose }) => {
  const steps = [
    { id: 1, label: 'Criar conta', done: true },
    { id: 2, label: 'Fazer primeiro login', done: true },
    { id: 3, label: 'Configurar dados da empresa', done: !!user?.businessName, action: () => onNavigate(10) }, // Settings tab
    { id: 4, label: 'Adicionar primeiro cliente', done: clientesCount > 0, action: () => onNavigate(2) }, // Clients tab
  ];

  const completed = steps.filter(s => s.done).length;
  const progress = (completed / steps.length) * 100;

  if (completed === steps.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-bg-secondary border border-border rounded-xl shadow-2xl p-5 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-text-primary">🚀 Vamos começar?</h3>
        <button onClick={onClose} className="text-xs text-text-secondary hover:text-text-primary">Pular</button>
      </div>
      
      <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden mb-4">
        <div className="h-full bg-storm-purple transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-3">
        {steps.map(step => (
          <div 
            key={step.id} 
            onClick={() => !step.done && step.action && step.action()}
            className={`flex items-center gap-3 text-sm ${step.done ? 'opacity-50' : 'cursor-pointer hover:text-storm-purple transition-colors'}`}
          >
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-storm-green flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-text-secondary flex-shrink-0" />
            )}
            <span className={step.done ? 'line-through text-text-secondary' : 'text-text-primary font-medium'}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Onboarding;