import React, { useState } from 'react';
import { Task } from '../types';
import { storageService } from '../services/storage';
import { Plus, CheckSquare, Square, Trash2, Filter, Flag, AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import { useToast } from '../contexts/ToastContext';

interface ChecklistProps {
  tasks: Task[];
  onUpdate: () => void;
}

const Checklist: React.FC<ChecklistProps> = ({ tasks, onUpdate }) => {
  const { addToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // New Task Input
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Media' | 'Baixa'>('Media');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText,
      priority: newTaskPriority,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    await storageService.saveTask(newTask);
    setNewTaskText('');
    onUpdate();
  };

  const toggleTask = async (task: Task) => {
    await storageService.saveTask({ ...task, isCompleted: !task.isCompleted });
    onUpdate();
  };

  const requestDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await storageService.deleteTask(taskToDelete.id);
      onUpdate();
      setDeleteModalOpen(false);
      setTaskToDelete(null);
      addToast('Tarefa removida.', 'info');
    }
  };

  // Logic
  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  }).sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    const pMap = { 'Alta': 3, 'Media': 2, 'Baixa': 1 };
    return pMap[b.priority] - pMap[a.priority];
  });

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Alta': return 'text-storm-red border-storm-red/30 bg-storm-red/10';
      case 'Media': return 'text-storm-yellow border-storm-yellow/30 bg-storm-yellow/10';
      case 'Baixa': return 'text-storm-green border-storm-green/30 bg-storm-green/10';
      default: return 'text-text-secondary';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Checklist Diário</h2>
        <p className="text-text-secondary text-sm mb-4">Organize suas tarefas e pendências do dia.</p>
        
        {/* Progress Bar */}
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-text-primary">Progresso</span>
            <span className="text-storm-purple">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full bg-storm-purple rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-2 text-center">
            {completedCount} de {tasks.length} tarefas concluídas
          </p>
        </div>
      </div>

      {/* Input Area */}
      <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
           <input 
             type="text"
             placeholder="O que precisa ser feito hoje?"
             value={newTaskText}
             onChange={(e) => setNewTaskText(e.target.value)}
             className="w-full h-12 bg-bg-secondary border border-border rounded-xl px-4 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none"
           />
        </div>
        <select 
          value={newTaskPriority}
          onChange={(e) => setNewTaskPriority(e.target.value as any)}
          className="h-12 bg-bg-secondary border border-border rounded-xl px-4 text-text-primary focus:ring-2 focus:ring-storm-purple outline-none cursor-pointer"
        >
          <option value="Alta">Alta</option>
          <option value="Media">Média</option>
          <option value="Baixa">Baixa</option>
        </select>
        <button 
          type="submit"
          className="h-12 px-6 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Adicionar</span>
        </button>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
         <Filter className="w-4 h-4 text-text-secondary" />
         {(['all', 'pending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                filter === f 
                  ? 'bg-text-primary text-bg-primary' 
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
            </button>
         ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-text-secondary bg-bg-secondary/30 rounded-xl border border-border border-dashed">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhuma tarefa encontrada.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id}
              className={`group flex items-center gap-3 p-4 rounded-xl border transition-all ${
                task.isCompleted 
                  ? 'bg-bg-tertiary/50 border-transparent opacity-60' 
                  : 'bg-bg-secondary border-border hover:border-storm-purple/30'
              }`}
            >
              <button 
                onClick={() => toggleTask(task)}
                className={`flex-shrink-0 transition-colors ${task.isCompleted ? 'text-storm-green' : 'text-text-secondary hover:text-storm-purple'}`}
              >
                {task.isCompleted ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${task.isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                  {task.text}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Criado em: {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>

              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                 <Flag className="w-3 h-3" />
                 {task.priority}
              </span>

              <button 
                onClick={() => requestDelete(task)}
                className="p-2 text-text-secondary hover:text-storm-red hover:bg-storm-red/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Tarefa"
      >
        <div className="text-center p-4">
           <div className="w-16 h-16 bg-storm-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertTriangle className="w-8 h-8 text-storm-red" />
           </div>
           <h3 className="text-xl font-bold text-text-primary mb-2">Confirmar Exclusão</h3>
           <p className="text-text-secondary mb-6">
             Deseja realmente remover a tarefa <strong>"{taskToDelete?.text}"</strong>?
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

export default Checklist;