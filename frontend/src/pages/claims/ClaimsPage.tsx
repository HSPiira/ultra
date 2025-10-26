import React from 'react';
import { useThemeStyles } from '../../hooks';

const ClaimsPage: React.FC = () => {
  const { colors, getCardStyles } = useThemeStyles();
  
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>Claims</h1>
        <p className="mt-2" style={{ color: colors.text.tertiary }}>
          Manage insurance claims
        </p>
      </div>
      <div className="rounded-lg p-6 shadow-sm border" style={getCardStyles()}>
        <p style={{ color: colors.text.tertiary }}>Claims management interface will be implemented here</p>
      </div>
    </>
  );
};

export default ClaimsPage;
