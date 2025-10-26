import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      hover: string;
      selected: string;
    };
    border: {
      primary: string;
      secondary: string;
      accent: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
    };
    status: {
      active: string;
      inactive: string;
      suspended: string;
      warning: string;
      error: string;
      success: string;
      info: string;
    };
    action: {
      primary: string;
      secondary: string;
      danger: string;
      warning: string;
      success: string;
    };
    relationship: {
      self: string;
      spouse: string;
      child: string;
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Theme-aware colors
  const colors = {
    light: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        quaternary: '#e2e8f0',
        hover: '#f1f5f9',
        selected: '#e2e8f0',
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
        accent: '#3b82f6',
      },
      text: {
        primary: '#1e293b',
        secondary: '#475569',
        tertiary: '#64748b',
        quaternary: '#94a3b8',
      },
      status: {
        active: '#10b981',
        inactive: '#ef4444',
        suspended: '#f59e0b',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#10b981',
        info: '#3b82f6',
      },
      action: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      relationship: {
        self: '#3b82f6',
        spouse: '#ec4899',
        child: '#10b981',
      },
    },
    dark: {
      background: {
        primary: '#1a1a1a',
        secondary: '#2a2a2a',
        tertiary: '#1f1f1f',
        quaternary: '#3b3b3b',
        hover: '#4a4a4a',
        selected: '#2E3333',
      },
      border: {
        primary: '#4a4a4a',
        secondary: '#404040',
        accent: '#66D9EF',
      },
      text: {
        primary: '#ffffff',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
        quaternary: '#6b7280',
      },
      status: {
        active: '#10b981',
        inactive: '#ef4444',
        suspended: '#f59e0b',
        warning: '#f59e0b',
        error: '#ef4444',
        success: '#10b981',
        info: '#3b82f6',
      },
      action: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      relationship: {
        self: '#3b82f6',
        spouse: '#ec4899',
        child: '#10b981',
      },
    },
  };

  const currentColors = colors[theme];

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update CSS custom properties for theme
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', currentColors.background.primary);
    root.style.setProperty('--bg-secondary', currentColors.background.secondary);
    root.style.setProperty('--bg-tertiary', currentColors.background.tertiary);
    root.style.setProperty('--bg-quaternary', currentColors.background.quaternary);
    root.style.setProperty('--bg-hover', currentColors.background.hover);
    root.style.setProperty('--bg-selected', currentColors.background.selected);
    root.style.setProperty('--text-primary', currentColors.text.primary);
    root.style.setProperty('--text-secondary', currentColors.text.secondary);
    root.style.setProperty('--text-tertiary', currentColors.text.tertiary);
    root.style.setProperty('--text-quaternary', currentColors.text.quaternary);
    root.style.setProperty('--border-primary', currentColors.border.primary);
    root.style.setProperty('--border-secondary', currentColors.border.secondary);
    root.style.setProperty('--border-accent', currentColors.border.accent);
  }, [theme, currentColors]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: currentColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
