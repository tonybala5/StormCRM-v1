import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientsList from './components/ClientsList';
import LeadsList from './components/LeadsList';
import MessageTemplates from './components/MessageTemplates';
import AdsManagement from './components/AdsManagement';
import Indications from './components/Indications';
import Metrics from './components/Metrics';
import Checklist from './components/Checklist';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import StormAI from './components/StormAI';
import Login from './components/Login';
import Plans from './components/Plans';
import AdminPanel from './components/AdminPanel'; 
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import Onboarding from './components/Onboarding';
import Subscription from './components/Subscription';
import { storageService } from './services/storage';
import { authService } from './services/auth';
import { isFirebaseConfigured } from './services/firebase';
import { isSupabaseConfigured } from './services/supabase';
import { Menu, AlertTriangle, Clock, CloudOff, Database } from 'lucide-react';
import { Cliente, Lead, Task, Investimento, TemplateMensagem } from './types';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Modal from './components/ui/Modal';

import { ErrorBoundary } from './components/ui/ErrorBoundary';

function AppContent() {
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(1);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  
  // UX States
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('storm_setup_complete'));

  // Trial State
  const trialDaysLeft = authService.getTrialDaysRemaining();
  const isTrial = authService.getUserProfile()?.subscriptionStatus === 'trial';
  
  // Admin Check
  const isAdmin = authService.isSuperAdmin();

  // Config Check
  const isCloudActive = isFirebaseConfigured() || isSupabaseConfigured();
  const isSupabase = isSupabaseConfigured();

  // Dados globais (Centralized State)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
           (e.target as HTMLElement).blur();
        }
        return;
      }

      // Ctrl + K = Busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }

      // Ctrl + N = Novo Cliente (Go to tab 2)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setActiveTab(2);
        addToast('Aba de Clientes aberta. Clique em "Novo" para adicionar.', 'info');
      }

      // Ctrl + Shift + N = Novo Lead (Go to tab 3)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setActiveTab(3);
        addToast('Aba de Leads aberta.', 'info');
      }

      // ? = Ajuda
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- POLLING & AUTO-CHECK ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load initial data
    loadData();

    // Check Notifications / Background Updates every 60s
    const pollInterval = setInterval(() => {
       // Re-verify trial status
       if (authService.isTrialExpired()) {
          setIsTrialExpired(true);
       }
       // Simulate Auto-save check or background sync
       console.log('Background Sync Active...');
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);

  // Activity Timer
  useEffect(() => {
    if (!isAuthenticated) return;

    let activityTimer: ReturnType<typeof setTimeout>;
    let warningTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      setShowTimeoutWarning(false);
      
      authService.updateSessionActivity();

      warningTimer = setTimeout(() => {
        setShowTimeoutWarning(true);
      }, 25 * 60 * 1000); 

      activityTimer = setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer(); // Init

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        setIsAuthenticated(true);
        checkTrial();
        loadData();
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkTrial = () => {
     if (authService.isTrialExpired()) {
        setIsTrialExpired(true);
     }
  };

  const loadData = async () => {
    const [c, l, t, i, tpl] = await Promise.all([
        storageService.getClientes(),
        storageService.getLeads(),
        storageService.getTasks(),
        storageService.getInvestimentos(),
        storageService.getTemplates()
    ]);
    setClientes(c);
    setLeads(l);
    setTasks(t);
    setInvestimentos(i);
    setTemplates(tpl);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    checkTrial();
    loadData();
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setShowTimeoutWarning(false);
    setActiveTab(1); // Reset tab
  };

  const handlePlanUpdate = () => {
      setIsTrialExpired(false);
      window.location.reload();
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('storm_setup_complete', 'true');
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-storm-purple border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary font-medium animate-pulse">Carregando Storm CRM...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (activeTab === 99 && isAdmin) {
    return <AdminPanel onLogout={handleLogout} onBackToApp={() => setActiveTab(1)} />;
  }

  if (isTrialExpired) {
      return (
          <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
              <div className="max-w-4xl w-full bg-bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-8 text-center border-b border-border">
                      <div className="w-20 h-20 bg-storm-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Clock className="w-10 h-10 text-storm-red" />
                      </div>
                      <h1 className="text-3xl font-bold text-text-primary mb-2">Seu período de teste terminou</h1>
                      <p className="text-text-secondary max-w-lg mx-auto">
                          Seu acesso foi bloqueado. Para continuar gerenciando seus leads e clientes, atualize para o Plano Pro.
                      </p>
                  </div>
                  
                  <div className="max-h-[70vh] overflow-y-auto">
                      <Subscription />
                  </div>
                  
                  <div className="p-4 bg-bg-tertiary text-center border-t border-border">
                    <button onClick={handleLogout} className="text-sm text-text-secondary hover:text-text-primary underline">
                        Sair da conta
                    </button>
                  </div>
              </div>
          </div>
      );
  }

  const renderContent = () => {
    return (
      <div className="h-full animate-in fade-in zoom-in-95 duration-300">
        {(() => {
          switch (activeTab) {
            case 1: return <Dashboard clientes={clientes} leads={leads} />;
            case 2: return <ClientsList clientes={clientes} onUpdate={loadData} />;
            case 3: return <LeadsList leads={leads} onUpdate={loadData} />;
            case 4: return <AdsManagement investimentos={investimentos} onUpdate={loadData} clientes={clientes} leads={leads} />;
            case 5: return <Indications clientes={clientes} />;
            case 6: return <Metrics clientes={clientes} leads={leads} />;
            case 7: return <Checklist tasks={tasks} onUpdate={loadData} />;
            case 11: return <StormAI />;
            case 8: return <MessageTemplates />;
            case 9: return <Notifications clientes={clientes} leads={leads} tasks={tasks} />;
            case 10: return <Settings />;
            case 12: return <Subscription />;
            default: return <div className="p-8 text-center text-text-secondary">Módulo em desenvolvimento</div>;
          }
        })()}
      </div>
    );
  };

  const TrialBanner = () => {
      if (!isTrial) return null;
      let colorClass = 'bg-storm-green/10 text-storm-green border-storm-green/20';
      if (trialDaysLeft <= 2) colorClass = 'bg-storm-yellow/10 text-storm-yellow border-storm-yellow/20';
      if (trialDaysLeft <= 1) colorClass = 'bg-storm-red/10 text-storm-red border-storm-red/20';

      return (
          <div className={`px-4 py-2 border-b flex items-center justify-between ${colorClass}`}>
              <div className="flex items-center gap-2 text-sm font-bold">
                  {trialDaysLeft <= 1 ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span>
                      🎁 TESTE GRÁTIS - {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
                  </span>
              </div>
              <button onClick={() => setActiveTab(12)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">
                  Assinar Agora
              </button>
          </div>
      );
  };

  const ConfigBanner = () => {
      if (isSupabase) {
        return (
          <div className="px-4 py-1.5 bg-storm-cyan/20 border-b border-storm-cyan/30 flex items-center justify-center gap-2 text-xs font-bold text-storm-cyan">
             <Database className="w-3 h-3" />
             <span>MODO SUPABASE: Seus dados estão sincronizados na nuvem via Supabase.</span>
          </div>
        );
      }
      if (isCloudActive) return null;
      return (
        <div className="px-4 py-1.5 bg-storm-orange/20 border-b border-storm-orange/30 flex items-center justify-center gap-2 text-xs font-bold text-storm-orange">
           <CloudOff className="w-3 h-3" />
           <span>MODO LOCAL: Seus dados estão salvos apenas neste navegador. Configure o Firebase ou Supabase para sincronizar.</span>
        </div>
      );
  }

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary font-sans overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="md:hidden h-16 border-b border-border bg-bg-secondary flex items-center px-4 justify-between flex-shrink-0">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileOpen(true)} className="p-2 text-text-secondary hover:text-white">
               <Menu className="w-6 h-6" />
             </button>
             <span className="font-bold text-lg">Storm CRM</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-storm-purple/20 border border-storm-purple/50 flex items-center justify-center text-xs font-bold text-storm-purple">
               A
             </div>
           </div>
        </div>

        <ConfigBanner />
        <TrialBanner />

        <div className="flex-1 overflow-auto bg-bg-primary relative">
          {renderContent()}
        </div>
      </main>

      {/* UX Components */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        clientes={clientes}
        leads={leads}
        templates={templates}
        onNavigate={(type, id) => {
           if (type === 'tab') setActiveTab(Number(id));
           // Future: handle direct opening of edit modals by id
        }}
      />
      
      <ShortcutsModal 
        isOpen={shortcutsOpen} 
        onClose={() => setShortcutsOpen(false)} 
      />

      {showOnboarding && !isTrialExpired && (
        <Onboarding 
          user={authService.getUserProfile()}
          clientesCount={clientes.length}
          onNavigate={setActiveTab}
          onClose={handleCloseOnboarding}
        />
      )}

      <Modal isOpen={showTimeoutWarning} onClose={() => {}} title="Alerta de Inatividade">
          <div className="text-center">
             <p className="mb-6 text-text-secondary">Sua sessão expirará em breve devido à inatividade.</p>
             <button onClick={() => setShowTimeoutWarning(false)} className="px-6 py-2 bg-storm-purple hover:bg-storm-purple/90 text-white rounded-lg font-bold">
               Continuar Logado
             </button>
          </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}