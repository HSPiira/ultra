import React from 'react';
import { useThemeStyles } from '../../hooks';

const Dashboard: React.FC = () => {
  const { colors, getCardStyles } = useThemeStyles();
  
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: colors.text.primary }}>Dashboard</h1>
        <p className="mt-2" style={{ color: colors.text.tertiary }}>
          Welcome to your insurance management dashboard
        </p>
      </div>
      
      {/* Responsive Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-lg p-4 sm:p-6 shadow-sm border" style={getCardStyles()}>
          <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Quick Stats</h3>
          <p className="text-sm sm:text-base" style={{ color: colors.text.tertiary }}>Your dashboard content goes here</p>
        </div>
        <div className="rounded-lg p-4 sm:p-6 shadow-sm border" style={getCardStyles()}>
          <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Recent Activity</h3>
          <p className="text-sm sm:text-base" style={{ color: colors.text.tertiary }}>Recent activity will be displayed here</p>
        </div>
        <div className="rounded-lg p-4 sm:p-6 shadow-sm border" style={getCardStyles()}>
          <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Notifications</h3>
          <p className="text-sm sm:text-base" style={{ color: colors.text.tertiary }}>Important notifications appear here</p>
        </div>
        <div className="rounded-lg p-4 sm:p-6 shadow-sm border sm:col-span-2 lg:col-span-1" style={getCardStyles()}>
          <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>Responsive Demo</h3>
          <p className="text-sm sm:text-base" style={{ color: colors.text.tertiary }}>This layout adapts to different screen sizes</p>
        </div>
      </div>
      
      {/* Responsive Text Demo */}
      <div className="mt-8 p-4 sm:p-6 rounded-lg border" style={getCardStyles()}>
        <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: colors.text.primary }}>Responsive Design Demo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>📱</div>
            <h3 className="text-sm sm:text-base font-semibold mb-1" style={{ color: colors.text.primary }}>Mobile</h3>
            <p className="text-xs sm:text-sm" style={{ color: colors.text.tertiary }}>Single column layout</p>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>📱</div>
            <h3 className="text-sm sm:text-base font-semibold mb-1" style={{ color: colors.text.primary }}>Tablet</h3>
            <p className="text-xs sm:text-sm" style={{ color: colors.text.tertiary }}>Two column layout</p>
          </div>
          <div className="text-center sm:col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: colors.text.primary }}>💻</div>
            <h3 className="text-sm sm:text-base font-semibold mb-1" style={{ color: colors.text.primary }}>Desktop</h3>
            <p className="text-xs sm:text-sm" style={{ color: colors.text.tertiary }}>Multi-column layout</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
