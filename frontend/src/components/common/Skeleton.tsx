import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = false,
  variant = 'rectangular',
}) => {
  const { colors } = useTheme();

  const getBaseStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      backgroundColor: colors.background.quaternary,
      animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      display: 'inline-block',
    };

    // Set dimensions
    if (width) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    // Handle variants
    switch (variant) {
      case 'circular':
        baseStyles.borderRadius = '50%';
        if (!width || !height) {
          const size = width || height || '40px';
          baseStyles.width = typeof size === 'number' ? `${size}px` : size;
          baseStyles.height = typeof size === 'number' ? `${size}px` : size;
        }
        break;
      case 'text':
        if (!height) {
          baseStyles.height = '1em';
        }
        baseStyles.borderRadius = '4px';
        if (!width) {
          baseStyles.width = '100%';
        }
        break;
      case 'rectangular':
      default:
        if (rounded) {
          baseStyles.borderRadius = '8px';
        }
        break;
    }

    return baseStyles;
  };

  return (
    <div
      className={className}
      style={getBaseStyles()}
      aria-label="Loading content"
      role="status"
      aria-busy="true"
    />
  );
};
