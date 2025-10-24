import React from 'react';

export interface StatusColorProps {
  status: string;
  isStatusField?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function StatusColor({ 
  status, 
  isStatusField = false, 
  className = '',
  children 
}: StatusColorProps) {
  const getTextColor = (status: string, isStatusField: boolean = false): string => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'active') {
      // For Active status, only the status field should be green
      return isStatusField ? 'text-green-500' : 'text-white';
    }
    
    if (normalizedStatus === 'red') {
      return 'text-red-500';
    }
    
    if (normalizedStatus === 'suspended') {
      return 'text-amber-500';
    }
    
    // For other statuses, try to use the status name as a CSS color
    // If it's a valid CSS color name, use it; otherwise, default to white
    const validColors = [
      'blue', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'gray'
    ];
    
    if (validColors.includes(normalizedStatus)) {
      return `text-${normalizedStatus}-500`;
    }
    
    // Default to white for unknown statuses
    return 'text-white';
  };

  const colorClass = getTextColor(status, isStatusField);

  return (
    <span className={`${colorClass} ${className}`}>
      {children || status}
    </span>
  );
}

// Helper function to get text color based on status (for use in other components)
export const getStatusTextColor = (status: string, isStatusField: boolean = false): string => {
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus === 'active') {
    return isStatusField ? 'text-green-500' : 'text-white';
  }
  
  if (normalizedStatus === 'red') {
    return 'text-red-500';
  }
  
  if (normalizedStatus === 'suspended') {
    return 'text-amber-500';
  }
  
  const validColors = [
    'blue', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'lime', 'yellow', 'orange', 'gray'
  ];
  
  if (validColors.includes(normalizedStatus)) {
    return `text-${normalizedStatus}-500`;
  }
  
  return 'text-white';
};
