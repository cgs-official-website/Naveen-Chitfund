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
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#0B0408] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300 relative selection:bg-gold-500/30 selection:text-white">
      {/* Subtle luxury ambient backlights in dark mode */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-gold-500/5 dark:bg-gold-500/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-maroon-600/5 dark:bg-maroon-500/[0.04] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sidebar with desktop expand/collapse and mobile drawer */}
      <Sidebar
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isDesktopOpen={desktopOpen}
        onToggleDesktop={() => setDesktopOpen((prev) => !prev)}
      />

      {/* Main Content Area smoothly adjusted to desktop sidebar width with reference canvas styling */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          desktopOpen ? 'lg:pl-[280px]' : 'lg:pl-28'
        }`}
      >
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          isDesktopOpen={desktopOpen}
        />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-7 max-w-[1600px] w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
