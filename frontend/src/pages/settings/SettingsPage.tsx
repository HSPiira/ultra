import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Key, 
  Globe, 
  Save,
  Eye,
  EyeOff,
  Check,
  AlertCircle
} from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    claims: true,
    payments: true,
    reports: false
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 30,
    passwordExpiry: 90
  });

  const sections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Manage your personal information',
      icon: User
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure notification preferences',
      icon: Bell
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Password and security settings',
      icon: Shield
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'External service connections',
      icon: Globe
    },
    {
      id: 'data',
      title: 'Data & Privacy',
      description: 'Data management and privacy controls',
      icon: Database
    },
    {
      id: 'billing',
      title: 'Billing',
      description: 'Subscription and payment settings',
      icon: Key
    }
  ];

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="Piira"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              defaultValue="sekiboh@gmail.com"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              defaultValue="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option>Administrator</option>
              <option>Manager</option>
              <option>Agent</option>
              <option>Viewer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
            <input
              type="text"
              defaultValue="MedInsure Corp"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
            <select className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option>Insurance</option>
              <option>Healthcare</option>
              <option>Financial Services</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-400">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'push' && 'Browser push notifications'}
                  {key === 'sms' && 'SMS notifications for urgent matters'}
                  {key === 'claims' && 'New claims and updates'}
                  {key === 'payments' && 'Payment confirmations and reminders'}
                  {key === 'reports' && 'Weekly and monthly reports'}
                </p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full #1a1a1a transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <h4 className="text-sm font-medium text-white">Email Notifications</h4>
              <p className="text-sm text-gray-400">sekiboh@gmail.com</p>
            </div>
            <button className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium">
              Change
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <div>
              <h4 className="text-sm font-medium text-white">Push Notifications</h4>
              <p className="text-sm text-gray-400">Browser notifications enabled</p>
            </div>
            <button className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium">
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Password & Authentication</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 pr-10 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </div>

      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <button
              onClick={() => setSecurity(prev => ({ ...prev, twoFactor: !prev.twoFactor }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                security.twoFactor ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full #1a1a1a transition-transform ${
                  security.twoFactor ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Session Timeout</h4>
              <p className="text-sm text-gray-400">Automatically log out after inactivity</p>
            </div>
            <select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              className="px-3 py-1 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIntegrationsSection = () => (
    <div className="space-y-6">
      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Connected Services</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border #2a2a2a rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Email Service</h4>
                <p className="text-sm text-gray-400">SMTP configuration for notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Connected
              </span>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Configure
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border #2a2a2a rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">Database Backup</h4>
                <p className="text-sm text-gray-400">Automated daily backups</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Pending
              </span>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSection = () => (
    <div className="space-y-6">
      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Data Export</h3>
        <p className="text-sm text-gray-400 mb-4">
          Download your data in various formats for backup or migration purposes.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Export All Data
          </button>
          <button className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
            Export Claims Only
          </button>
        </div>
      </div>

      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Data Retention</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Claims Data Retention</label>
            <select className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option>7 years (Recommended)</option>
              <option>5 years</option>
              <option>10 years</option>
              <option>Indefinitely</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Log Data Retention</label>
            <select className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
              <option>1 year</option>
              <option>6 months</option>
              <option>2 years</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingSection = () => (
    <div className="space-y-6">
      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Current Plan</h3>
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <h4 className="text-lg font-semibold text-blue-900">Pro Plan</h4>
            <p className="text-sm text-blue-700">$99/month • Billed annually</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-700">Next billing: Jan 15, 2024</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Manage Billing
            </button>
          </div>
        </div>
      </div>

      <div className="#1a1a1a rounded-lg border #2a2a2a p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
        <div className="flex items-center justify-between p-4 border #2a2a2a rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">•••• •••• •••• 4242</h4>
              <p className="text-sm text-gray-400">Expires 12/25</p>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Update
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'integrations':
        return renderIntegrationsSection();
      case 'data':
        return renderDataSection();
      case 'billing':
        return renderBillingSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>
        <button className="text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors" style={{ backgroundColor: '#2a2a2a' }} onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3a3a3a'} onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a'}>
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-300'
                  }`}
                  style={{
                    backgroundColor: isActive ? '#2a2a2a' : 'transparent',
                    borderColor: isActive ? '#3a3a3a' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a';
                      (e.target as HTMLButtonElement).style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                      (e.target as HTMLButtonElement).style.color = '#d1d5db';
                    }
                  }}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`} />
                  <div className="text-left">
                    <div className="text-sm font-medium">{section.title}</div>
                    <div className="text-xs text-gray-400">{section.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
