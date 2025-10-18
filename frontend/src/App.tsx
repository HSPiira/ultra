import { useState } from 'react'
import { Header } from './components/common/Header'
import Sidebar from './components/common/SideBar'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view)
  }

  return (
    <div className="flex h-screen bg-slate-50">
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
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 capitalize">
                {currentView.replace('-', ' ')}
              </h1>
              <p className="text-slate-600 mt-2">
                Welcome to your {currentView} dashboard
              </p>
            </div>
            
            {/* Content placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Quick Stats</h3>
                <p className="text-slate-600">Your dashboard content goes here</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Recent Activity</h3>
                <p className="text-slate-600">Recent activity will be displayed here</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Notifications</h3>
                <p className="text-slate-600">Important notifications appear here</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
