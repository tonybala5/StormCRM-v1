import React, { useState } from 'react';
import { Investimento, Cliente, Lead } from '../types';
import { storageService } from '../services/storage';
import { Plus, Trash2, TrendingUp, TrendingDown, Target, DollarSign, Calendar, Edit2, FileJson, FileText, Printer, AlertTriangle, Download } from 'lucide-react';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { exportUtils } from '../services/exportUtils';

interface AdsManagementProps {
  clientes: Cliente[];
  leads: Lead[];
  investimentos: Investimento[];
  onUpdate: () => void;
}

const AdsManagement: React.FC<AdsManagementProps> = ({ clientes, leads, investimentos, onUpdate }) => {
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Investimento | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Investimento>>({
    data: new Date().toISOString().split('T')[0],
    plataforma: 'Facebook',
    valor: 0,
    observacoes: ''
  });

  // --- ACTIONS ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: Investimento = {
      id: editingId || crypto.randomUUID(),
      data: formData.data ? new Date(formData.data).toISOString() : new Date().toISOString(),
      plataforma: formData.plataforma as any,
      valor: Number(formData.valor),
      observacoes: formData.observacoes
    };

    await storageService.saveInvestimento(newItem);
    onUpdate();
    setIsModalOpen(false);
    resetForm();
    addToast(editingId ? 'Investimento atualizado!' : 'Investimento lançado!', 'success');
  };

  const handleEdit = (item: Investimento) => {
    setEditingId(item.id);
    setFormData({
      data: item.data.split('T')[0],
      plataforma: item.plataforma,
      valor: item.valor,
      observacoes: item.observacoes
    });
    setIsModalOpen(true);
  };

  const requestDelete = (item: Investimento) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await storageService.deleteInvestimento(itemToDelete.id);
      onUpdate();
      setDeleteModalOpen(false);
      setItemToDelete(null);
      addToast('Lançamento removido.', 'info');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      plataforma: 'Facebook',
      valor: 0,
      observacoes: ''
    });
  };

  // --- EXPORTS ---
  const handleExportJSON = () => {
    exportUtils.downloadJSON(investimentos, 'relatorio_ads_ia');
    addToast('Arquivo JSON gerado para IA.', 'success');
  };

  const handleExportTXT = () => {
    const content = investimentos.map(i => 
      `Data: ${new Date(i.data).toLocaleDateString()} | Plataforma: ${i.plataforma} | Valor: R$ ${i.valor.toFixed(2)} | Obs: ${i.observacoes || '-'}`
    ).join('\n');
    
    // Add summary
    const summary = `\n\nRESUMO:\nTotal Investido: R$ ${investimentos.reduce((acc, c) => acc + c.valor, 0).toFixed(2)}`;
    
    exportUtils.downloadTXT('RELATÓRIO DE INVESTIMENTOS ADS', content + summary, 'relatorio_ads');
    addToast('Relatório TXT gerado.', 'success');
  };

  // --- CALCULATIONS ---
  const totalInvestido = investimentos.reduce((acc, curr) => acc + curr.valor, 0);
  const leadsAds = leads.filter(l => l.origem === 'Ads').length;
  const cpl = leadsAds > 0 ? totalInvestido / leadsAds : 0;
  const clientesAds = clientes.filter(c => c.origem === 'Ads');
  const clientesAdsCount = clientesAds.length;
  const cpa = clientesAdsCount > 0 ? totalInvestido / clientesAdsCount : 0;
  const receitaMensalAds = clientesAds.reduce((acc, curr) => acc + curr.valorMensal, 0);
  const lucroImediato = receitaMensalAds - totalInvestido;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Gestão de Tráfego (Ads)</h2>
          <p className="text-text-secondary text-sm">Controle de ROI, CPL e CPA</p>
        </div>
        
        <div className="flex gap-2">
            {/* Export Buttons */}
            <div className="flex bg-bg-secondary border border-border rounded-lg p-1">
                <button onClick={handleExportJSON} title="Exportar JSON (Para IA)" className="p-2 text-text-secondary hover:text-storm-purple hover:bg-bg-tertiary rounded transition-colors">
                    <FileJson className="w-5 h-5" />
                </button>
                <button onClick={handleExportTXT} title="Exportar TXT" className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors">
                    <FileText className="w-5 h-5" />
                </button>
                <button onClick={() => window.print()} title="Imprimir / PDF" className="p-2 text-text-secondary hover:text-storm-cyan hover:bg-bg-tertiary rounded transition-colors">
                    <Printer className="w-5 h-5" />
                </button>
            </div>

            <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-storm-purple hover:bg-storm-purple/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
            <Plus className="w-5 h-5" />
            Novo Gasto
            </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:hidden">
        {/* Total Invested */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
             <DollarSign className="w-4 h-4" />
             <span className="text-sm font-medium">Total Investido</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">R$ {totalInvestido.toFixed(2)}</p>
        </div>

        {/* CPA */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
             <Target className="w-4 h-4" />
             <span className="text-sm font-medium">CPA (Custo p/ Cliente)</span>
          </div>
          <p className={`text-2xl font-bold ${cpa > 35 ? 'text-storm-red' : 'text-storm-green'}`}>
            R$ {cpa.toFixed(2)}
          </p>
          <p className="text-xs text-text-secondary">Ideal: Menor que o ticket médio</p>
        </div>

        {/* CPL */}
        <div className="bg-bg-secondary border border-border p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
             <TrendingDown className="w-4 h-4" />
             <span className="text-sm font-medium">CPL (Custo p/ Lead)</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">R$ {cpl.toFixed(2)}</p>
          <p className="text-xs text-text-secondary">{leadsAds} leads gerados</p>
        </div>

        {/* Profit (Ads Only) */}
        <div className={`bg-bg-secondary border border-border p-5 rounded-xl ${lucroImediato >= 0 ? 'border-storm-green/30 bg-storm-green/5' : 'border-storm-red/30 bg-storm-red/5'}`}>
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
             <TrendingUp className="w-4 h-4" />
             <span className="text-sm font-medium">Resultado (Mês 1)</span>
          </div>
          <p className={`text-2xl font-bold ${lucroImediato >= 0 ? 'text-storm-green' : 'text-storm-red'}`}>
            R$ {lucroImediato.toFixed(2)}
          </p>
          <p className="text-xs text-text-secondary">Receita Ads (R$ {receitaMensalAds}) - Gasto</p>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 bg-bg-secondary border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-bg-tertiary">
          <h3 className="font-semibold text-text-primary">Histórico de Lançamentos</h3>
        </div>
        <div className="flex-1 overflow-auto">
           <table className="w-full text-left border-collapse">
            <thead className="bg-bg-tertiary sticky top-0">
              <tr>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Data</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Plataforma</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase">Observação</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right">Valor</th>
                <th className="p-4 text-xs font-semibold text-text-secondary uppercase text-right print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {investimentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-secondary">
                    Nenhum investimento lançado ainda.
                  </td>
                </tr>
              ) : (
                investimentos.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(item => (
                  <tr key={item.id} className="hover:bg-bg-tertiary/50 transition-colors">
                    <td className="p-4 text-text-primary">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-secondary" />
                        {new Date(item.data).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${
                        item.plataforma === 'Facebook' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                        item.plataforma === 'Google' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                        'border-border text-text-secondary bg-bg-tertiary'
                      }`}>
                        {item.plataforma}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary text-sm">{item.observacoes || '-'}</td>
                    <td className="p-4 text-right font-medium text-text-primary">R$ {item.valor.toFixed(2)}</td>
                    <td className="p-4 text-right print:hidden">
                       <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => handleEdit(item)}
                                className="p-2 hover:bg-storm-purple/10 text-text-secondary hover:text-storm-purple rounded-lg transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => requestDelete(item)}
                                className="p-2 hover:bg-storm-red/10 text-text-secondary hover:text-storm-red rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
      </div>

      {/* Modal New Expense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Investimento' : 'Lançar Investimento'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Data</label>
            <input 
              required
              type="date"
              value={formData.data}
              onChange={e => setFormData({...formData, data: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-text-secondary mb-1">Plataforma</label>
             <select 
               value={formData.plataforma}
               onChange={e => setFormData({...formData, plataforma: e.target.value as any})}
               className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
             >
               <option value="Facebook">Facebook / Instagram</option>
               <option value="Google">Google / Youtube</option>
               <option value="TikTok">TikTok</option>
               <option value="Influencer">Influencer</option>
               <option value="Outros">Outros</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Valor (R$)</label>
            <input 
              required
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={e => setFormData({...formData, valor: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Observações</label>
            <input 
              type="text"
              placeholder="Ex: Campanha Reels 01"
              value={formData.observacoes}
              onChange={e => setFormData({...formData, observacoes: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">Cancelar</button>
             <button type="submit" className="px-6 py-2 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-lg font-medium">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
       <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Investimento"
      >
        <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-storm-red" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Tem certeza?</h3>
           <p className="text-text-secondary mb-6">
             Você vai excluir o lançamento de <strong>R$ {itemToDelete?.valor.toFixed(2)}</strong>. Isso afetará os cálculos de ROI/CPA.
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

export default AdsManagement;