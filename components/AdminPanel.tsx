import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { UserProfile, Transaction, PlanId } from '../types';
import { PLANS } from '../constants';
import { 
  LayoutDashboard, Users, CreditCard, Settings, LogOut, Search, 
  MoreVertical, CheckCircle2, AlertTriangle, XCircle, Clock, 
  TrendingUp, DollarSign, Package, Edit2, Shield, ArrowLeft 
} from 'lucide-react';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';

interface AdminPanelProps {
  onLogout: () => void;
  onBackToApp: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onBackToApp }) => {
  const { addToast } = useToast();
  const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'plans' | 'payments' | 'settings'>('dashboard');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Modals
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewUserModal, setViewUserModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const u = await storageService.getUsers();
    const t = await storageService.getTransactions();
    setUsers(u);
    setTransactions(t);
  };

  // --- ACTIONS ---

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      await storageService.saveUser(selectedUser);
      addToast('Usuário atualizado com sucesso.', 'success');
      setEditUserModal(false);
      refreshData();
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (confirm(`Tem certeza que deseja excluir ${email}? Esta ação é irreversível.`)) {
      await storageService.deleteUser(email);
      addToast('Usuário excluído.', 'info');
      refreshData();
    }
  };

  // --- VIEWS ---

  const renderDashboard = () => {
    const totalUsers = users.length;
    const trials = users.filter(u => u.subscriptionStatus === 'trial').length;
    const active = users.filter(u => u.subscriptionStatus === 'active').length;
    const mrr = transactions
      .filter(t => t.status === 'paid' && new Date(t.date).getMonth() === new Date().getMonth())
      .reduce((acc, t) => acc + t.amount, 0);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Dashboard Super Admin</h2>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">Usuários Totais</p>
                <h3 className="text-2xl font-bold text-white mt-1">{totalUsers}</h3>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Users className="w-5 h-5"/></div>
            </div>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">Em Trial</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{trials}</h3>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Clock className="w-5 h-5"/></div>
            </div>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">Assinantes</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{active}</h3>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><CheckCircle2 className="w-5 h-5"/></div>
            </div>
          </div>
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">MRR (Mês)</p>
                <h3 className="text-2xl font-bold text-white mt-1">R$ {mrr.toFixed(2)}</h3>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><DollarSign className="w-5 h-5"/></div>
            </div>
          </div>
        </div>

        {/* Charts Mockups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-64 flex flex-col items-center justify-center">
              <TrendingUp className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">Gráfico de Crescimento (Simulado)</p>
           </div>
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-64 flex flex-col items-center justify-center">
              <Package className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-slate-500 text-sm">Distribuição de Planos (Simulado)</p>
           </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Gestão de Usuários</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar usuário..." className="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 font-medium">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">Email</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map(u => (
                <tr key={u.id || u.email} className="hover:bg-slate-700/30">
                  <td className="p-4 font-medium text-white">{u.name || 'Sem nome'}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4 uppercase text-xs font-bold">{u.planId}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs border ${
                      u.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      u.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {u.subscriptionStatus}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => { setSelectedUser(u); setEditUserModal(true); }}
                      className="p-2 hover:bg-slate-700 rounded-lg text-blue-400 transition-colors" title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.email)}
                      className="p-2 hover:bg-slate-700 rounded-lg text-red-400 transition-colors" title="Excluir"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Transações</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/50 text-slate-400 font-medium">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Usuário</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/30">
                  <td className="p-4">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-4">{t.userName}</td>
                  <td className="p-4 uppercase">{t.planId}</td>
                  <td className="p-4 text-white font-medium">R$ {t.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs border ${
                      t.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma transação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Shield className="w-6 h-6 text-blue-500 mr-2" />
          <h1 className="font-bold text-white tracking-tight">Storm Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveView('users')}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeView === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5 mr-3" /> Usuários
          </button>
          <button 
            onClick={() => setActiveView('plans')}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeView === 'plans' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Package className="w-5 h-5 mr-3" /> Planos
          </button>
          <button 
            onClick={() => setActiveView('payments')}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeView === 'payments' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <CreditCard className="w-5 h-5 mr-3" /> Pagamentos
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeView === 'settings' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> Sistema
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button 
            onClick={onBackToApp}
            className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-3" /> Voltar ao App
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-red-900/20 text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'users' && renderUsers()}
        {activeView === 'payments' && renderPayments()}
        {activeView === 'plans' && <div className="text-center py-20 text-slate-500">Módulo de Planos em Desenvolvimento</div>}
        {activeView === 'settings' && <div className="text-center py-20 text-slate-500">Configurações do Sistema em Desenvolvimento</div>}
      </main>

      {/* Modal: Edit User */}
      <Modal isOpen={editUserModal} onClose={() => setEditUserModal(false)} title="Editar Usuário">
        {selectedUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4 text-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome</label>
              <input 
                type="text" value={selectedUser.name || ''} 
                onChange={e => setSelectedUser({...selectedUser, name: e.target.value})}
                className="w-full border rounded p-2 bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email (Não editável)</label>
              <input type="text" value={selectedUser.email} disabled className="w-full border rounded p-2 bg-slate-200 text-slate-500 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Plano</label>
                <select 
                  value={selectedUser.planId} 
                  onChange={e => setSelectedUser({...selectedUser, planId: e.target.value as PlanId})}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status</label>
                <select 
                  value={selectedUser.subscriptionStatus} 
                  onChange={e => setSelectedUser({...selectedUser, subscriptionStatus: e.target.value as any})}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="active">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="expired">Expirado</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setEditUserModal(false)} className="px-4 py-2 border rounded hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar Alterações</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel;