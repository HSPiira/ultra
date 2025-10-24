import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook that provides theme-aware styling utilities
 */
export const useThemeStyles = () => {
  const { colors } = useTheme();

  // Common button styles
  const getButtonStyles = (variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' = 'primary') => {
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
          backgroundColor: colors.action.primary,
          color: colors.text.primary,
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = colors.action.primary;
          }
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: colors.background.quaternary,
          color: colors.text.primary,
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = colors.background.hover;
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = colors.background.quaternary;
          }
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: colors.action.danger,
          color: colors.text.primary,
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = colors.action.danger;
          }
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: colors.action.warning,
          color: colors.text.primary,
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = '#d97706';
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = colors.action.warning;
          }
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: colors.action.success,
          color: colors.text.primary,
          onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = '#059669';
          },
          onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            e.currentTarget.style.backgroundColor = colors.action.success;
          }
        };
      default:
        return baseStyles;
    }
  };

  // Common input styles
  const getInputStyles = (hasError = false) => ({
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
    borderColor: hasError ? colors.status.error : colors.border.secondary,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = colors.border.accent;
      e.target.style.boxShadow = `0 0 0 2px ${colors.border.accent}33`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = hasError ? colors.status.error : colors.border.secondary;
      e.target.style.boxShadow = 'none';
    }
  });

  // Common card styles
  const getCardStyles = () => ({
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
  });

  // Common page container styles
  const getPageStyles = () => ({
    backgroundColor: colors.background.primary,
  });

  // Common tab styles
  const getTabStyles = (isActive: boolean) => ({
    borderBottomColor: isActive ? colors.text.tertiary : 'transparent',
    color: isActive ? colors.text.secondary : colors.text.tertiary,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (!isActive) {
        e.currentTarget.style.color = colors.text.secondary;
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      if (!isActive) {
        e.currentTarget.style.color = colors.text.tertiary;
      }
    }
  });

  // Common icon button styles
  const getIconButtonStyles = () => ({
    color: colors.text.tertiary,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = colors.text.primary;
      e.currentTarget.style.backgroundColor = colors.background.quaternary;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = colors.text.tertiary;
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  });

  // Status badge styles
  const getStatusBadgeStyles = (status: 'active' | 'inactive' | 'suspended' | 'warning' | 'error' | 'success' | 'info') => {
    const statusColors = {
      active: { bg: 'bg-green-900', text: 'text-green-300' },
      inactive: { bg: 'bg-red-900', text: 'text-red-300' },
      suspended: { bg: 'bg-amber-900', text: 'text-amber-300' },
      warning: { bg: 'bg-amber-900', text: 'text-amber-300' },
      error: { bg: 'bg-red-900', text: 'text-red-300' },
      success: { bg: 'bg-green-900', text: 'text-green-300' },
      info: { bg: 'bg-blue-900', text: 'text-blue-300' },
    };

    return statusColors[status];
  };

  return {
    colors,
    getButtonStyles,
    getInputStyles,
    getCardStyles,
    getPageStyles,
    getTabStyles,
    getIconButtonStyles,
    getStatusBadgeStyles,
  };
};
