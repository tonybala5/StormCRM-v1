import React from 'react';
import { Cliente, Lead } from '../types';
import { Users, DollarSign, FlaskConical, TrendingUp, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Shield, Map, Layout, Zap, Rocket } from 'lucide-react';
import { authService } from '../services/auth';

interface DashboardProps {
  clientes: Cliente[];
  leads: Lead[];
}

const Dashboard: React.FC<DashboardProps> = ({ clientes, leads }) => {
  const isAdmin = authService.isSuperAdmin();

  // --- 1. Cálculos de KPIs ---
  const clientesAtivos = clientes.filter(c => c.status === 'Ativo');
  
  // Receita Mensal Recorrente (MRR)
  const receitaMensal = clientesAtivos.reduce((acc, curr) => acc + curr.valorMensal, 0);
  
  // Contagem de Leads
  const leadsEmTeste = leads.filter(l => l.status === 'Em Teste').length;
  
  // Taxa de Conversão
  const leadsConvertidos = leads.filter(l => l.status === 'Convertido').length;
  const leadsFinalizados = leads.filter(l => l.status === 'Convertido' || l.status === 'Nao Converteu').length;
  const taxaConversao = leadsFinalizados > 0 
    ? ((leadsConvertidos / leadsFinalizados) * 100).toFixed(1) 
    : '0.0';

  // --- 2. Lógica de Saúde Financeira (Vencimentos) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let statusPagamentos = {
    emDia: 0,
    vencendo: 0,
    atrasados: 0
  };

  clientesAtivos.forEach(c => {
    const vencimento = new Date(c.proximoVencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diffTime = vencimento.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) statusPagamentos.atrasados++;
    else if (diffDays <= 7) statusPagamentos.vencendo++;
    else statusPagamentos.emDia++;
  });

  const kpiCards = [
    { label: 'Clientes Ativos', value: clientesAtivos.length, subtext: 'Assinantes recorrentes', icon: Users, color: 'text-storm-purple', bg: 'bg-storm-purple/10', border: 'border-storm-purple/20' },
    { label: 'Receita Mensal', value: `R$ ${receitaMensal.toFixed(2)}`, subtext: 'Previsão mensal', icon: DollarSign, color: 'text-storm-green', bg: 'bg-storm-green/10', border: 'border-storm-green/20' },
    { label: 'Leads em Teste', value: leadsEmTeste, subtext: 'Potenciais clientes', icon: FlaskConical, color: 'text-storm-cyan', bg: 'bg-storm-cyan/10', border: 'border-storm-cyan/20' },
    { label: 'Taxa Conversão', value: `${taxaConversao}%`, subtext: 'De testes finalizados', icon: TrendingUp, color: 'text-storm-orange', bg: 'bg-storm-orange/10', border: 'border-storm-orange/20' },
  ];

  // --- 3. Roadmap Steps (A Missão) ---
  const roadmapSteps = [
    { id: 1, title: 'Analise e Escopo', done: true, icon: Map },
    { id: 2, title: 'Configurar Firebase', done: true, icon: Zap },
    { id: 3, title: 'Sistema de Login (Admin)', done: true, icon: Shield },
    { id: 4, title: 'Dashboard & KPIs', done: true, icon: Layout },
    { id: 5, title: 'IA Generativa (Gemini)', done: false, icon: Rocket },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-text-primary">Visão Geral</h2>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-full uppercase tracking-wide">
                <Shield className="w-3 h-3" /> Modo Super Admin
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm">Bem-vindo(a) de volta! Resumo da sua operação.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-bg-tertiary border border-border hover:bg-bg-secondary text-text-primary rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
             <Clock className="w-4 h-4" />
             Histórico
           </button>
           <button className="px-4 py-2 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-storm-purple/20">
             Exportar Relatório
           </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-5 rounded-xl border ${card.border} ${card.bg} flex flex-col justify-between transition-transform hover:scale-[1.02]`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-white/5`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                {idx === 1 && (
                   <span className="flex items-center text-xs text-storm-green bg-storm-green/10 px-2 py-1 rounded-full font-medium">
                     <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                   </span>
                )}
              </div>
              <div>
                <h3 className={`text-2xl font-bold ${card.color} mb-1`}>{card.value}</h3>
                <p className="text-sm font-medium text-text-primary">{card.label}</p>
                <p className="text-xs text-text-secondary opacity-80">{card.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roadmap da Missão */}
      <div className="bg-bg-secondary border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
           <Map className="w-5 h-5 text-storm-cyan" />
           Roadmap do Projeto (Sua Missão)
        </h3>
        <div className="relative">
           {/* Line */}
           <div className="absolute top-1/2 left-0 right-0 h-1 bg-bg-tertiary -translate-y-1/2 hidden md:block" />
           
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {roadmapSteps.map((step, idx) => {
                 const Icon = step.icon;
                 return (
                    <div key={step.id} className="flex flex-col items-center text-center group">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${step.done ? 'bg-storm-green border-storm-green text-white' : 'bg-bg-primary border-border text-text-secondary'}`}>
                          {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                       </div>
                       <p className={`text-xs font-bold ${step.done ? 'text-storm-green' : 'text-text-secondary'}`}>Fase {idx + 1}</p>
                       <p className="text-sm font-medium text-text-primary">{step.title}</p>
                    </div>
                 )
              })}
           </div>
        </div>
      </div>

      {/* Health & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-lg font-semibold text-text-primary">Saúde Financeira (Vencimentos)</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-secondary border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-storm-green/5 rounded-bl-full" />
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-storm-green/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-storm-green" /></div>
                <h4 className="font-semibold text-text-primary">Em Dia</h4>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{statusPagamentos.emDia}</p>
              <p className="text-sm text-text-secondary">Assinaturas OK</p>
            </div>

            <div className="bg-bg-secondary border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-storm-yellow/5 rounded-bl-full" />
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-storm-yellow/10 rounded-lg"><Clock className="w-5 h-5 text-storm-yellow" /></div>
                <h4 className="font-semibold text-text-primary">Vencendo</h4>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{statusPagamentos.vencendo}</p>
              <p className="text-sm text-text-secondary">Próximos 7 dias</p>
            </div>

            <div className="bg-bg-secondary border border-border rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-storm-red/5 rounded-bl-full" />
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-storm-red/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-storm-red" /></div>
                <h4 className="font-semibold text-text-primary">Atrasados</h4>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{statusPagamentos.atrasados}</p>
              <p className="text-sm text-text-secondary">Cobrar agora</p>
            </div>
          </div>
        </div>

        {/* Mini List */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Últimas Adições</h3>
          <div className="space-y-3">
             {clientes.slice(-5).reverse().map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
                   <div>
                      <p className="text-sm font-medium text-text-primary">{c.nome}</p>
                      <p className="text-xs text-text-secondary">{new Date(c.dataInicio).toLocaleDateString()}</p>
                   </div>
                   <span className="text-sm font-bold text-storm-green">R$ {c.valorMensal}</span>
                </div>
             ))}
             {clientes.length === 0 && <p className="text-sm text-text-secondary text-center py-4">Nenhum cliente ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;