import { Bell, Search, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemeStyles } from '../../hooks';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { colors, getIconButtonStyles } = useThemeStyles();

  return (
    <header 
      className="border-b flex items-center justify-between px-2 sm:px-4 lg:px-6 sticky top-0 z-30 shadow-sm" 
      style={{ 
        backgroundColor: colors.background.secondary, 
        borderColor: colors.border.primary, 
        height: '60px' 
      }}
    >
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
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.text.tertiary }} />
            <input
              type="text"
              placeholder="Search claims, companies, members..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{ 
                backgroundColor: colors.background.tertiary, 
                borderColor: colors.border.secondary,
                color: colors.text.primary,
                outline: 'none'
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = colors.border.accent;
                (e.target as HTMLInputElement).style.boxShadow = `0 0 0 2px ${colors.border.accent}33`;
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = colors.border.secondary;
                (e.target as HTMLInputElement).style.boxShadow = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* Right section with notifications and user menu */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Mobile search button */}
        <Tooltip content="Search claims, companies, members">
          <button
            className="sm:hidden p-2 rounded-lg transition-colors"
            style={getIconButtonStyles()}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </Tooltip>
        {/* Notifications */}
        <Tooltip content="View notifications and alerts">
          <button
            className="relative p-2 sm:p-2.5 rounded-lg transition-colors"
            style={getIconButtonStyles()}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip content={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-lg transition-colors"
            style={getIconButtonStyles()}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
        </Tooltip>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 sm:gap-3 p-1 sm:p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = colors.background.tertiary}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.background.quaternary }}>
              <User className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: colors.text.primary }} />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Piira</p>
              <p className="text-xs" style={{ color: colors.text.tertiary }}>sekiboh@gmail.com</p>
            </div>
            <svg className="w-4 h-4" style={{ color: colors.text.tertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg py-2 z-50 border" style={{ backgroundColor: colors.background.primary, borderColor: colors.border.primary }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: colors.border.primary }}>
                <p className="text-sm font-medium" style={{ color: colors.text.primary }}>Piira</p>
                <p className="text-xs" style={{ color: colors.text.tertiary }}>sekiboh@gmail.com</p>
              </div>
              <div className="py-1">
                <Tooltip content="View and edit your profile">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                    style={{ backgroundColor: 'transparent', color: colors.text.secondary }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = colors.background.tertiary}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                </Tooltip>
                <Tooltip content="Manage application settings">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                    style={{ backgroundColor: 'transparent', color: colors.text.secondary }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = colors.background.tertiary}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </Tooltip>
                <hr className="my-1" style={{ borderColor: colors.border.primary }} />
                <Tooltip content="Sign out of your account">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                    style={{ backgroundColor: 'transparent', color: colors.status.error }}
                    onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = colors.background.tertiary}
                    onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </Tooltip>
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