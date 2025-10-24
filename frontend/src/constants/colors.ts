// Color constants for consistent theming across the application
// NOTE: This file is deprecated. Use the useTheme hook from ThemeContext instead.

export const COLORS = {
  // Background colors
  background: {
    primary: '#1a1a1a',      // Main page background
    secondary: '#2a2a2a',    // Header/tab background
    tertiary: '#1f1f1f',     // Card/modal background
    quaternary: '#3b3b3b',   // Button/input background
    hover: '#4a4a4a',        // Hover states
    selected: '#2E3333',     // Selected states
  },
  
  // Border colors
  border: {
    primary: '#4a4a4a',      // Main borders
    secondary: '#404040',    // Subtle borders
    accent: '#66D9EF',       // Accent borders (blue)
  },
  
  // Text colors
  text: {
    primary: '#ffffff',      // Main text
    secondary: '#d1d5db',    // Secondary text
    tertiary: '#9ca3af',     // Muted text
    quaternary: '#6b7280',   // Very muted text
  },
  
  // Status colors
  status: {
    active: '#10b981',       // Green for active
    inactive: '#ef4444',     // Red for inactive
    suspended: '#f59e0b',    // Amber for suspended
    warning: '#f59e0b',      // Warning
    error: '#ef4444',        // Error
    success: '#10b981',      // Success
    info: '#3b82f6',         // Info
  },
  
  // Action colors
  action: {
    primary: '#3b82f6',      // Primary actions (blue)
    secondary: '#6b7280',    // Secondary actions (gray)
    danger: '#ef4444',       // Dangerous actions (red)
    warning: '#f59e0b',      // Warning actions (amber)
    success: '#10b981',      // Success actions (green)
  },
  
  // Relationship colors
  relationship: {
    self: '#3b82f6',         // Blue for self
    spouse: '#ec4899',       // Pink for spouse
    child: '#10b981',        // Green for child
  }
} as const;

// Helper function to get background color with hover states
export const getBackgroundColor = (base: string, hover?: string) => ({
  backgroundColor: base,
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    if (hover) e.currentTarget.style.backgroundColor = hover;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = base;
  }
});

// Helper function to get button styles
export const getButtonStyles = (variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' = 'primary') => {
  const baseStyles = {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  switch (variant) {
    case 'primary':
      return {
        ...baseStyles,
        backgroundColor: COLORS.action.primary,
        color: COLORS.text.primary,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = COLORS.action.primary;
        }
      };
    case 'secondary':
      return {
        ...baseStyles,
        backgroundColor: COLORS.background.quaternary,
        color: COLORS.text.primary,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = COLORS.background.hover;
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = COLORS.background.quaternary;
        }
      };
    case 'danger':
      return {
        ...baseStyles,
        backgroundColor: COLORS.action.danger,
        color: COLORS.text.primary,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = '#dc2626';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = COLORS.action.danger;
        }
      };
    case 'warning':
      return {
        ...baseStyles,
        backgroundColor: COLORS.action.warning,
        color: COLORS.text.primary,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = '#d97706';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = COLORS.action.warning;
        }
      };
    case 'success':
      return {
        ...baseStyles,
        backgroundColor: COLORS.action.success,
        color: COLORS.text.primary,
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = '#059669';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          e.currentTarget.style.backgroundColor = COLORS.action.success;
        }
      };
    default:
      return baseStyles;
  }
};
