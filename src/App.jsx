import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import TaskManager from './components/TaskManager';
import { Loader2 } from 'lucide-react';


// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main App Content Component
const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" role="status" aria-label="Loading" />
          <p className="text-slate-300" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            正在加载...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Main application layout
  return (
    <div className="min-h-screen bg-slate-900">
      <MainLayout user={user} />
    </div>
  );
};

// Main Layout Component
const MainLayout = ({ user }) => {
  const [currentView, setCurrentView] = React.useState('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskManager />;
      case 'admin':
        return user?.is_admin ? <AdminPanel /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        user={user} 
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ currentView, setCurrentView, user }) => {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: '仪表板', icon: '📊' },
    { id: 'tasks', label: '任务管理', icon: '📋' },
  ];

  if (user?.is_admin) {
    menuItems.push({ id: 'admin', label: '管理后台', icon: '⚙️' });
  }

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Time Master" className="h-8 w-auto" />
          <div>
            <h1 className="text-white font-bold text-lg" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
              Time Master
            </h1>
            <p className="text-slate-400 text-sm" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              Enterprise
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              {user?.full_name || user?.username}
            </p>
            <p className="text-slate-300 text-xs truncate" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              {user?.department || '未设置部门'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
};

// Root App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* 隐藏的主题类哨兵节点 - 确保 Tailwind 在生产构建中保留这些工具类 */}
        <div className="hidden bg-background text-foreground border-border ring-ring" aria-hidden="true" />
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

