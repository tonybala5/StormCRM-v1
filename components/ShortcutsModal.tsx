import React from 'react';
import Modal from './ui/Modal';
import { Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], desc: 'Abrir Busca Global' },
    { keys: ['Ctrl', 'N'], desc: 'Novo Cliente (Ir para Aba)' },
    { keys: ['Ctrl', 'Shift', 'N'], desc: 'Novo Lead (Ir para Aba)' },
    { keys: ['?'], desc: 'Mostrar este menu' },
    { keys: ['Esc'], desc: 'Fechar Modais' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atalhos de Teclado">
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-6">
           <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center">
              <Keyboard className="w-8 h-8 text-storm-purple" />
           </div>
        </div>
        <div className="grid gap-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary border border-border">
              <span className="text-text-primary text-sm font-medium">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-2 py-1 bg-bg-primary border border-border rounded text-xs font-mono text-text-secondary shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ShortcutsModal;