import React from 'react';
import { Menu, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '@/store/ThemeContext';

interface TopbarProps {
  setSidebarOpen: (isOpen: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 px-4 md:px-8 bg-card border-b border-border flex items-center justify-between no-print sticky top-0 z-30 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 text-muted-foreground shrink-0">
        <button
          className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-foreground font-medium">الرئيسية</span>
          <span className="text-muted-foreground">/</span>
          <span>لوحة التحكم</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end md:flex-none">
        <div className="relative w-full md:w-auto">
          <input 
            type="text" 
            placeholder="بحث سريع..." 
            className="bg-muted border border-border rounded-full px-4 py-2 min-h-[44px] sm:min-h-[36px] sm:py-1.5 text-sm w-full md:w-64 focus:ring-2 focus:ring-primary/50 outline-none text-foreground placeholder-muted-foreground pr-10" 
          />
          <Search className="w-5 h-5 sm:w-4 sm:h-4 absolute right-3 top-3 sm:top-2.5 text-muted-foreground" />
        </div>
        
        <button
          onClick={toggleTheme}
          className="p-2.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-full hover:bg-muted text-muted-foreground transition-colors flex items-center justify-center shrink-0"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};
