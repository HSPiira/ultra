import React, { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  User,
  ChevronDown,
  Building2,
  Stethoscope,
  CreditCard
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  currentView = 'dashboard',
  onViewChange 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '#'
    },
    {
      id: 'claims',
      label: 'Claims',
      icon: FileText,
      href: '#'
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: Shield,
      href: '#'
    },
    {
      id: 'providers',
      label: 'Providers',
      icon: Stethoscope,
      href: '#'
    },
    {
      id: 'members',
      label: 'Members',
      icon: Users,
      href: '#'
    },
    {
      id: 'companies',
      label: 'Companies',
      icon: Building2,
      href: '#'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      href: '#'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '#'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '#'
    }
  ];

  const handleItemClick = (itemId: string) => {
    if (onViewChange) {
      onViewChange(itemId);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 transition-all duration-300 z-50 ${
          isOpen ? "w-64" : "w-0 lg:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header - Fixed */}
          <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 flex-shrink-0">
            {isOpen && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 text-lg">MedInsure</h1>
                  <p className="text-xs text-slate-500">Insurance Platform</p>
                </div>
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                  }`} />
                  {isOpen && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {isActive && isOpen && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Section - Fixed */}
          <div className="p-4 border-t border-slate-200 flex-shrink-0">
            <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">Admin User</p>
                  <p className="text-xs text-slate-500 truncate">admin@medinsure.com</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed */}
          {isOpen && (
            <div className="px-4 py-3 border-t border-slate-200 flex-shrink-0">
              <p className="text-xs text-slate-500 text-center">
                © {new Date().getFullYear()} MedInsure
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
