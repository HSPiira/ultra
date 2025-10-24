import { Bell, Search, User, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="border-b flex items-center justify-between px-2 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-sm" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', height: '60px' }}>
      {/* Left section with menu toggle and search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a'}
          onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search claims, companies, members..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white transition-all duration-200"
              style={{ 
                backgroundColor: '#2a2a2a', 
                borderColor: '#3a3a3a',
                outline: 'none'
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#4a4a4a';
                (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px #4a4a4a';
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = '#3a3a3a';
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Right section with notifications and user menu */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Mobile search button */}
        <button
          className="sm:hidden p-2 rounded-lg transition-colors text-gray-300"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a';
            (e.target as HTMLButtonElement).style.color = 'white';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.target as HTMLButtonElement).style.color = '#d1d5db';
          }}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
        {/* Notifications */}
        <button
          className="relative p-2 sm:p-2.5 rounded-lg transition-colors text-gray-300"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a';
            (e.target as HTMLButtonElement).style.color = 'white';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.target as HTMLButtonElement).style.color = '#d1d5db';
          }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 sm:gap-3 p-1 sm:p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4a4a4a' }}>
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">Piira</p>
              <p className="text-xs text-gray-400">sekiboh@gmail.com</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg py-2 z-50" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
                <p className="text-sm font-medium text-white">Piira</p>
                <p className="text-xs text-gray-400">sekiboh@gmail.com</p>
              </div>
              <div className="py-1">
                <button 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <hr className="my-1" style={{ borderColor: '#2a2a2a' }} />
                <button 
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2a1a1a'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}