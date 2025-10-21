import { useState } from 'react'
import { Header } from './components/common/Header'
import Sidebar from './components/common/SideBar'
import { CompaniesPage } from './pages/companies'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentView, setCurrentView] = useState('overview')

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onToggle={handleSidebarToggle}
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        {/* Header */}
        <Header 
          onMenuToggle={handleSidebarToggle}
          isSidebarOpen={sidebarOpen}
        />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {currentView === 'companies' ? (
              <CompaniesPage />
            ) : currentView === 'claims' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Claims</h1>
                  <p className="text-gray-600 mt-2">
                    Manage insurance claims
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <p className="text-gray-600">Claims management interface will be implemented here</p>
                </div>
              </>
            ) : currentView === 'members' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Members</h1>
                  <p className="text-gray-600 mt-2">
                    Manage member information
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <p className="text-gray-600">Member management interface will be implemented here</p>
                </div>
              </>
            ) : currentView === 'providers' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
                  <p className="text-gray-600 mt-2">
                    Manage healthcare providers
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <p className="text-gray-600">Provider management interface will be implemented here</p>
                </div>
              </>
            ) : currentView === 'medical-catalog' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Medical Catalog</h1>
                  <p className="text-gray-600 mt-2">
                    Manage medical services and items
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <p className="text-gray-600">Medical catalog interface will be implemented here</p>
                </div>
              </>
            ) : currentView === 'schemes' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Schemes</h1>
                  <p className="text-gray-600 mt-2">
                    Manage insurance schemes
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <p className="text-gray-600">Scheme management interface will be implemented here</p>
                </div>
              </>
            ) : currentView === 'overview' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-2">
                    Welcome to your insurance management dashboard
                  </p>
                </div>
                
                {/* Content placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
                    <p className="text-gray-600">Your dashboard content goes here</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
                    <p className="text-gray-600">Recent activity will be displayed here</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
                    <p className="text-gray-600">Important notifications appear here</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 capitalize">
                    {currentView.replace('-', ' ')}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Welcome to your {currentView} dashboard
                  </p>
                </div>
                
                {/* Content placeholder */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
                    <p className="text-gray-600">Your dashboard content goes here</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
                    <p className="text-gray-600">Recent activity will be displayed here</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
                    <p className="text-gray-600">Important notifications appear here</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
