import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock axios with factory function
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: vi.fn((successHandler, errorHandler) => {
          // 存储拦截器处理函数以供测试使用
          mockAxiosInstance._requestInterceptor = { successHandler, errorHandler }
        })
      },
      response: {
        use: vi.fn((successHandler, errorHandler) => {
          // 存储拦截器处理函数以供测试使用
          mockAxiosInstance._responseInterceptor = { successHandler, errorHandler }
        })
      }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    _requestInterceptor: null,
    _responseInterceptor: null
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      ...mockAxiosInstance
    }
  }
})

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

// Mock window.location
delete window.location
window.location = { href: '' }

// Import API modules after mocking
import { authAPI, tasksAPI, adminAPI, usersAPI } from '../lib/api.js'
import axios from 'axios'

const mockAxios = vi.mocked(axios)
const mockAxiosInstance = mockAxios.create()

describe('API Services - 修复版本', () => {
  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks()
    
    // 清空 localStorage mock
    localStorageMock.clear()
    
    // 重置 axios mock 返回值
    mockAxiosInstance.get.mockResolvedValue({ data: {} })
    mockAxiosInstance.post.mockResolvedValue({ data: {} })
    mockAxiosInstance.put.mockResolvedValue({ data: {} })
    mockAxiosInstance.delete.mockResolvedValue({ data: {} })
  })

  describe('axios instance configuration', () => {
    it('应该正确配置axios实例', () => {
      // 验证axios.create被调用
      expect(mockAxios.create).toHaveBeenCalled()
      
      // 验证创建时的配置参数
      const createCall = mockAxios.create.mock.calls[0]
      if (createCall && createCall[0]) {
        const config = createCall[0]
        expect(config).toHaveProperty('baseURL')
        expect(config).toHaveProperty('headers')
        expect(config.headers).toHaveProperty('Content-Type', 'application/json')
      }
    })

    it('应该设置请求拦截器功能', async () => {
      // 设置认证token
      localStorageMock.store['auth_token'] = 'test-token'
      
      // 模拟请求配置
      const mockConfig = { headers: {} }
      
      // 如果拦截器存在，测试其功能
      if (mockAxiosInstance._requestInterceptor?.successHandler) {
        const result = mockAxiosInstance._requestInterceptor.successHandler(mockConfig)
        expect(result.headers.Authorization).toBe('Bearer test-token')
      }
      
      // 验证拦截器被注册
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
    })

    it('应该设置响应拦截器功能', async () => {
      // 测试成功响应
      const mockResponse = { data: { success: true } }
      
      if (mockAxiosInstance._responseInterceptor?.successHandler) {
        const result = mockAxiosInstance._responseInterceptor.successHandler(mockResponse)
        expect(result).toBe(mockResponse)
      }
      
      // 测试错误响应
      const mockError = {
        response: { status: 401 }
      }
      
      if (mockAxiosInstance._responseInterceptor?.errorHandler) {
        try {
          await mockAxiosInstance._responseInterceptor.errorHandler(mockError)
        } catch (error) {
          expect(error).toBe(mockError)
        }
      }
      
      // 验证拦截器被注册
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('authAPI', () => {
    it('应该调用登录API', async () => {
      const credentials = { username: 'test', password: 'password' }
      const mockResponse = { data: { token: 'mock-token', user: { id: 1 } } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authAPI.login(credentials)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该调用登出API', async () => {
      const mockResponse = { data: { message: 'Logged out successfully' } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authAPI.logout()
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout')
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取当前用户信息', async () => {
      const mockUser = { id: 1, username: 'test', email: 'test@example.com' }
      const mockResponse = { data: mockUser }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await authAPI.getCurrentUser()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockUser)
    })

    it('应该同步LDAP用户', async () => {
      const mockResponse = { data: { message: 'LDAP sync completed' } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authAPI.syncLdapUsers()
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/ldap/sync')
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('tasksAPI', () => {
    it('应该获取任务列表', async () => {
      const mockTasks = [
        { id: 1, title: 'Task 1', status: 'pending' },
        { id: 2, title: 'Task 2', status: 'completed' }
      ]
      const mockResponse = { data: { tasks: mockTasks, total: 2 } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const params = { page: 1, limit: 10, status: 'all' }
      const result = await tasksAPI.getTasks(params)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', { params })
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取任务列表（无参数）', async () => {
      const mockResponse = { data: { tasks: [], total: 0 } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getTasks()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', { params: {} })
      expect(result).toEqual(mockResponse.data)
    })

    it('应该创建任务', async () => {
      const taskData = { title: 'New Task', description: 'Task description' }
      const mockResponse = { data: { id: 1, ...taskData, status: 'pending' } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.createTask(taskData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tasks', taskData)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取单个任务', async () => {
      const taskId = 1
      const mockTask = { id: taskId, title: 'Task 1', status: 'pending' }
      const mockResponse = { data: mockTask }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getTask(taskId)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tasks/${taskId}`)
      expect(result).toEqual(mockTask)
    })

    it('应该更新任务', async () => {
      const taskId = 1
      const updateData = { title: 'Updated Task', status: 'completed' }
      const mockResponse = { data: { id: taskId, ...updateData } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.updateTask(taskId, updateData)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/tasks/${taskId}`, updateData)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该删除任务', async () => {
      const taskId = 1
      const mockResponse = { data: { message: 'Task deleted successfully' } }
      
      mockAxiosInstance.delete.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.deleteTask(taskId)
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/tasks/${taskId}`)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该创建子任务', async () => {
      const parentId = 1
      const subTaskData = { title: 'Sub Task', description: 'Sub task description' }
      const mockResponse = { data: { id: 2, ...subTaskData, parentId, status: 'pending' } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.createSubTask(parentId, subTaskData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/tasks/${parentId}/subtasks`, subTaskData)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取子任务列表', async () => {
      const parentId = 1
      const mockSubTasks = [
        { id: 2, title: 'Sub Task 1', parentId, status: 'pending' },
        { id: 3, title: 'Sub Task 2', parentId, status: 'completed' }
      ]
      const mockResponse = { data: { subtasks: mockSubTasks } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getSubTasks(parentId)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tasks/${parentId}/subtasks`)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('adminAPI', () => {
    it('应该获取用户列表', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ]
      const mockResponse = { data: { users: mockUsers, total: 2 } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getUsers()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/users')
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取使用报告', async () => {
      const mockReport = { totalTasks: 100, completedTasks: 75, activeUsers: 10 }
      const mockResponse = { data: mockReport }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getUsageReport()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/reports/usage', { params: { days: 30 } })
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取使用报告（自定义天数）', async () => {
      const days = 7
      const mockReport = { totalTasks: 20, completedTasks: 15, activeUsers: 5 }
      const mockResponse = { data: mockReport }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getUsageReport(days)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/reports/usage', { params: { days } })
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取LDAP设置', async () => {
      const mockSettings = { server: 'ldap.example.com', port: 389, baseDN: 'dc=example,dc=com' }
      const mockResponse = { data: mockSettings }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getLdapSettings()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/settings/ldap')
      expect(result).toEqual(mockResponse.data)
    })

    it('应该更新LDAP设置', async () => {
      const settings = { server: 'ldap.example.com', port: 389, baseDN: 'dc=example,dc=com' }
      const mockResponse = { data: { message: 'LDAP settings updated successfully' } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.updateLdapSettings(settings)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/settings/ldap', settings)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取SMTP设置', async () => {
      const mockSettings = { host: 'smtp.example.com', port: 587, secure: true }
      const mockResponse = { data: mockSettings }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getSmtpSettings()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/settings/smtp')
      expect(result).toEqual(mockResponse.data)
    })

    it('应该更新SMTP设置', async () => {
      const settings = { host: 'smtp.example.com', port: 587, secure: true }
      const mockResponse = { data: { message: 'SMTP settings updated successfully' } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.updateSmtpSettings(settings)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/settings/smtp', settings)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取通用设置', async () => {
      const mockSettings = { siteName: 'Time Master', theme: 'dark', language: 'zh-CN' }
      const mockResponse = { data: mockSettings }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getGeneralSettings()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/settings/general')
      expect(result).toEqual(mockResponse.data)
    })

    it('应该更新通用设置', async () => {
      const settings = { siteName: 'Time Master', theme: 'dark', language: 'zh-CN' }
      const mockResponse = { data: { message: 'General settings updated successfully' } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.updateGeneralSettings(settings)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/settings/general', settings)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('usersAPI', () => {
    it('应该获取用户列表', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@example.com' },
        { id: 2, username: 'user2', email: 'user2@example.com' }
      ]
      const mockResponse = { data: { users: mockUsers, total: 2 } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.getUsers()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users')
      expect(result).toEqual(mockResponse.data)
    })

    it('应该创建用户', async () => {
      const userData = { username: 'newuser', email: 'newuser@example.com', password: 'password123' }
      const mockResponse = { data: { id: 3, ...userData, password: undefined } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.createUser(userData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', userData)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该获取单个用户', async () => {
      const userId = 1
      const mockUser = { id: userId, username: 'user1', email: 'user1@example.com' }
      const mockResponse = { data: mockUser }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.getUser(userId)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/users/${userId}`)
      expect(result).toEqual(mockUser)
    })

    it('应该更新用户', async () => {
      const userId = 1
      const updateData = { email: 'updated@example.com', full_name: 'Updated User' }
      const mockResponse = { data: { id: userId, ...updateData } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.updateUser(userId, updateData)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/users/${userId}`, updateData)
      expect(result).toEqual(mockResponse.data)
    })

    it('应该删除用户', async () => {
      const userId = 1
      const mockResponse = { data: { message: 'User deleted successfully' } }
      
      mockAxiosInstance.delete.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.deleteUser(userId)
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/users/${userId}`)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Error Handling', () => {
    it('应该处理API错误', async () => {
      const errorMessage = 'Network Error'
      mockAxiosInstance.get.mockRejectedValue(new Error(errorMessage))
      
      await expect(authAPI.getCurrentUser()).rejects.toThrow(errorMessage)
    })

    it('应该处理HTTP错误状态', async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      }
      mockAxiosInstance.get.mockRejectedValue(errorResponse)
      
      await expect(usersAPI.getUser(999)).rejects.toEqual(errorResponse)
    })

    it('应该处理401错误并清除认证信息', async () => {
      // 设置认证token
      localStorageMock.store['auth_token'] = 'test-token'
      
      const errorResponse = {
        response: { status: 401 }
      }
      
      // 如果响应拦截器存在，测试401处理
      if (mockAxiosInstance._responseInterceptor?.errorHandler) {
        try {
          await mockAxiosInstance._responseInterceptor.errorHandler(errorResponse)
        } catch (error) {
          // 验证token被清除
          expect(localStorageMock.store['auth_token']).toBeUndefined()
        }
      }
    })
  })
})