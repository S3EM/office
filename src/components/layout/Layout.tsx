import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/store/AuthContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans print:h-auto print:bg-white" dir="rtl">
      <div className="print:hidden h-full flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden bg-background print:bg-white print:overflow-visible">
        <div className="print:hidden">
          <Topbar setSidebarOpen={setSidebarOpen} />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
