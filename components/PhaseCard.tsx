import React from 'react';
import { ProjectPhase, PhaseStatus } from '../types';
import { 
  ClipboardList, 
  Layers, 
  Cpu, 
  Palette, 
  Rocket, 
  CheckCircle2, 
  Circle, 
  Clock 
} from 'lucide-react';

interface PhaseCardProps {
  phase: ProjectPhase;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'ClipboardList': return <ClipboardList className="w-6 h-6" />;
      case 'Layers': return <Layers className="w-6 h-6" />;
      case 'Cpu': return <Cpu className="w-6 h-6" />;
      case 'Palette': return <Palette className="w-6 h-6" />;
      case 'Rocket': return <Rocket className="w-6 h-6" />;
      default: return <Circle className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case PhaseStatus.COMPLETED: return 'text-green-400 border-green-500/30 bg-green-500/10';
      case PhaseStatus.IN_PROGRESS: return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case PhaseStatus.WAITING_FOR_USER: return 'text-amber-400 border-amber-500/30 bg-amber-500/10 animate-pulse-slow';
      default: return 'text-slate-500 border-slate-700 bg-slate-800/50';
    }
  };

  const StatusIcon = () => {
    switch (phase.status) {
      case PhaseStatus.COMPLETED: return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case PhaseStatus.WAITING_FOR_USER: return <Clock className="w-5 h-5 text-amber-400 animate-pulse" />;
      default: return <Circle className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className={`relative p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${getStatusColor(phase.status)} border-opacity-50`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
          {getIcon(phase.iconName)}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-slate-900/30 border border-slate-700">
          <StatusIcon />
          <span>{phase.status.replace(/_/g, ' ')}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-100 mb-2">{phase.title}</h3>
      <p className="text-slate-400 text-sm mb-4 leading-relaxed">{phase.description}</p>
      
      <div className="space-y-2">
        {phase.details.map((detail, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseCard;