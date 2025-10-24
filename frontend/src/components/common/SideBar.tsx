import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Settings, 
  FileText, 
  Menu, 
  X, 
  User,
  Building2,
  Stethoscope,
  CreditCard,
  Users,
  Home,
  ChevronRight,
  Activity,
  PieChart,
  TrendingUp
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

  // Navigation items with line separators
  const navigationItems: Array<{
    id: string;
    label?: string;
    icon?: any;
    path?: string;
    isSeparator?: boolean;
  }> = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: Home,
      path: '/'
    },
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
    },
    // Separator line
    { id: 'separator1', isSeparator: true },
    {
      id: 'providers',
      label: 'Providers',
      icon: Stethoscope,
      path: '/providers'
    },
    {
      id: 'medical-catalog',
      label: 'Medical Catalog',
      icon: Activity,
      path: '/medical-catalog'
    },
    {
      id: 'schemes',
      label: 'Schemes',
      icon: CreditCard,
      path: '/schemes'
    },
    // Separator line
    { id: 'separator2', isSeparator: true },
    {
      id: 'reports',
      label: 'Reports',
      icon: PieChart,
      path: '/reports'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      path: '/analytics'
    },
    // Separator line
    { id: 'separator3', isSeparator: true },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings'
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

      {/* Sidebar - Cursor-inspired design */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 h-full transition-all duration-300 z-40 ${
          // Mobile/Tablet: Slide in from left when open, hidden when closed
          // Desktop: Always visible, wide when open, narrow when closed
          isOpen 
            ? "left-0 w-80 sm:w-96 lg:left-0 lg:w-64" 
            : "-left-80 sm:-left-96 lg:left-0 lg:w-16"
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <div className="flex flex-col h-full relative">
          {/* Swipe indicator for mobile */}
          <div className="lg:hidden absolute top-1/2 right-2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-transparent via-gray-600 to-transparent rounded-full opacity-30"></div>
          
          {/* Mobile Header - Only visible on mobile/tablet */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: '#2a2a2a' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ultra</h2>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Section - Top (Desktop only) */}
          <div className="hidden lg:flex px-4 border-b flex-shrink-0 items-center" style={{ height: '60px', borderColor: '#2a2a2a' }}>
            <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Ultra</h2>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#2a2a2a', color: '#9ca3af' }}>Pro</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation - Clean design with separator lines */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-nav">
            <div className="space-y-0.5">
              {navigationItems.map((item) => {
                // Render separator line
                if (item.isSeparator) {
                  return (
                    <hr 
                      key={item.id} 
                      className="my-3 border-gray-700" 
                      style={{ borderColor: '#374151' }}
                    />
                  );
                }

                // Render navigation item
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.id}
                    to={item.path || '/'}
                    className={`sidebar-nav-item ${
                      isActive ? 'active' : ''
                    } ${!isOpen ? 'justify-center' : ''}`}
                    title={!isOpen ? item.label : undefined}
                  >
                    {Icon && (
                      <Icon className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`} />
                    )}
                    {isOpen && (
                      <>
                        <span className="text-sm font-normal truncate">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 ml-auto text-white" />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Mobile Footer - Only visible on mobile/tablet */}
          <div className="lg:hidden px-4 py-4 border-t flex-shrink-0" style={{ borderColor: '#2a2a2a' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Piira</p>
                <p className="text-xs text-gray-400">sekiboh@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Toggle Button - Bottom (Desktop only) */}
          <div className="hidden lg:block px-3 py-3 border-t flex-shrink-0" style={{ borderColor: '#2a2a2a' }}>
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
