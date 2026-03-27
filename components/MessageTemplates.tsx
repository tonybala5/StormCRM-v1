import React, { useState, useEffect } from 'react';
import { TemplateMensagem } from '../types';
import { storageService } from '../services/storage';
import { Plus, Search, MessageSquare, Copy, Edit2, Trash2, Check, Filter, AlertTriangle, FileJson, FileText, Printer } from 'lucide-react';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';
import { exportUtils } from '../services/exportUtils';

const MessageTemplates: React.FC = () => {
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TemplateMensagem | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TemplateMensagem>>({
    titulo: '',
    categoria: 'Vendas',
    conteudo: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await storageService.getTemplates();
    setTemplates(data);
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.conteudo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todos' || t.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Copiado para a área de transferência', 'success');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTemplate: TemplateMensagem = {
      id: editingId || crypto.randomUUID(),
      titulo: formData.titulo || 'Novo Script',
      categoria: (formData.categoria as any) || 'Vendas',
      conteudo: formData.conteudo || ''
    };
    await storageService.saveTemplate(newTemplate);
    loadTemplates();
    setIsModalOpen(false);
    resetForm();
    addToast(editingId ? 'Script atualizado' : 'Novo script criado', 'success');
  };

  const requestDelete = (item: TemplateMensagem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await storageService.deleteTemplate(itemToDelete.id);
      loadTemplates();
      setDeleteModalOpen(false);
      setItemToDelete(null);
      addToast('Script removido.', 'info');
    }
  };

  const handleEdit = (tpl: TemplateMensagem) => {
    setEditingId(tpl.id);
    setFormData(tpl);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      titulo: '',
      categoria: 'Vendas',
      conteudo: ''
    });
  };

  // --- Exports ---
  const handleExportJSON = () => {
    exportUtils.downloadJSON(templates, 'scripts_mensagens_ai');
  };
  const handleExportTXT = () => {
    const content = templates.map(t => 
      `### ${t.titulo} (${t.categoria}) ###\n${t.conteudo}\n-------------------`
    ).join('\n');
    exportUtils.downloadTXT('SCRIPTS DE MENSAGENS', content, 'scripts_vendas');
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Vendas': return 'text-storm-cyan bg-storm-cyan/10 border-storm-cyan/20';
      case 'Cobranca': return 'text-storm-red bg-storm-red/10 border-storm-red/20';
      case 'Suporte': return 'text-storm-orange bg-storm-orange/10 border-storm-orange/20';
      case 'Boas-vindas': return 'text-storm-green bg-storm-green/10 border-storm-green/20';
      default: return 'text-text-secondary bg-bg-tertiary';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Scripts & Mensagens</h2>
          <p className="text-text-secondary text-sm">Centralize seus scripts de venda e suporte</p>
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
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-storm-cyan hover:bg-storm-cyan/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
            <Plus className="w-5 h-5" />
            Novo Script
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-bg-secondary p-3 rounded-xl border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Buscar scripts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-tertiary border-none rounded-lg py-2 pl-10 pr-4 text-text-primary focus:ring-2 focus:ring-storm-cyan placeholder-text-secondary/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="w-5 h-5 text-text-secondary hidden md:block" />
          {['todos', 'Vendas', 'Cobranca', 'Boas-vindas', 'Suporte'].map(cat => (
             <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat 
                  ? 'bg-storm-cyan text-white' 
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
        {filteredTemplates.map(tpl => (
          <div key={tpl.id} className="bg-bg-secondary border border-border rounded-xl p-5 flex flex-col group hover:border-storm-cyan/30 transition-all break-inside-avoid">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-bg-tertiary rounded-lg text-text-secondary">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-text-primary">{tpl.titulo}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(tpl.categoria)}`}>
                {tpl.categoria.toUpperCase()}
              </span>
            </div>

            <div className="bg-bg-primary rounded-lg p-3 text-sm text-text-secondary font-mono mb-4 flex-1 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-primary/90 pointer-events-none" />
               <p className="whitespace-pre-line">{tpl.conteudo.substring(0, 150)}...</p>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border print:hidden">
              <button 
                onClick={() => handleCopy(tpl.conteudo, tpl.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  copiedId === tpl.id 
                    ? 'bg-storm-green text-white' 
                    : 'bg-bg-tertiary hover:bg-storm-cyan hover:text-white text-text-secondary'
                }`}
              >
                {copiedId === tpl.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedId === tpl.id ? 'Copiado!' : 'Copiar'}
              </button>
              
              <button 
                onClick={() => handleEdit(tpl)}
                className="p-2 hover:bg-bg-tertiary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => requestDelete(tpl)}
                className="p-2 hover:bg-storm-red/10 text-text-secondary hover:text-storm-red rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Edit/Create */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Script' : 'Novo Script'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Título</label>
            <input 
              required
              type="text"
              placeholder="Ex: Cobrança Atrasada"
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Categoria</label>
            <select 
              value={formData.categoria}
              onChange={e => setFormData({...formData, categoria: e.target.value as any})}
              className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none"
            >
              <option value="Vendas">Vendas</option>
              <option value="Cobranca">Cobrança</option>
              <option value="Boas-vindas">Boas-vindas</option>
              <option value="Suporte">Suporte</option>
            </select>
          </div>

          <div>
             <div className="flex justify-between items-center mb-1">
               <label className="block text-sm font-medium text-text-secondary">Conteúdo da Mensagem</label>
               <span className="text-xs text-storm-cyan cursor-help" title="Use {nome} para substituir pelo nome do cliente">Variáveis: {'{nome}'}</span>
             </div>
             <textarea 
               required
               rows={6}
               placeholder="Olá {nome}, seu teste expirou..."
               value={formData.conteudo}
               onChange={e => setFormData({...formData, conteudo: e.target.value})}
               className="w-full bg-bg-tertiary border border-border rounded-lg p-2.5 text-text-primary focus:ring-2 focus:ring-storm-cyan outline-none resize-none font-mono text-sm"
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
        title="Excluir Script"
      >
        <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-storm-red" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Tem certeza?</h3>
           <p className="text-text-secondary mb-6">
             Você vai excluir o script <strong>{itemToDelete?.titulo}</strong>.
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

export default MessageTemplates;