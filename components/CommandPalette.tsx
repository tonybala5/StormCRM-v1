import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FlaskConical, FileText, ArrowRight, X } from 'lucide-react';
import { Cliente, Lead, TemplateMensagem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  leads: Lead[];
  templates: TemplateMensagem[];
  onNavigate: (type: 'cliente' | 'lead' | 'tab', id: string | number) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, clientes, leads, templates, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredClientes = query.length > 1 
    ? clientes.filter(c => c.nome.toLowerCase().includes(query.toLowerCase()) || c.telefone.includes(query)).slice(0, 3) 
    : [];
  
  const filteredLeads = query.length > 1
    ? leads.filter(l => l.nome.toLowerCase().includes(query.toLowerCase()) || l.telefone.includes(query)).slice(0, 3)
    : [];

  const filteredTemplates = query.length > 1
    ? templates.filter(t => t.titulo.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];

  const hasResults = filteredClientes.length > 0 || filteredLeads.length > 0 || filteredTemplates.length > 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-text-secondary mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-lg text-text-primary placeholder-text-secondary/50 outline-none"
            placeholder="Buscar clientes, leads ou comandos..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          <div className="flex items-center gap-2">
             <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary bg-bg-tertiary border border-border rounded">
                ESC
             </kbd>
             <button onClick={onClose} className="p-1 hover:bg-bg-tertiary rounded text-text-secondary">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!query && (
            <div className="p-4 text-center text-text-secondary">
               <p className="text-sm">Digite para buscar...</p>
               <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="text-xs bg-bg-tertiary px-2 py-1 rounded border border-border">Novo Cliente (Ctrl+N)</span>
                  <span className="text-xs bg-bg-tertiary px-2 py-1 rounded border border-border">Novo Lead (Ctrl+Shift+N)</span>
               </div>
            </div>
          )}

          {query && !hasResults && (
             <div className="p-8 text-center text-text-secondary">
               <p>Nenhum resultado encontrado.</p>
             </div>
          )}

          {filteredClientes.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Clientes</h4>
              {filteredClientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onNavigate('tab', 2); onClose(); }} // Simple nav to tab for now
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-storm-purple/10 hover:text-storm-purple transition-colors group"
                >
                  <div className="p-2 bg-bg-tertiary rounded-full text-text-secondary group-hover:text-storm-purple">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{c.nome}</p>
                    <p className="text-xs text-text-secondary group-hover:text-storm-purple/70">{c.telefone}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {filteredLeads.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Leads</h4>
              {filteredLeads.map(l => (
                <button
                  key={l.id}
                  onClick={() => { onNavigate('tab', 3); onClose(); }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-storm-cyan/10 hover:text-storm-cyan transition-colors group"
                >
                  <div className="p-2 bg-bg-tertiary rounded-full text-text-secondary group-hover:text-storm-cyan">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{l.nome}</p>
                    <p className="text-xs text-text-secondary group-hover:text-storm-cyan/70">{l.status}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {filteredTemplates.length > 0 && (
            <div className="mb-2">
              <h4 className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Scripts</h4>
              {filteredTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onNavigate('tab', 8); onClose(); }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-storm-green/10 hover:text-storm-green transition-colors group"
                >
                  <div className="p-2 bg-bg-tertiary rounded-full text-text-secondary group-hover:text-storm-green">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t.titulo}</p>
                    <p className="text-xs text-text-secondary group-hover:text-storm-green/70">{t.categoria}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-bg-tertiary border-t border-border text-xs text-text-secondary flex justify-between">
           <span>Use as setas para navegar</span>
           <span>Enter para selecionar</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;