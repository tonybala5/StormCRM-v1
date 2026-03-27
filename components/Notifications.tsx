import React, { useMemo } from 'react';
import { Cliente, Lead, Task } from '../types';
import { Bell, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface NotificationsProps {
  clientes: Cliente[];
  leads: Lead[];
  tasks: Task[];
}

const Notifications: React.FC<NotificationsProps> = ({ clientes, leads, tasks }) => {
  // Agora usamos 'tasks' vindo das props, garantindo sincronia com o Checklist

  const alerts = useMemo(() => {
    const list: any[] = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Clientes Atrasados ou Vencendo
    clientes.forEach(c => {
        if (c.status !== 'Ativo') return;
        const venc = new Date(c.proximoVencimento);
        venc.setHours(0,0,0,0);
        
        const diffTime = venc.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            list.push({
                id: `c-late-${c.id}`,
                type: 'urgent',
                title: 'Pagamento Atrasado',
                message: `Cliente ${c.nome} está atrasado há ${Math.abs(diffDays)} dias.`,
                date: c.proximoVencimento,
                icon: AlertTriangle
            });
        } else if (diffDays <= 3) {
             list.push({
                id: `c-soon-${c.id}`,
                type: 'warning',
                title: 'Vence em Breve',
                message: `Assinatura de ${c.nome} vence em ${diffDays === 0 ? 'HOJE' : diffDays + ' dias'}.`,
                date: c.proximoVencimento,
                icon: Clock
            });
        }
    });

    // 2. Leads Expirados
    leads.forEach(l => {
        if (l.status !== 'Em Teste') return;
        const fim = new Date(l.dataFimTeste);
        
        if (fim.getTime() < new Date().getTime()) {
            list.push({
                id: `l-exp-${l.id}`,
                type: 'info',
                title: 'Teste Expirado',
                message: `O teste de ${l.nome} finalizou. Verifique se houve conversão.`,
                date: l.dataFimTeste,
                icon: Calendar
            });
        }
    });

    // 3. Tarefas Pendentes de Alta Prioridade
    tasks.forEach(t => {
        if (!t.isCompleted && t.priority === 'Alta') {
             list.push({
                id: `t-high-${t.id}`,
                type: 'urgent',
                title: 'Tarefa Prioritária',
                message: `Pendente: "${t.text}"`,
                date: t.createdAt,
                icon: AlertTriangle
            });
        }
    });

    return list.sort((a,b) => {
        // Urgent first
        const priority = { urgent: 3, warning: 2, info: 1 };
        return priority[b.type as keyof typeof priority] - priority[a.type as keyof typeof priority];
    });

  }, [clientes, leads, tasks]);

  const getTypeStyles = (type: string) => {
      switch(type) {
          case 'urgent': return 'border-storm-red/30 bg-storm-red/5 icon-red';
          case 'warning': return 'border-storm-yellow/30 bg-storm-yellow/5 icon-yellow';
          default: return 'border-storm-cyan/30 bg-storm-cyan/5 icon-cyan';
      }
  };

  const getIconColor = (type: string) => {
      switch(type) {
          case 'urgent': return 'text-storm-red';
          case 'warning': return 'text-storm-yellow';
          default: return 'text-storm-cyan';
      }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
       <div className="flex items-center justify-between mb-8">
           <div>
               <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                   <Bell className="w-6 h-6 text-storm-purple" />
                   Central de Notificações
               </h2>
               <p className="text-text-secondary text-sm">Alertas automáticos do sistema</p>
           </div>
           <div className="bg-bg-secondary px-3 py-1 rounded-full border border-border text-sm text-text-secondary">
               {alerts.length} alertas não lidos
           </div>
       </div>

       <div className="flex-1 overflow-y-auto space-y-4">
           {alerts.length === 0 ? (
               <div className="text-center py-20 opacity-50">
                   <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-storm-green" />
                   <p className="text-lg font-medium text-text-primary">Tudo limpo!</p>
                   <p className="text-sm text-text-secondary">Você não tem notificações pendentes.</p>
               </div>
           ) : (
               alerts.map(alert => {
                   const Icon = alert.icon;
                   return (
                       <div key={alert.id} className={`p-4 rounded-xl border flex items-start gap-4 transition-all hover:bg-bg-tertiary/50 ${getTypeStyles(alert.type)}`}>
                           <div className={`p-2 rounded-lg bg-bg-primary/50 ${getIconColor(alert.type)}`}>
                               <Icon className="w-6 h-6" />
                           </div>
                           <div className="flex-1">
                               <h3 className="font-bold text-text-primary mb-1">{alert.title}</h3>
                               <p className="text-sm text-text-secondary mb-2">{alert.message}</p>
                               <p className="text-xs text-text-secondary opacity-60">
                                   {new Date(alert.date).toLocaleDateString()} às {new Date(alert.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </p>
                           </div>
                           <button className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded border border-border hover:bg-bg-tertiary transition-colors">
                               Resolver
                           </button>
                       </div>
                   );
               })
           )}
       </div>
    </div>
  );
};

export default Notifications;