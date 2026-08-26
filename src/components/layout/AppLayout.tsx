import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onNewPartnerClick?: () => void;
  partnerCount?: number;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeView,
  onNavigate,
  onNewPartnerClick,
  partnerCount = 0,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onNavigate={onNavigate}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onNewPartnerClick={onNewPartnerClick}
        partnerCount={partnerCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          activeView={activeView}
          onNavigate={onNavigate}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onNewPartnerClick={onNewPartnerClick}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
