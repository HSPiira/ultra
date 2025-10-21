import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Settings, 
  BarChart3, 
  FileText, 
  Edit3, 
  Menu, 
  X, 
  User,
  Building2,
  Stethoscope,
  CreditCard,
  Shield,
  Users
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle
}) => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Auto-hide sidebar on mobile when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 1024 && isOpen) {
        onToggle();
      }
    };

    // Listen for route changes
    const timer = setTimeout(handleRouteChange, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, isOpen, onToggle]);

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isOpen) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = Math.abs(touchStartY.current - touchEndY);

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        // Swipe left - close sidebar
        onToggle();
      }
    }
  };

  // Navigation sections relevant to insurance/medical claims project
  const navigationSections = [
    {
      id: 'main',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: BarChart3,
          path: '/'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/settings'
        }
      ]
    },
    {
      id: 'core',
      items: [
        {
          id: 'claims',
          label: 'Claims',
          icon: FileText,
          path: '/claims'
        },
        {
          id: 'companies',
          label: 'Companies',
          icon: Building2,
          path: '/companies'
        },
        {
          id: 'members',
          label: 'Members',
          icon: Users,
          path: '/members'
        }
      ]
    },
    {
      id: 'providers',
      items: [
        {
          id: 'providers',
          label: 'Providers',
          icon: Stethoscope,
          path: '/providers'
        },
        {
          id: 'medical-catalog',
          label: 'Medical Catalog',
          icon: Shield,
          path: '/medical-catalog'
        },
        {
          id: 'schemes',
          label: 'Schemes',
          icon: CreditCard,
          path: '/schemes'
        }
      ]
    },
    {
      id: 'analytics',
      items: [
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
          path: '/reports'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          path: '/analytics'
        }
      ]
    }
  ];


  return (
    <>
      {/* Mobile overlay - only on mobile/tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - Different behavior for mobile vs desktop */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 h-full transition-all duration-300 z-40 ${
          // Mobile/Tablet: Slide in from left when open, hidden when closed
          // Desktop: Always visible, wide when open, narrow when closed
          isOpen 
            ? "left-0 w-80 sm:w-96 lg:left-0 lg:w-64" 
            : "-left-80 sm:-left-96 lg:left-0 lg:w-20"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full relative">
          {/* Swipe indicator for mobile */}
          <div className="lg:hidden absolute top-1/2 right-2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-transparent via-gray-600 to-transparent rounded-full opacity-30"></div>
          
          {/* Mobile Header - Only visible on mobile/tablet */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800" style={{ backgroundColor: '#1a1a1a' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">MedInsure</h2>
                <p className="text-sm text-gray-400">Insurance Management</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Section - Top (Desktop only) */}
          <div className="hidden lg:flex px-3 border-b border-gray-800 flex-shrink-0 items-center" style={{ height: '60px', backgroundColor: '#1a1a1a' }}>
            <div className={`flex items-center gap-2 ${!isOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Piira</h2>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Menu className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">Pro Plan · sekiboh@gmail.com</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-2 sm:px-3 py-4 lg:px-2 lg:py-3 space-y-1 overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => (
              <div key={section.id} className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`w-full flex items-center gap-3 lg:gap-2 px-3 py-3 lg:px-2 lg:py-2 rounded-lg lg:rounded-md transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      } ${!isOpen ? 'justify-center' : ''}`}
                      title={!isOpen ? item.label : undefined}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`} />
                      {isOpen && (
                        <span className="text-base font-normal truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
                
                {/* Separator line between sections */}
                {sectionIndex < navigationSections.length - 1 && (
                  <div className="border-t border-gray-800 mt-2 mb-2"></div>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Footer - Only visible on mobile/tablet */}
          <div className="lg:hidden px-4 py-4 border-t border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-white">Piira</p>
                <p className="text-sm text-gray-400">sekiboh@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Toggle Button - Bottom (Desktop only) */}
          <div className="hidden lg:block px-3 py-3 border-t border-gray-800 flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
