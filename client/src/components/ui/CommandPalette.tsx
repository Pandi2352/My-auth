import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  KeyRound, 
  Mail, 
  Terminal,
  Moon,
  Sun,
  LayoutDashboard,
  LogOut,
  Command,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useAppSettings } from '@/hooks/useAppSettings';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  shortcut?: string;
  category: 'Navigation' | 'Actions' | 'Tools';
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { siteName } = useAppSettings();

  const commands: CommandItem[] = useMemo(() => [
    { 
      id: 'nav-dashboard', 
      title: 'Dashboard', 
      description: 'System overview and live activity',
      icon: LayoutDashboard, 
      category: 'Navigation',
      action: () => navigate('/dashboard') 
    },
    { 
      id: 'nav-users', 
      title: 'Users Management', 
      description: 'Orchestrate user accounts and status',
      icon: Users, 
      category: 'Navigation',
      action: () => navigate('/users') 
    },
    { 
      id: 'nav-roles', 
      title: 'Roles & RBAC', 
      description: 'Manage permissions and access levels',
      icon: Shield, 
      category: 'Navigation',
      action: () => navigate('/roles') 
    },
    { 
      id: 'nav-analytics', 
      title: 'Analytics Hub', 
      description: 'Visualize system growth and trends',
      icon: BarChart3, 
      category: 'Navigation',
      action: () => navigate('/analytics') 
    },
    { 
      id: 'nav-settings', 
      title: 'System Settings', 
      description: 'Global configuration and branding',
      icon: Settings, 
      category: 'Navigation',
      action: () => navigate('/settings') 
    },
    { 
      id: 'action-logout', 
      title: 'Logout', 
      description: 'Securely terminate current session',
      icon: LogOut, 
      category: 'Actions',
      action: () => logout() 
    },
    { 
      id: 'tool-audit', 
      title: 'Audit Logs', 
      description: 'Security and administrative audit trail',
      icon: Terminal, 
      category: 'Tools',
      action: () => navigate('/audit-logs') 
    },
  ], [navigate, logout]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.title.toLowerCase().includes(lowerQuery) || 
      cmd.description?.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  // Handle arrow navigation and enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        filteredCommands[activeIndex].action();
        setIsOpen(false);
        setQuery('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-in fade-in duration-200" 
        onClick={() => setIsOpen(false)} 
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-zinc-800 h-14 bg-slate-50/50 dark:bg-zinc-900/50">
          <Search className="h-5 w-5 text-slate-400" />
          <input 
            autoFocus
            placeholder={`Search ${siteName} commands...`}
            className="flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-zinc-200 text-sm font-medium"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1.5 grayscale opacity-50">
             <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-bold">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 custom-palette-scrollbar">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {['Navigation', 'Actions', 'Tools'].map(category => {
                const catItems = filteredCommands.filter(c => c.category === category);
                if (catItems.length === 0) return null;

                return (
                  <div key={category} className="mb-2 last:mb-0">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none bg-slate-50/50 dark:bg-zinc-800/30 rounded-md mb-1">{category}</p>
                    {catItems.map((cmd) => {
                      const isSelected = filteredCommands[activeIndex]?.id === cmd.id;
                      const Icon = cmd.icon;

                      return (
                        <div
                          key={cmd.id}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-100",
                            isSelected 
                              ? "bg-primary text-white shadow-lg shadow-primary/20" 
                              : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                          )}
                          onMouseEnter={() => {
                             const idx = filteredCommands.findIndex(f => f.id === cmd.id);
                             setActiveIndex(idx);
                          }}
                          onClick={() => {
                            cmd.action();
                            setIsOpen(false);
                            setQuery('');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded-md",
                              isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700"
                            )}>
                               <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold leading-none">{cmd.title}</span>
                              {cmd.description && (
                                <span className={cn(
                                  "text-[11px] mt-1 line-clamp-1",
                                  isSelected ? "text-white/70" : "text-slate-400"
                                )}>
                                  {cmd.description}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-right-3 duration-200">
                               GO <ArrowRight className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
               <div className="h-10 w-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <Command className="h-5 w-5" />
               </div>
               <p className="text-xs font-bold uppercase tracking-widest">No matching frequencies detected</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 h-10 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/30 dark:bg-zinc-950/50">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white dark:bg-zinc-800 text-[10px] font-bold">↑↓</kbd>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white dark:bg-zinc-800 text-[10px] font-bold">↵</kbd>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Select</span>
              </div>
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Antigravity Engine V2</p>
        </div>
      </div>
    </div>
  );
}
