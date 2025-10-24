import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Welcome to your insurance management dashboard
        </p>
      </div>
      
      {/* Responsive Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-lg p-4 sm:p-6 shadow-sm" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Quick Stats</h3>
          <p className="text-sm sm:text-base text-gray-400">Your dashboard content goes here</p>
        </div>
        <div className="rounded-lg p-4 sm:p-6 shadow-sm" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Recent Activity</h3>
          <p className="text-sm sm:text-base text-gray-400">Recent activity will be displayed here</p>
        </div>
        <div className="rounded-lg p-4 sm:p-6 shadow-sm" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Notifications</h3>
          <p className="text-sm sm:text-base text-gray-400">Important notifications appear here</p>
        </div>
        <div className="rounded-lg p-4 sm:p-6 shadow-sm sm:col-span-2 lg:col-span-1" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Responsive Demo</h3>
          <p className="text-sm sm:text-base text-gray-400">This layout adapts to different screen sizes</p>
        </div>
      </div>
      
      {/* Responsive Text Demo */}
      <div className="mt-8 p-4 sm:p-6 rounded-lg" style={{ backgroundColor: '#1a1a1a', borderColor: '#2a2a2a' }}>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Responsive Design Demo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">📱</div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Mobile</h3>
            <p className="text-xs sm:text-sm text-gray-400">Single column layout</p>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">📱</div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Tablet</h3>
            <p className="text-xs sm:text-sm text-gray-400">Two column layout</p>
          </div>
          <div className="text-center sm:col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-2">💻</div>
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1">Desktop</h3>
            <p className="text-xs sm:text-sm text-gray-400">Multi-column layout</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
