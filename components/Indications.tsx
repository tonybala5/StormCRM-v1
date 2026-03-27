import React, { useState, useEffect } from 'react';
import { Indicacao, Cliente } from '../types';
import { storageService } from '../services/storage';
import { Plus, Trophy, Gift, Trash2, CheckCircle2, Circle, Search, Medal, AlertTriangle, FileJson, FileText, Printer } from 'lucide-react';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { exportUtils } from '../services/exportUtils';

interface IndicationsProps {
  clientes: Cliente[];
}

const Indications: React.FC<IndicationsProps> = ({ clientes }) => {
  const { addToast } = useToast();
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Indicacao | null>(null);

  // Form
  const [formData, setFormData] = useState({
    clienteIndicadorId: '',
    clienteIndicadoId: '',
    dataIndicacao: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await storageService.getIndicacoes();
    setIndicacoes(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteIndicadorId || !formData.clienteIndicadoId) {
      alert("Selecione os dois clientes.");
      return;
    }
    
    const newItem: Indicacao = {
      id: crypto.randomUUID(),
      clienteIndicadorId: formData.clienteIndicadorId,
      clienteIndicadoId: formData.clienteIndicadoId,
      dataIndicacao: new Date(formData.dataIndicacao).toISOString(),
      statusRecompensa: 'Pendente'
    };

    await storageService.saveIndicacao(newItem);
    loadData();
    setIsModalOpen(false);
    setFormData({
      clienteIndicadorId: '',
      clienteIndicadoId: '',
      dataIndicacao: new Date().toISOString().split('T')[0]
    });
    addToast('Indicação registrada!', 'success');
  };

  const requestDelete = (item: Indicacao) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await storageService.deleteIndicacao(itemToDelete.id);
      loadData();
      setDeleteModalOpen(false);
      setItemToDelete(null);
      addToast('Indicação removida.', 'info');
    }
  };

  const toggleStatus = async (ind: Indicacao) => {
    const newStatus = ind.statusRecompensa === 'Pendente' ? 'Entregue' : 'Pendente';
    await storageService.saveIndicacao({ ...ind, statusRecompensa: newStatus });
    loadData();
    addToast(`Status alterado para: ${newStatus}`, 'success');
  };

  // Helper to get client name
  const getClientName = (id: string) => clientes.find(c => c.id === id)?.nome || 'Cliente Desconhecido';

  // --- Exports ---
  const handleExportJSON = () => {
    exportUtils.downloadJSON(indicacoes, 'indicacoes_ai');
  };
  const handleExportTXT = () => {
    const content = indicacoes.map(i => 
      `Data: ${new Date(i.dataIndicacao).toLocaleDateString()} | Indicador: ${getClientName(i.clienteIndicadorId)} | Indicado: ${getClientName(i.clienteIndicadoId)} | Status: ${i.statusRecompensa}`
    ).join('\n');
    exportUtils.downloadTXT('RELATÓRIO DE INDICAÇÕES', content, 'indicacoes_relatorio');
  };

  // --- Statistics ---
  const rankingMap = new Map<string, number>();
  indicacoes.forEach(ind => {
    const count = rankingMap.get(ind.clienteIndicadorId) || 0;
    rankingMap.set(ind.clienteIndicadorId, count + 1);
  });

  const ranking = Array.from(rankingMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => ({
      id: entry[0],
      nome: getClientName(entry[0]),
      count: entry[1]
    }));

  const pendingRewards = indicacoes.filter(i => i.statusRecompensa === 'Pendente').length;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Indicações & Recompensas</h2>
          <p className="text-text-secondary text-sm">Gerencie o programa de afiliados e bônus</p>
        </div>
        
        <div className="flex gap-2">
            <div className="flex bg-bg-secondary border border-border rounded-lg p-1">
                <button onClick={handleExportJSON} title="Exportar JSON" className="p-2 text-text-secondary hover:text-storm-purple hover:bg-bg-tertiary rounded transition-colors">
                    <FileJson className="w-5 h-5" />
                </button>
                <button onClick={handleExportTXT} title="Exportar TXT" className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors">
                    <FileText className="w-5 h-5" />
                </button>
                <button onClick={() => window.print()} title="Imprimir" className="p-2 text-text-secondary hover:text-storm-cyan hover:bg-bg-tertiary rounded transition-colors">
                    <Printer className="w-5 h-5" />
                </button>
            </div>
            
            <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-storm-cyan hover:bg-storm-cyan/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
            <Plus className="w-5 h-5" />
            Registrar Indicação
            </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
        {/* Pending Rewards Card */}
        <div className="bg-bg-secondary border border-border p-6 rounded-xl flex items-center justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-storm-yellow/10 rounded-bl-full" />
           <div>
             <p className="text-text-secondary text-sm font-medium mb-1">Recompensas Pendentes</p>
             <p className="text-3xl font-bold text-white">{pendingRewards}</p>
           </div>
           <div className="w-12 h-12 rounded-lg bg-storm-yellow/20 flex items-center justify-center text-storm-yellow">
             <Gift className="w-6 h-6" />
           </div>
        </div>

        {/* Top 3 Ranking */}
        <div className="md:col-span-2 bg-bg-secondary border border-border p-5 rounded-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
             <Trophy className="w-5 h-5 text-storm-yellow" />
             <h3 className="font-semibold text-text-primary">Top Indicadores</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
             {ranking.map((r, idx) => {
               const colors = [
                 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', // Gold
                 'text-gray-300 border-gray-400/30 bg-gray-400/10',     // Silver
                 'text-amber-700 border-amber-800/30 bg-amber-800/10'    // Bronze
               ];
               const medals = [ '🥇', '🥈', '🥉' ];

               return (
                 <div key={r.id} className={`flex flex-col items-center justify-center p-3 rounded-lg border ${colors[idx] || colors[2]}`}>
                    <span className="text-2xl mb-1">{medals[idx]}</span>
                    <span className="font-bold text-sm text-center truncate w-full">{r.nome}</span>
                    <span className="text-xs opacity-80">{r.count} indicações</span>
                 </div>
               );
             })}
             {ranking.length === 0 && <p className="col-span-3 text-center text-text-secondary text-sm">Nenhuma indicação registrada.</p>}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 bg-bg-secondary border border-border rounded-xl overflow-hidden flex flex-col">
         <div className="p-4 border-b border-border bg-bg-tertiary flex justify-between items-center">
            <h3 className="font-semibold text-text-primary">Histórico</h3>
            <div className="relative w-64 print:hidden">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
               <input 
                 type="text"
                 placeholder="Buscar..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-bg-secondary border border-border rounded-lg py-1.5 pl-9 pr-3 text-sm text-text-primary focus:ring-1 focus:ring-storm-cyan outline-none"
               />
            </div>
         </div>
         <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-bg-tertiary sticky top-0">
                  <tr>
                     <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Data</th>
                     <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Indicador (Recebe Bônus)</th>
                     <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Novo Cliente (Indicado)</th>
                     <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-center">Recompensa</th>
                     <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right print:hidden">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {indicacoes
                    .filter(i => getClientName(i.clienteIndicadorId).toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(item => (
                     <tr key={item.id} className="hover:bg-bg-tertiary/50 transition-colors">
                        <td className="p-4 text-text-secondary text-sm">
                           {new Date(item.dataIndicacao).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-medium text-text-primary">
                           {getClientName(item.clienteIndicadorId)}
                        </td>
                        <td className="p-4 text-text-secondary">
                           {getClientName(item.clienteIndicadoId)}
                        </td>
                        <td className="p-4 text-center">
                           <button 
                             onClick={() => toggleStatus(item)}
                             className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1 w-28 mx-auto ${
                               item.statusRecompensa === 'Entregue'
                                 ? 'bg-storm-green/10 text-storm-green border-storm-green/20 hover:bg-storm-green/20'
                                 : 'bg-storm-yellow/10 text-storm-yellow border-storm-yellow/20 hover:bg-storm-yellow/20'
                             }`}
                           >
                              {item.statusRecompensa === 'Entregue' ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                              {item.statusRecompensa}
                           </button>
                        </td>
                        <td className="p-4 text-right print:hidden">
                           <button 
                              onClick={() => requestDelete(item)}
                              className="p-2 hover:bg-storm-red/10 text-text-secondary hover:text-storm-red rounded-lg transition-colors"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </td>
                     </tr>
                  ))}
                  {indicacoes.length === 0 && (
                     <tr>
                        <td colSpan={5} className="p-8 text-center text-text-secondary">Nenhuma indicação encontrada.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal */}
      <Modal
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         title="Registrar Nova Indicação"
      >
         <form onSubmit={handleSave} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-text-secondary mb-1">Quem indicou? (Indicador)</label>
               <select
                  required
                  value={formData.clienteIndicadorId}
                  onChange={e => setFormData({ ...formData, clienteIndicadorId: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
               >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => (
                     <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
               </select>
               <p className="text-xs text-text-secondary mt-1">Este cliente receberá a recompensa.</p>
            </div>

            <div>
               <label className="block text-sm font-medium text-text-secondary mb-1">Quem foi indicado? (Novo)</label>
               <select
                  required
                  value={formData.clienteIndicadoId}
                  onChange={e => setFormData({ ...formData, clienteIndicadoId: e.target.value })}
                  className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
               >
                  <option value="">Selecione um cliente...</option>
                  {clientes
                     .filter(c => c.id !== formData.clienteIndicadorId) // Can't refer self
                     .map(c => (
                     <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
               </select>
            </div>

            <div>
               <label className="block text-sm font-medium text-text-secondary mb-1">Data da Indicação</label>
               <input 
                  type="date"
                  value={formData.dataIndicacao}
                  onChange={e => setFormData({...formData, dataIndicacao: e.target.value})}
                  className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
               />
            </div>

            <div className="pt-2 flex justify-end gap-2">
               <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">Cancelar</button>
               <button type="submit" className="px-6 py-2 bg-storm-cyan hover:bg-storm-cyan/90 text-white rounded-lg font-medium">Salvar</button>
            </div>
         </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Indicação"
      >
        <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-storm-red" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Tem certeza?</h3>
           <p className="text-text-secondary mb-6">
             Você vai excluir o registro desta indicação.
           </p>
           <div className="flex justify-center gap-3">
             <button 
               onClick={() => setDeleteModalOpen(false)}
               className="px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary text-text-primary rounded-lg border border-border"
             >
               Cancelar
             </button>
             <button 
               onClick={confirmDelete}
               className="px-6 py-2 bg-storm-red hover:bg-storm-red/90 text-white rounded-lg font-bold flex items-center gap-2"
             >
               <Trash2 className="w-4 h-4" />
               Sim, Excluir
             </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default Indications;