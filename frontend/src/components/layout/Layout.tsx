import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../common/Header';
import Sidebar from '../common/SideBar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      if (sidebarOpen) {
        document.body.classList.add('sidebar-open');
      } else {
        document.body.classList.remove('sidebar-open');
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [sidebarOpen]);


  return (
    <div className="h-screen overflow-hidden" style={{ backgroundColor: '#141414' }}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
      />
      
      {/* Main content area - responsive positioning */}
      <div 
        className={`flex flex-col h-full transition-all duration-300 ${
          // Mobile & Tablet: no margin (sidebar slides in from left)
          // Desktop: margin based on sidebar state
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Header */}
        <Header 
          onMenuToggle={handleSidebarToggle}
        />
        
        {/* Main content */}
        <main 
          className="flex-1 overflow-auto" 
          style={{ backgroundColor: '#141414' }}
        >
          <div className="p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
