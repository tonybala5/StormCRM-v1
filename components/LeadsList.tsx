import React, { useState, useEffect } from 'react';
import { Lead, Cliente, StatusLead, Origem } from '../types';
import { Search, Filter, Plus, FlaskConical, Clock, CheckCircle2, XCircle, Phone, ArrowRightLeft, Trash2, Edit2, AlertTriangle, FileJson, FileText, Printer } from 'lucide-react';
import Modal from './ui/Modal';
import { storageService } from '../services/storage';
import { authService } from '../services/auth';
import { useToast } from '../contexts/ToastContext';
import { exportUtils } from '../services/exportUtils';

interface LeadsListProps {
  leads: Lead[];
  onUpdate: () => void;
}

const LeadsList: React.FC<LeadsListProps> = ({ leads, onUpdate }) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  
  // Limit Modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitData, setLimitData] = useState({ limit: 0, planName: '' });

  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversionValue, setConversionValue] = useState<number>(35);
  
  const [formData, setFormData] = useState<Partial<Lead>>({
    nome: '',
    telefone: '',
    status: 'Em Teste',
    origem: 'Ads',
    dataInicioTeste: new Date().toISOString(),
    dataFimTeste: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // Default 3 hours
  });

  // Timer update
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000); 
    return () => clearInterval(timer);
  }, []);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.telefone.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddNew = () => {
      // Check Limits
      const check = authService.checkLimit('leads', leads.length);
      if (!check.allowed) {
          setLimitData({ limit: check.limit, planName: check.planName });
          setLimitModalOpen(true);
          return;
      }
      resetForm();
      setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: editingId || crypto.randomUUID(),
      nome: formData.nome || '',
      telefone: formData.telefone || '',
      status: (formData.status as StatusLead) || 'Em Teste',
      origem: (formData.origem as Origem) || 'Ads',
      dataInicioTeste: formData.dataInicioTeste || new Date().toISOString(),
      dataFimTeste: formData.dataFimTeste || new Date().toISOString(),
      observacoes: formData.observacoes,
      motivoNaoConversao: formData.motivoNaoConversao
    };

    storageService.saveLead(newLead);
    onUpdate();
    setIsModalOpen(false);
    resetForm();
    addToast(editingId ? 'Lead atualizado!' : 'Novo teste registrado!', 'success');
  };

  const handleEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setFormData(lead);
    setIsModalOpen(true);
  };

  const requestDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      storageService.deleteLead(leadToDelete.id);
      onUpdate();
      setDeleteModalOpen(false);
      setLeadToDelete(null);
      addToast('Lead removido com sucesso.', 'info');
    }
  };

  const openConvertModal = (lead: Lead) => {
    setSelectedLead(lead);
    setConversionValue(35); // Default value
    setConvertModalOpen(true);
  };

  const confirmConversion = () => {
    if (!selectedLead) return;

    // 1. Create Client from Lead
    const newCliente: Cliente = {
      id: crypto.randomUUID(),
      nome: selectedLead.nome,
      telefone: selectedLead.telefone,
      status: 'Ativo',
      origem: selectedLead.origem,
      valorMensal: conversionValue,
      dataInicio: new Date().toISOString(),
      proximoVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      historicoPagamentos: [],
      dataCriacao: new Date().toISOString(),
      observacoes: `Convertido do Lead (Teste em: ${new Date(selectedLead.dataInicioTeste).toLocaleDateString()})`
    };

    storageService.saveCliente(newCliente);

    // 2. Update Lead status
    const updatedLead: Lead = { ...selectedLead, status: 'Convertido' };
    storageService.saveLead(updatedLead);

    onUpdate();
    setConvertModalOpen(false);
    setSelectedLead(null);
    addToast('Parabéns! Novo cliente convertido.', 'success');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      telefone: '',
      status: 'Em Teste',
      origem: 'Ads',
      dataInicioTeste: new Date().toISOString(),
      dataFimTeste: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    });
  };

  // --- Exports ---
  const handleExportJSON = () => {
    exportUtils.downloadJSON(leads, 'leads_export_ai');
    addToast('JSON de Leads gerado.', 'success');
  };

  const handleExportTXT = () => {
    const content = leads.map(l => 
        `Nome: ${l.nome} | Tel: ${l.telefone} | Status: ${l.status} | Origem: ${l.origem}`
    ).join('\n');
    exportUtils.downloadTXT('LISTA DE LEADS', content, 'leads_lista');
    addToast('TXT gerado.', 'success');
  };

  const getTimeRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return { text: 'Expirado', color: 'text-storm-red', bg: 'bg-storm-red/10' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return { text: `${Math.ceil(hours/24)} dias restantes`, color: 'text-storm-green', bg: 'bg-storm-green/10' };
    if (hours > 0) return { text: `${hours}h ${minutes}m restantes`, color: 'text-storm-cyan', bg: 'bg-storm-cyan/10' };
    return { text: `${minutes}m restantes`, color: 'text-storm-orange', bg: 'bg-storm-orange/10' };
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Em Teste': return 'text-storm-cyan bg-storm-cyan/10 border-storm-cyan/20';
      case 'Convertido': return 'text-storm-green bg-storm-green/10 border-storm-green/20';
      case 'Nao Converteu': return 'text-text-secondary bg-bg-tertiary border-border';
      case 'Expirado': return 'text-storm-red bg-storm-red/10 border-storm-red/20';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Gestão de Leads</h2>
          <p className="text-text-secondary text-sm">Monitore seus testes ativos e conversões</p>
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
            onClick={handleAddNew}
            className="bg-storm-cyan hover:bg-storm-cyan/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
            <Plus className="w-5 h-5" />
            Novo Teste
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-bg-secondary p-3 rounded-xl border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Buscar Lead..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-tertiary border-none rounded-lg py-2 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-storm-cyan placeholder-text-secondary/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-5 h-5 text-text-secondary hidden md:block" />
          {['todos', 'Em Teste', 'Expirado', 'Convertido'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-storm-cyan text-white' 
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-6">
        {filteredLeads.map(lead => {
          const timeInfo = getTimeRemaining(lead.dataFimTeste);
          
          return (
            <div key={lead.id} className="bg-bg-secondary border border-border rounded-xl p-4 hover:border-storm-cyan/30 transition-all group relative break-inside-avoid">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-storm-cyan font-bold">
                    {lead.nome.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary truncate max-w-[120px]">{lead.nome}</h3>
                    <p className="text-xs text-text-secondary">{lead.origem}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(lead.status)}`}>
                  {lead.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Phone className="w-4 h-4" />
                  {lead.telefone}
                </div>
                {lead.status === 'Em Teste' && (
                  <div className={`flex items-center gap-2 text-sm font-medium px-2 py-1 rounded ${timeInfo.bg} ${timeInfo.color}`}>
                    <Clock className="w-4 h-4" />
                    {timeInfo.text}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border print:hidden">
                <div className="flex gap-1">
                   <a 
                    href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 hover:bg-storm-green/10 text-text-secondary hover:text-storm-green rounded-lg transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                   <button 
                    onClick={() => handleEdit(lead)}
                    className="p-2 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => requestDelete(lead)}
                    className="p-2 hover:bg-storm-red/10 text-text-secondary hover:text-storm-red rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {lead.status === 'Em Teste' && (
                  <button 
                    onClick={() => openConvertModal(lead)}
                    className="px-3 py-1.5 bg-storm-cyan hover:bg-storm-cyan/90 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Converter
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {filteredLeads.length === 0 && (
          <div className="col-span-full py-10 text-center text-text-secondary">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum lead encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Lead' : 'Novo Teste (Lead)'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome *</label>
            <input 
              required
              type="text"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Telefone *</label>
            <input 
              required
              type="tel"
              value={formData.telefone}
              onChange={e => setFormData({...formData, telefone: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Início Teste</label>
              <input 
                type="datetime-local"
                value={formData.dataInicioTeste?.substring(0, 16)}
                onChange={e => setFormData({...formData, dataInicioTeste: new Date(e.target.value).toISOString()})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Fim Teste</label>
              <input 
                type="datetime-local"
                value={formData.dataFimTeste?.substring(0, 16)}
                onChange={e => setFormData({...formData, dataFimTeste: new Date(e.target.value).toISOString()})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Origem</label>
            <select 
              value={formData.origem}
              onChange={e => setFormData({...formData, origem: e.target.value as Origem})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
            >
              <option value="Ads">Ads</option>
              <option value="Organico">Orgânico</option>
              <option value="Indicacao">Indicação</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-storm-cyan hover:bg-storm-cyan/90 text-white rounded-lg font-medium">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Conversion Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Converter Lead em Cliente"
      >
         <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <CheckCircle2 className="w-8 h-8 text-storm-green" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Confirmar Conversão?</h3>
           <p className="text-text-secondary mb-4">
             O lead <strong>{selectedLead?.nome}</strong> será movido para a lista de Clientes Ativos e o teste será marcado como "Convertido".
           </p>
           
           <div className="bg-bg-tertiary p-4 rounded-lg border border-border mb-6 text-left">
              <label className="block text-xs font-medium text-text-secondary mb-1">Valor da Mensalidade (R$)</label>
              <input 
                type="number" 
                value={conversionValue}
                onChange={(e) => setConversionValue(Number(e.target.value))}
                className="w-full bg-bg-secondary border border-border rounded-lg p-2 text-text-primary focus:ring-2 focus:ring-storm-green outline-none"
              />
           </div>

           <div className="flex justify-center gap-3">
             <button 
               onClick={() => setConvertModalOpen(false)}
               className="px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary text-text-primary rounded-lg border border-border"
             >
               Cancelar
             </button>
             <button 
               onClick={confirmConversion}
               className="px-6 py-2 bg-storm-green hover:bg-storm-green/90 text-white rounded-lg font-bold shadow-lg shadow-storm-green/20"
             >
               Confirmar & Converter
             </button>
           </div>
         </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Lead"
      >
        <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-storm-red" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Tem certeza?</h3>
           <p className="text-text-secondary mb-6">
             Você vai excluir o lead <strong>{leadToDelete?.nome}</strong>. Esta ação é irreversível.
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
      
      {/* Limit Reached Modal */}
      <Modal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} title="Limite Atingido">
         <div className="text-center p-4">
            <div className="w-16 h-16 bg-storm-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertTriangle className="w-8 h-8 text-storm-yellow" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Limite do Plano {limitData.planName}</h3>
            <p className="text-text-secondary mb-6">
               Você atingiu o limite de <strong>{limitData.limit} leads</strong> do seu plano atual.
               Faça upgrade para adicionar mais.
            </p>
            <button 
              onClick={() => { setLimitModalOpen(false); window.location.reload(); }} // Simple reload/nav
              className="w-full bg-storm-purple text-white py-3 rounded-lg font-bold hover:bg-storm-purple/90"
            >
               Ver Planos
            </button>
         </div>
      </Modal>
    </div>
  );
};

export default LeadsList;