import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FlaskConical, 
  TrendingUp, 
  Gift, 
  BarChart2, 
  CheckSquare, 
  MessageSquare, 
  Bell, 
  Settings,
  LogOut,
  Bot,
  Shield
} from 'lucide-react';
import { authService } from '../services/auth'; // Import auth service to check admin

interface SidebarProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const MENU_ITEMS = [
  { id: 1, label: 'Dashboard', icon: LayoutDashboard },
  { id: 2, label: 'Clientes Ativos', icon: Users },
  { id: 3, label: 'Leads em Teste', icon: FlaskConical },
  { id: 4, label: 'Investimento Ads', icon: TrendingUp },
  { id: 5, label: 'Indicações', icon: Gift },
  { id: 6, label: 'Métricas', icon: BarChart2 },
  { id: 7, label: 'Checklist', icon: CheckSquare },
  { id: 11, label: 'Storm AI', icon: Bot },
  { id: 8, label: 'Mensagens', icon: MessageSquare },
  { id: 9, label: 'Notificações', icon: Bell },
  { id: 10, label: 'Configurações', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
  const isAdmin = authService.isSuperAdmin();
  const user = authService.getUserProfile();

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-border transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-border bg-bg-tertiary">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-storm-purple to-storm-cyan flex items-center justify-center mr-3">
              <span className="font-bold text-white text-lg">S</span>
            </div>
            <h1 className="text-lg font-bold text-text-primary tracking-tight">Storm CRM</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              // Special styling for AI tab
              const isAI = item.id === 11;
              const activeClass = isActive 
                ? 'bg-storm-purple/10 text-storm-purple border border-storm-purple/20' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary';
              
              const aiClass = isActive
                ? 'bg-gradient-to-r from-storm-purple/20 to-storm-cyan/20 text-white border border-storm-purple/50'
                : 'text-storm-cyan hover:bg-storm-cyan/10';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isAI ? aiClass : activeClass}
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isAI ? (isActive ? 'text-white' : 'text-storm-cyan') : (isActive ? 'text-storm-purple' : 'text-text-secondary')}`} />
                  {item.label}
                  {isAI && <span className="ml-auto text-[10px] bg-storm-cyan text-black font-bold px-1.5 rounded">NEW</span>}
                </button>
              );
            })}

            {/* Admin Link */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-border">
                <button
                  onClick={() => {
                    setActiveTab(99);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-bold transition-all
                    bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-400 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/30
                    shadow-[0_0_15px_rgba(239,68,68,0.1)]
                  `}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Painel Admin
                </button>
              </div>
            )}
          </nav>

          {/* Footer / User Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-bg-tertiary border border-border flex items-center justify-center text-text-secondary overflow-hidden">
                {isAdmin ? <Shield className="w-5 h-5 text-storm-purple" /> : <Users className="w-5 h-5" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'Usuário'}</p>
                <p className="text-xs text-text-secondary truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-storm-red hover:bg-storm-red/10 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;