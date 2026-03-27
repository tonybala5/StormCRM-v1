import React, { useMemo } from 'react';
import { Cliente, Lead } from '../types';
import { BarChart2, TrendingUp, TrendingDown, Users, DollarSign, Activity, XCircle, Filter } from 'lucide-react';

interface MetricsProps {
  clientes: Cliente[];
  leads: Lead[];
}

const Metrics: React.FC<MetricsProps> = ({ clientes, leads }) => {
  // --- Cálculos de Business Intelligence ---

  const kpis = useMemo(() => {
    const ativos = clientes.filter(c => c.status === 'Ativo');
    const cancelados = clientes.filter(c => c.status === 'Cancelado');
    const totalClientes = clientes.length || 1;
    
    // 1. MRR (Monthly Recurring Revenue)
    const mrr = ativos.reduce((acc, curr) => acc + curr.valorMensal, 0);

    // 2. ARPU (Average Revenue Per User)
    const arpu = ativos.length > 0 ? mrr / ativos.length : 0;

    // 3. Churn Rate (Taxa de Cancelamento Global)
    // Simplificado: Cancelados / Total Historico
    const churnRate = (cancelados.length / totalClientes) * 100;

    // 4. LTV (Lifetime Value)
    // Estimativa: ARPU / Churn Mensal (ou ARPU * Tempo Médio de Vida)
    // Se Churn for 0, assumimos um tempo de vida padrão de 12 meses para evitar infinito
    const lifetimeMonths = churnRate > 0 ? (100 / churnRate) : 12; 
    // Cap lifetime at 24 months for conservative estimate if churn is very low
    const safeLifetime = Math.min(lifetimeMonths, 24); 
    const ltv = arpu * safeLifetime;

    return { mrr, arpu, churnRate, ltv };
  }, [clientes]);

  // --- Gráfico de Crescimento (Últimos 6 meses) ---
  const historyData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('pt-BR', { month: 'short' });
      const year = d.getFullYear();
      
      // Filtra clientes criados neste mês/ano
      const count = clientes.filter(c => {
        const cDate = new Date(c.dataInicio); // Usando dataInicio como proxy de entrada
        return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === year;
      }).length;

      months.push({ label: monthName, value: count });
    }
    return months;
  }, [clientes]);

  const maxHistoryValue = Math.max(...historyData.map(d => d.value), 1); // Evitar div por 0

  // --- Funil de Conversão ---
  const funnelData = useMemo(() => {
    const totalLeads = leads.length;
    const emTeste = leads.filter(l => l.status === 'Em Teste').length;
    const convertidos = leads.filter(l => l.status === 'Convertido').length;
    
    // Percentuais relativos ao total
    const pTeste = totalLeads > 0 ? (emTeste / totalLeads) * 100 : 0;
    const pConvertido = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0;

    return { totalLeads, emTeste, convertidos, pTeste, pConvertido };
  }, [leads]);

  return (
    <div className="p-6 h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Métricas Avançadas</h2>
          <p className="text-text-secondary text-sm">Inteligência de negócio e saúde financeira</p>
        </div>
        <div className="flex gap-2">
            <div className="bg-bg-secondary border border-border rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm text-text-secondary">
                <Filter className="w-4 h-4" />
                <span>Últimos 6 meses</span>
            </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* MRR */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">MRR (Recorrente)</span>
            </div>
            <p className="text-2xl font-bold text-storm-green">R$ {kpis.mrr.toFixed(2)}</p>
            <p className="text-xs text-text-secondary">Receita mensal atual</p>
        </div>

        {/* LTV */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">LTV (Valor Vitalício)</span>
            </div>
            <p className="text-2xl font-bold text-storm-purple">R$ {kpis.ltv.toFixed(2)}</p>
            <p className="text-xs text-text-secondary">Quanto um cliente vale</p>
        </div>

        {/* ARPU */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">ARPU (Ticket Médio)</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">R$ {kpis.arpu.toFixed(2)}</p>
            <p className="text-xs text-text-secondary">Por cliente ativo</p>
        </div>

        {/* Churn */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-text-secondary">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Churn Rate</span>
            </div>
            <p className={`text-2xl font-bold ${kpis.churnRate > 10 ? 'text-storm-red' : 'text-storm-cyan'}`}>
                {kpis.churnRate.toFixed(1)}%
            </p>
            <p className="text-xs text-text-secondary">Taxa de cancelamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-storm-cyan" />
                    Novos Clientes (Semestral)
                </h3>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-4 px-2">
                {historyData.map((data, idx) => {
                    const heightPercent = (data.value / maxHistoryValue) * 100;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                            <div className="w-full relative h-full flex items-end">
                                <div 
                                    className="w-full bg-storm-cyan/20 border-t-2 border-storm-cyan rounded-t-sm transition-all duration-1000 group-hover:bg-storm-cyan/40 relative"
                                    style={{ height: `${heightPercent || 1}%` }} // Min 1% for visuals
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-tertiary text-xs py-1 px-2 rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                                        {data.value}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-text-secondary font-medium uppercase">{data.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Sales Funnel */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6 flex flex-col">
             <h3 className="font-semibold text-text-primary mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-storm-orange" />
                Funil de Vendas
             </h3>

             <div className="flex-1 flex flex-col justify-center gap-4">
                {/* Stage 1: Leads Totais */}
                <div className="relative">
                    <div className="flex justify-between text-sm mb-1 text-text-secondary">
                        <span>Leads Totais</span>
                        <span>{funnelData.totalLeads}</span>
                    </div>
                    <div className="w-full h-10 bg-bg-tertiary rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-storm-purple/20 flex items-center px-3 border-l-4 border-storm-purple">
                            <span className="text-xs font-bold text-storm-purple">100%</span>
                        </div>
                    </div>
                </div>

                {/* Stage 2: Em Teste */}
                <div className="relative px-4">
                     <div className="flex justify-between text-sm mb-1 text-text-secondary">
                        <span>Em Teste</span>
                        <span>{funnelData.emTeste}</span>
                    </div>
                    <div className="w-full h-10 bg-bg-tertiary rounded-lg relative overflow-hidden">
                        <div 
                            className="absolute inset-y-0 left-0 bg-storm-cyan/20 flex items-center px-3 border-l-4 border-storm-cyan transition-all duration-1000"
                            style={{ width: `${funnelData.pTeste}%` }}
                        >
                            <span className="text-xs font-bold text-storm-cyan">{funnelData.pTeste.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>

                {/* Stage 3: Convertidos */}
                <div className="relative px-8">
                    <div className="flex justify-between text-sm mb-1 text-text-secondary">
                        <span>Convertidos (Vendas)</span>
                        <span>{funnelData.convertidos}</span>
                    </div>
                    <div className="w-full h-10 bg-bg-tertiary rounded-lg relative overflow-hidden">
                         <div 
                            className="absolute inset-y-0 left-0 bg-storm-green/20 flex items-center px-3 border-l-4 border-storm-green transition-all duration-1000"
                            style={{ width: `${funnelData.pConvertido}%` }}
                        >
                            <span className="text-xs font-bold text-storm-green">{funnelData.pConvertido.toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
             </div>

             <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-text-secondary text-center">
                    Sua taxa de conversão global é 
                    <strong className="text-storm-green ml-1">
                        {funnelData.totalLeads > 0 ? ((funnelData.convertidos / funnelData.totalLeads) * 100).toFixed(1) : 0}%
                    </strong>
                </p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Metrics;