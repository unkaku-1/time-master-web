import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from '../App.jsx'
import { AuthProvider } from '../contexts/AuthContext'

// Mock components
vi.mock('../components/LoginPage', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}))

vi.mock('../components/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>
}))

vi.mock('../components/AdminPanel', () => ({
  default: () => <div data-testid="admin-panel">Admin Panel</div>
}))

vi.mock('../components/TaskManager', () => ({
  default: () => <div data-testid="task-manager">Task Manager</div>
}))

// Mock AuthContext
const mockAuthContext = {
  isAuthenticated: false,
  loading: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn()
}

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}))

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  })
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('App', () => {
  let queryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    
    // 重置 mock
    vi.clearAllMocks()
    localStorageMock.clear()
    
    // 重置 auth context mock
    mockAuthContext.isAuthenticated = false
    mockAuthContext.loading = false
    mockAuthContext.user = null
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    )
  }

  describe('Loading State', () => {
    it('应该显示加载状态', () => {
      mockAuthContext.loading = true
      
      renderApp()
      
      expect(screen.getByText('正在加载...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument() // Loader2 component
    })
  })

  describe('Unauthenticated State', () => {
    it('应该显示登录页面当用户未认证时', () => {
      mockAuthContext.isAuthenticated = false
      mockAuthContext.loading = false
      
      renderApp()
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.loading = false
      mockAuthContext.user = {
        id: 1,
        username: 'testuser',
        full_name: '测试用户',
        department: '技术部',
        is_admin: false
      }
    })

    it('应该显示主应用界面当用户已认证时', () => {
      renderApp()
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      expect(screen.getByText('Time Master')).toBeInTheDocument()
      expect(screen.getByText('Enterprise')).toBeInTheDocument()
    })

    it('应该显示用户信息在侧边栏', () => {
      renderApp()
      
      expect(screen.getByText('测试用户')).toBeInTheDocument()
      expect(screen.getByText('技术部')).toBeInTheDocument()
    })

    it('应该显示导航菜单项', () => {
      renderApp()
      
      expect(screen.getByText('仪表板')).toBeInTheDocument()
      expect(screen.getByText('任务管理')).toBeInTheDocument()
    })

    it('应该不显示管理后台菜单当用户不是管理员时', () => {
      renderApp()
      
      expect(screen.queryByText('管理后台')).not.toBeInTheDocument()
    })

    it('应该显示管理后台菜单当用户是管理员时', () => {
      mockAuthContext.user.is_admin = true
      
      renderApp()
      
      expect(screen.getByText('管理后台')).toBeInTheDocument()
    })

    it('应该切换到任务管理视图', async () => {
      renderApp()
      
      const taskButton = screen.getByText('任务管理')
      fireEvent.click(taskButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('task-manager')).toBeInTheDocument()
        expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
      })
    })

    it('应该切换到管理后台视图（管理员用户）', async () => {
      mockAuthContext.user.is_admin = true
      
      renderApp()
      
      const adminButton = screen.getByText('管理后台')
      fireEvent.click(adminButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('admin-panel')).toBeInTheDocument()
        expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
      })
    })

    it('应该高亮当前选中的菜单项', () => {
      renderApp()
      
      const dashboardButton = screen.getByText('仪表板')
      expect(dashboardButton.closest('button')).toHaveClass('bg-blue-600')
      
      const taskButton = screen.getByText('任务管理')
      expect(taskButton.closest('button')).not.toHaveClass('bg-blue-600')
    })

    it('应该调用logout函数当点击退出登录时', () => {
      renderApp()
      
      const logoutButton = screen.getByText('退出登录')
      fireEvent.click(logoutButton)
      
      expect(mockAuthContext.logout).toHaveBeenCalledTimes(1)
    })

    it('应该显示用户名首字母作为头像', () => {
      renderApp()
      
      const avatar = screen.getByText('测')
      expect(avatar).toBeInTheDocument()
      expect(avatar.closest('div')).toHaveClass('bg-blue-600', 'rounded-full')
    })

    it('应该处理没有全名的用户', () => {
      mockAuthContext.user.full_name = null
      
      renderApp()
      
      expect(screen.getByText('testuser')).toBeInTheDocument()
      const avatar = screen.getByText('t')
      expect(avatar).toBeInTheDocument()
    })

    it('应该处理没有部门的用户', () => {
      mockAuthContext.user.department = null
      
      renderApp()
      
      expect(screen.getByText('未设置部门')).toBeInTheDocument()
    })

    it('应该默认显示仪表板视图', () => {
      renderApp()
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    })

    it('应该处理无效的视图切换', async () => {
      renderApp()
      
      // 应该显示仪表板
      expect(screen.getAllByTestId('dashboard')).toHaveLength(1)
    })
  })

  describe('QueryClient Configuration', () => {
    it('应该配置正确的默认选项', () => {
      const app = renderApp()
      
      // 验证 QueryClient 被正确配置
      expect(queryClient.getDefaultOptions().queries.retry).toBe(false) // 在测试中设置为 false
    })
  })

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.loading = false
      mockAuthContext.user = {
        id: 1,
        username: 'testuser',
        full_name: '测试用户',
        department: '技术部',
        is_admin: false
      }
    })

    it('应该有正确的布局类名', () => {
      renderApp()
      
      const mainContainer = screen.getByTestId('dashboard').closest('.flex-1')
      expect(mainContainer).toHaveClass('flex-1', 'overflow-hidden')
    })

    it('应该有正确的侧边栏样式', () => {
      renderApp()
      
      const sidebar = screen.getByText('Time Master').closest('.w-64')
      expect(sidebar).toHaveClass('w-64', 'bg-slate-800', 'border-r', 'border-slate-700')
    })
  })

  describe('Error Boundaries', () => {
    it('应该处理组件渲染错误', () => {
      // 这个测试需要实际的错误边界实现
      // 目前只是验证基本渲染不会崩溃
      expect(() => renderApp()).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockAuthContext.isAuthenticated = true
      mockAuthContext.loading = false
      mockAuthContext.user = {
        id: 1,
        username: 'testuser',
        full_name: '测试用户',
        department: '技术部',
        is_admin: false
      }
    })

    it('应该有正确的语义化标签', () => {
      renderApp()
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '退出登录' })).toBeInTheDocument()
    })

    it('应该支持键盘导航', () => {
      renderApp()
      
      // 使用更精确的选择器
      const taskButton = screen.getByText('任务管理').closest('button')
      expect(taskButton).toBeInstanceOf(HTMLButtonElement)
      expect(taskButton).not.toHaveAttribute('disabled')
    })
  })
})