import React, { useState } from "react";
import { 
  Clock, 
  Settings, 
  Box, 
  Cloud, 
  CheckCircle, 
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
  Users,
  Mail,
  Phone,
  MapPin,
  ExternalLink
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
  currentView = 'overview',
  onViewChange 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Navigation sections relevant to insurance/medical claims project
  const navigationSections = [
    {
      id: 'main',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: BarChart3,
          isActive: true
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          isActive: false
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
          isActive: false
        },
        {
          id: 'companies',
          label: 'Companies',
          icon: Building2,
          isActive: false
        },
        {
          id: 'members',
          label: 'Members',
          icon: Users,
          isActive: false
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
          isActive: false
        },
        {
          id: 'medical-catalog',
          label: 'Medical Catalog',
          icon: Shield,
          isActive: false
        },
        {
          id: 'schemes',
          label: 'Schemes',
          icon: CreditCard,
          isActive: false
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
          isActive: false
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart3,
          isActive: false
        }
      ]
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
        className={`fixed top-0 left-0 h-full bg-black transition-all duration-300 z-50 ${
          isOpen ? "w-64" : "w-0 lg:w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Profile Section - Top */}
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Piira</h2>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Edit3 className="w-3 h-3 text-gray-400" />
                    </button>
                    <button className="p-1 hover:bg-gray-800 rounded">
                      <Menu className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Pro Plan · sekiboh@gmail.com</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => (
              <div key={section.id}>
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-all duration-200 group ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      } ${!isOpen ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`} />
                      {isOpen && (
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                    </button>
                  );
                })}
                
                {/* Separator line between sections */}
                {sectionIndex < navigationSections.length - 1 && (
                  <div className="border-t border-gray-800 mt-4"></div>
                )}
              </div>
            ))}
          </nav>

          {/* Toggle Button - Bottom */}
          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-full flex items-center justify-center p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white"
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
