import React from 'react';
import { UserQuestion } from '../types';
import { HelpCircle, AlertTriangle } from 'lucide-react';

interface QuestionSectionProps {
  questions: UserQuestion[];
}

const QuestionSection: React.FC<QuestionSectionProps> = ({ questions }) => {
  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-500/20 rounded-lg">
          <HelpCircle className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Minhas Dúvidas & Perguntas</h2>
          <p className="text-slate-400 text-sm">Responda para desbloquear a Fase 1</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {questions.map((q) => (
          <div key={q.id} className="relative group bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-brand-500/50 transition-colors">
            {q.isCritical && (
              <div className="absolute -top-2 -right-2 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3 h-3" />
                CRÍTICO
              </div>
            )}
            <h3 className="font-semibold text-slate-200 mb-2 leading-tight">{q.question}</h3>
            <p className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3 py-1">
              "{q.context}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};