import React, { useState, useRef, useEffect } from 'react';
import { useThemeStyles } from '../../hooks';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500,
  className = ''
}) => {
  const { colors } = useThemeStyles();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;
    let newPosition = position;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        
        // If tooltip goes above viewport, switch to bottom
        if (top < scrollY) {
          newPosition = 'bottom';
          top = triggerRect.bottom + scrollY + 8;
        }
        break;

      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
        
        // If tooltip goes below viewport, switch to top
        if (top + tooltipRect.height > scrollY + viewportHeight) {
          newPosition = 'top';
          top = triggerRect.top + scrollY - tooltipRect.height - 8;
        }
        break;

      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        
        // If tooltip goes left of viewport, switch to right
        if (left < scrollX) {
          newPosition = 'right';
          left = triggerRect.right + scrollX + 8;
        }
        break;

      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollX + 8;
        
        // If tooltip goes right of viewport, switch to left
        if (left + tooltipRect.width > scrollX + viewportWidth) {
          newPosition = 'left';
          left = triggerRect.left + scrollX - tooltipRect.width - 8;
        }
        break;
    }

    // Ensure tooltip stays within viewport bounds
    if (left < scrollX) {
      left = scrollX + 8;
    } else if (left + tooltipRect.width > scrollX + viewportWidth) {
      left = scrollX + viewportWidth - tooltipRect.width - 8;
    }

    if (top < scrollY) {
      top = scrollY + 8;
    } else if (top + tooltipRect.height > scrollY + viewportHeight) {
      top = scrollY + viewportHeight - tooltipRect.height - 8;
    }

    setTooltipPosition({ top, left });
    setActualPosition(newPosition);
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
      // Calculate position after a brief delay to ensure tooltip is rendered
      window.setTimeout(calculatePosition, 10);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 transform rotate-45';
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} -top-1 left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseClasses} -right-1 top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseClasses} -left-1 top-1/2 -translate-y-1/2`;
      default:
        return baseClasses;
    }
  };

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none ${className}`}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            backgroundColor: colors.background.tertiary,
            border: `1px solid ${colors.border.secondary}`,
            color: colors.text.primary,
            maxWidth: '300px',
            wordWrap: 'break-word'
          }}
        >
          {content}
          <div
            className={getArrowClasses()}
            style={{
              backgroundColor: colors.background.tertiary,
              border: `1px solid ${colors.border.secondary}`
            }}
          />
        </div>
      )}
    </div>
  );
};
