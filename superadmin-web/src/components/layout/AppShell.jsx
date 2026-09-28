import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Sidebar with desktop expand/collapse and mobile drawer */}
      <Sidebar
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isDesktopOpen={desktopOpen}
        onToggleDesktop={() => setDesktopOpen((prev) => !prev)}
      />

      {/* Main Content Area smoothly adjusted to desktop sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          desktopOpen ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          isDesktopOpen={desktopOpen}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
