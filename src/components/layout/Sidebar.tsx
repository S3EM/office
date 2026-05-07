import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { to: '/chat', icon: MessageSquare, label: 'المساعد الذكي' },
    { to: '/settings', icon: Settings, label: 'الإعدادات' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-64 bg-card border-l border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static flex flex-col no-print",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-md flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white">
              <LayoutDashboard size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">مكتب النائب</span>
          </div>
          <button 
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-muted text-emerald-500 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 p-2 bg-muted rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-400 dark:bg-slate-600 border border-border"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">المستخدم</p>
              <p className="text-[10px] text-muted-foreground uppercase">مدير المكتب</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};
