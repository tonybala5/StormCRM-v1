import React, { useState } from 'react';
import { Cliente, StatusCliente, Origem } from '../types';
import { Search, Filter, Plus, Edit2, Trash2, Phone, CheckCircle2, AlertCircle, Clock, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import { storageService } from '../services/storage';
import { authService } from '../services/auth';
import { useToast } from '../contexts/ToastContext';

interface ClientsListProps {
  clientes: Cliente[];
  onUpdate: () => void;
}

const ClientsList: React.FC<ClientsListProps> = ({ clientes, onUpdate }) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Limit Modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitData, setLimitData] = useState({ limit: 0, planName: '' });

  // Selection State
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState<Cliente | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Cliente>>({
    nome: '',
    telefone: '',
    email: '',
    valorMensal: 35,
    status: 'Ativo',
    origem: 'Organico',
    proximoVencimento: new Date().toISOString().split('T')[0]
  });

  // Filters
  const filteredClientes = clientes.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.telefone.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- ACTIONS ---
  const handleAddNew = () => {
      // Check Limits
      const check = authService.checkLimit('clientes', clientes.length);
      if (!check.allowed) {
          setLimitData({ limit: check.limit, planName: check.planName });
          setLimitModalOpen(true);
          return;
      }
      resetForm();
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCliente: Cliente = {
      id: editingId || crypto.randomUUID(),
      nome: formData.nome || '',
      telefone: formData.telefone || '',
      email: formData.email,
      valorMensal: Number(formData.valorMensal) || 0,
      status: (formData.status as StatusCliente) || 'Ativo',
      origem: (formData.origem as Origem) || 'Organico',
      proximoVencimento: formData.proximoVencimento || new Date().toISOString(),
      dataInicio: editingId ? (clientes.find(c => c.id === editingId)?.dataInicio || new Date().toISOString()) : new Date().toISOString(),
      dataCriacao: editingId ? (clientes.find(c => c.id === editingId)?.dataCriacao || new Date().toISOString()) : new Date().toISOString(),
      historicoPagamentos: editingId ? (clientes.find(c => c.id === editingId)?.historicoPagamentos || []) : [],
      observacoes: formData.observacoes
    };

    await storageService.saveCliente(newCliente);
    onUpdate();
    setIsModalOpen(false);
    resetForm();
    addToast(editingId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', 'success');
  };

  // --- EDIT ---
  const handleEdit = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setFormData({
      ...cliente,
      proximoVencimento: cliente.proximoVencimento.split('T')[0]
    });
    setIsModalOpen(true);
  };

  // --- DELETE (New Logic) ---
  const requestDelete = (cliente: Cliente) => {
    setClientToDelete(cliente);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await storageService.deleteCliente(clientToDelete.id);
      onUpdate();
      addToast('Cliente removido com sucesso.', 'info');
      setDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  // --- RENEW ---
  const handleOpenRenew = (cliente: Cliente) => {
    setSelectedClientForRenewal(cliente);
    
    // Lógica Inteligente de Renovação
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const currentVencimento = new Date(cliente.proximoVencimento);
    const validCurrentVencimento = !isNaN(currentVencimento.getTime()) ? currentVencimento : today;
    
    const baseDate = validCurrentVencimento < today ? today : validCurrentVencimento;
    
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 30);
    
    setNewDueDate(nextDate.toISOString().split('T')[0]);
    setRenewModalOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!selectedClientForRenewal || !newDueDate) return;

    const updatedCliente: Cliente = {
        ...selectedClientForRenewal,
        status: 'Ativo', 
        proximoVencimento: new Date(newDueDate).toISOString(),
        historicoPagamentos: [
            ...(selectedClientForRenewal.historicoPagamentos || []),
            new Date().toISOString() 
        ]
    };

    await storageService.saveCliente(updatedCliente);
    onUpdate();
    setRenewModalOpen(false);
    setSelectedClientForRenewal(null);
    addToast(`Assinatura de ${updatedCliente.nome} renovada!`, 'success');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      valorMensal: 35,
      status: 'Ativo',
      origem: 'Organico',
      proximoVencimento: new Date().toISOString().split('T')[0]
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'text-storm-green bg-storm-green/10 border-storm-green/20';
      case 'Inativo': return 'text-text-secondary bg-bg-tertiary border-border';
      case 'Cancelado': return 'text-storm-red bg-storm-red/10 border-storm-red/20';
      default: return 'text-text-secondary';
    }
  };

  const getVencimentoStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vencimento = new Date(dateStr);
    vencimento.setHours(0, 0, 0, 0);
    
    const diffTime = vencimento.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-storm-red', icon: AlertCircle, label: 'Atrasado' };
    if (diffDays <= 7) return { color: 'text-storm-yellow', icon: Clock, label: 'Vence em breve' };
    return { color: 'text-storm-green', icon: CheckCircle2, label: 'Em dia' };
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Clientes Ativos</h2>
          <p className="text-text-secondary text-sm">Gerencie sua base de usuários</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-storm-purple hover:bg-storm-purple/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-bg-secondary p-3 rounded-xl border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-tertiary border-none rounded-lg py-2 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-storm-purple placeholder-text-secondary/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-5 h-5 text-text-secondary hidden md:block" />
          {['todos', 'Ativo', 'Inativo', 'Cancelado'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-storm-purple text-white' 
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-border rounded-xl bg-bg-secondary">
        <table className="w-full text-left border-collapse">
          <thead className="bg-bg-tertiary sticky top-0 z-10">
            <tr>
              <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Cliente</th>
              <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Status</th>
              <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Vencimento</th>
              <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Origem</th>
              <th className="p-4 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              filteredClientes.map((cliente) => {
                const vencimentoInfo = getVencimentoStatus(cliente.proximoVencimento);
                const VencIcon = vencimentoInfo.icon;
                
                return (
                  <tr key={cliente.id} className="hover:bg-bg-tertiary/50 transition-colors group">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-text-primary">{cliente.nome}</p>
                        <p className="text-sm text-text-secondary">{cliente.telefone}</p>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(cliente.status)}`}>
                        {cliente.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <VencIcon className={`w-4 h-4 ${vencimentoInfo.color}`} />
                        <span className="text-sm text-text-primary">
                          {new Date(cliente.proximoVencimento).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className={`text-xs ${vencimentoInfo.color} md:hidden`}>
                        {vencimentoInfo.label}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-text-secondary">{cliente.origem}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenRenew(cliente)}
                          className="p-2 hover:bg-storm-green/10 text-text-secondary hover:text-storm-green rounded-lg transition-colors"
                          title="Renovar / Registrar Pagamento"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 hover:bg-storm-green/10 text-text-secondary hover:text-storm-green rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleEdit(cliente)}
                          className="p-2 hover:bg-storm-purple/10 text-text-secondary hover:text-storm-purple rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => requestDelete(cliente)} 
                          className="p-2 hover:bg-storm-red/10 text-text-secondary hover:text-storm-red rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/New Client Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Nome Completo *</label>
            <input 
              required
              type="text"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Telefone *</label>
              <input 
                required
                type="tel"
                placeholder="11999999999"
                value={formData.telefone}
                onChange={e => setFormData({...formData, telefone: e.target.value})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Valor Mensal (R$)</label>
              <input 
                type="number"
                value={formData.valorMensal}
                onChange={e => setFormData({...formData, valorMensal: Number(e.target.value)})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-text-secondary mb-1">Próximo Vencimento *</label>
             <input 
                required
                type="date"
                value={formData.proximoVencimento?.split('T')[0]}
                onChange={e => setFormData({...formData, proximoVencimento: e.target.value})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
              />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
              <select 
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as StatusCliente})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Origem</label>
              <select 
                value={formData.origem}
                onChange={e => setFormData({...formData, origem: e.target.value as Origem})}
                className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
              >
                <option value="Organico">Orgânico</option>
                <option value="Ads">Ads</option>
                <option value="Indicacao">Indicação</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Observações</label>
            <textarea 
              rows={3}
              value={formData.observacoes || ''}
              onChange={e => setFormData({...formData, observacoes: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-lg font-medium transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renovar Assinatura"
      >
        <div className="space-y-4">
            <div className="bg-storm-green/10 border border-storm-green/20 rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-storm-green/20 rounded-full text-storm-green">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-text-primary">Confirmar Pagamento</h4>
                    <p className="text-sm text-text-secondary">
                        Registrar pagamento de <strong>R$ {selectedClientForRenewal?.valorMensal.toFixed(2)}</strong>?
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nova Data de Vencimento</label>
                <input 
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-green outline-none"
                />
                <p className="text-xs text-text-secondary mt-1">
                    Calculado automaticamente (30 dias). Ajuste se necessário.
                </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
                <button 
                  onClick={() => setRenewModalOpen(false)}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmRenew}
                  className="px-6 py-2 bg-storm-green hover:bg-storm-green/90 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Confirmar Renovação
                </button>
            </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Cliente"
      >
        <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-storm-red" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Tem certeza?</h3>
           <p className="text-text-secondary mb-6">
             Você está prestes a excluir <strong>{clientToDelete?.nome}</strong> permanentemente. Esta ação não pode ser desfeita.
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
               className="px-6 py-2 bg-storm-red hover:bg-storm-red/90 text-white rounded-lg font-bold shadow-lg shadow-storm-red/20 flex items-center gap-2"
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
               Você atingiu o limite de <strong>{limitData.limit} clientes</strong> do seu plano atual.
               Faça upgrade para adicionar mais clientes.
            </p>
            <button 
              onClick={() => { setLimitModalOpen(false); window.location.reload(); }} // Simple reload to show plans via App logic or could redirect properly
              className="w-full bg-storm-purple text-white py-3 rounded-lg font-bold hover:bg-storm-purple/90"
            >
               Ver Planos
            </button>
         </div>
      </Modal>
    </div>
  );
};

export default ClientsList;