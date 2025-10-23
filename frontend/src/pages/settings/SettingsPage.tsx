import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Building2,
  Shield, 
  Users,
  Database,
  FileText,
  Heart
} from 'lucide-react';
import { IndustriesSection } from './IndustriesSection';
import { PlansSection } from './PlansSection';
import { BenefitsSection } from './BenefitsSection';

type SettingsSection = 'industries' | 'plans' | 'benefits' | 'system' | 'users' | 'data';

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('industries');

  const sections = [
    {
      id: 'industries' as SettingsSection,
      label: 'Industries',
      icon: Building2
    },
    {
      id: 'plans' as SettingsSection,
      label: 'Plans',
      icon: FileText
    },
    {
      id: 'benefits' as SettingsSection,
      label: 'Benefits',
      icon: Heart
    },
    {
      id: 'system' as SettingsSection,
      label: 'System',
      icon: SettingsIcon
    },
    {
      id: 'users' as SettingsSection,
      label: 'Users',
      icon: Users
    },
    {
      id: 'data' as SettingsSection,
      label: 'Data',
      icon: Database
    }
  ];

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b3b3b' }}>
            <SettingsIcon className="w-5 h-5" style={{ color: '#d1d5db' }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: '#ffffff' }}>
              Settings
            </h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              Manage system configuration and reference data
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r" style={{ backgroundColor: '#2a2a2a', borderColor: '#4a4a4a' }}>
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3" style={{ color: '#d1d5db' }}>
              Settings Sections
            </h3>
            <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                    isActive ? 'bg-gray-700' : 'hover:bg-gray-600'
                  }`}
                  style={{
                    backgroundColor: isActive ? '#404040' : 'transparent',
                    color: isActive ? '#ffffff' : '#d1d5db'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#3b3b3b';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#d1d5db';
                    }
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === 'industries' && <IndustriesSection />}
          {activeSection === 'plans' && <PlansSection />}
          {activeSection === 'benefits' && <BenefitsSection />}
          {activeSection === 'system' && (
            <div className="p-6">
              <div className="text-center py-12">
                <SettingsIcon className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
                  System Configuration
                </h3>
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  System settings and configuration options will be available here.
                </p>
              </div>
            </div>
          )}
          {activeSection === 'users' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
                  User Management
                </h3>
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  User management and permissions will be available here.
                </p>
              </div>
            </div>
          )}
          {activeSection === 'data' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Database className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
                <h3 className="text-lg font-medium mb-2" style={{ color: '#ffffff' }}>
                  Data Management
                </h3>
                <p className="text-sm" style={{ color: '#9ca3af' }}>
                  Data management and export options will be available here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;