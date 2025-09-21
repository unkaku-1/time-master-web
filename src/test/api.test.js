import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'

// Mock axios before importing api.js
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn()
        },
        response: {
          use: vi.fn()
        }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

// Now import the API modules
import { authAPI, tasksAPI, adminAPI, usersAPI } from '../lib/api.js'

const mockedAxios = vi.mocked(axios)

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

describe('API Services', () => {
  let mockAxiosInstance

  beforeEach(() => {
    // 创建 axios 实例的 mock
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        },
        response: {
          use: vi.fn()
        }
      }
    }

    mockedAxios.create.mockReturnValue(mockAxiosInstance)
    
    // 清空 localStorage mock
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('axios instance configuration', () => {
    it('应该使用正确的基础URL创建axios实例', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('应该设置请求和响应拦截器', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled()
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled()
    })
  })

  describe('authAPI', () => {
    it('应该调用登录API', async () => {
      const credentials = { username: 'test', password: 'password' }
      const mockResponse = { data: { token: 'test-token' } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authAPI.login(credentials)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(result).toBe(mockResponse)
    })

    it('应该调用登出API', async () => {
      const mockResponse = { data: { message: 'Logged out' } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authAPI.logout()
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout')
      expect(result).toBe(mockResponse)
    })

    it('应该获取当前用户信息', async () => {
      const mockResponse = { data: { id: 1, username: 'test' } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await authAPI.getCurrentUser()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toBe(mockResponse)
    })

    it('应该同步LDAP用户', async () => {
      const mockResponse = { data: { synced: 10 } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await authAPI.syncLdapUsers()
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/sync-ldap')
      expect(result).toBe(mockResponse)
    })
  })

  describe('tasksAPI', () => {
    it('应该获取任务列表', async () => {
      const mockResponse = { data: [{ id: 1, title: 'Test Task' }] }
      const params = { status: 'pending' }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getTasks(params)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', { params })
      expect(result).toBe(mockResponse)
    })

    it('应该获取任务列表（无参数）', async () => {
      const mockResponse = { data: [] }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getTasks()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', { params: {} })
      expect(result).toBe(mockResponse)
    })

    it('应该创建任务', async () => {
      const taskData = { title: 'New Task', importance: 3 }
      const mockResponse = { data: { id: 1, ...taskData } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.createTask(taskData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tasks', taskData)
      expect(result).toBe(mockResponse)
    })

    it('应该获取单个任务', async () => {
      const taskId = '123'
      const mockResponse = { data: { id: taskId, title: 'Test Task' } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getTask(taskId)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tasks/${taskId}`)
      expect(result).toBe(mockResponse)
    })

    it('应该更新任务', async () => {
      const taskId = '123'
      const updateData = { title: 'Updated Task' }
      const mockResponse = { data: { id: taskId, ...updateData } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.updateTask(taskId, updateData)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/tasks/${taskId}`, updateData)
      expect(result).toBe(mockResponse)
    })

    it('应该删除任务', async () => {
      const taskId = '123'
      const mockResponse = { data: { message: 'Task deleted' } }
      
      mockAxiosInstance.delete.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.deleteTask(taskId)
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/tasks/${taskId}`)
      expect(result).toBe(mockResponse)
    })

    it('应该创建子任务', async () => {
      const parentId = '123'
      const subtaskData = { title: 'Subtask' }
      const mockResponse = { data: { id: '456', parentId, ...subtaskData } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.createSubtask(parentId, subtaskData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(`/tasks/${parentId}/subtasks`, subtaskData)
      expect(result).toBe(mockResponse)
    })

    it('应该获取子任务列表', async () => {
      const parentId = '123'
      const mockResponse = { data: [{ id: '456', parentId }] }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await tasksAPI.getSubtasks(parentId)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tasks/${parentId}/subtasks`)
      expect(result).toBe(mockResponse)
    })
  })

  describe('adminAPI', () => {
    it('应该获取用户列表', async () => {
      const mockResponse = { data: [{ id: 1, username: 'admin' }] }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getUsers()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/users')
      expect(result).toBe(mockResponse)
    })

    it('应该获取使用报告', async () => {
      const mockResponse = { data: { totalTasks: 100 } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getUsageReport()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/reports/usage', { params: { days: 30 } })
      expect(result).toBe(mockResponse)
    })

    it('应该获取使用报告（自定义天数）', async () => {
      const days = 7
      const mockResponse = { data: { totalTasks: 20 } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getUsageReport(days)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/reports/usage', { params: { days } })
      expect(result).toBe(mockResponse)
    })

    it('应该获取LDAP设置', async () => {
      const mockResponse = { data: { server: 'ldap.example.com' } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getLdapSettings()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/settings/ldap')
      expect(result).toBe(mockResponse)
    })

    it('应该更新LDAP设置', async () => {
      const settings = { server: 'ldap.example.com', port: 389 }
      const mockResponse = { data: settings }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.updateLdapSettings(settings)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/settings/ldap', settings)
      expect(result).toBe(mockResponse)
    })

    it('应该获取SMTP设置', async () => {
      const mockResponse = { data: { host: 'smtp.example.com' } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getSmtpSettings()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/settings/smtp')
      expect(result).toBe(mockResponse)
    })

    it('应该更新SMTP设置', async () => {
      const settings = { host: 'smtp.example.com', port: 587 }
      const mockResponse = { data: settings }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.updateSmtpSettings(settings)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/settings/smtp', settings)
      expect(result).toBe(mockResponse)
    })

    it('应该获取通用设置', async () => {
      const mockResponse = { data: { appName: 'Time Master' } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.getGeneralSettings()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/settings/general')
      expect(result).toBe(mockResponse)
    })

    it('应该更新通用设置', async () => {
      const settings = { appName: 'Time Master Pro' }
      const mockResponse = { data: settings }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await adminAPI.updateGeneralSettings(settings)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/settings/general', settings)
      expect(result).toBe(mockResponse)
    })
  })

  describe('usersAPI', () => {
    it('应该获取用户列表', async () => {
      const mockResponse = { data: [{ id: 1, username: 'user1' }] }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.getUsers()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users')
      expect(result).toBe(mockResponse)
    })

    it('应该创建用户', async () => {
      const userData = { username: 'newuser', email: 'new@example.com' }
      const mockResponse = { data: { id: 2, ...userData } }
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.createUser(userData)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', userData)
      expect(result).toBe(mockResponse)
    })

    it('应该获取单个用户', async () => {
      const userId = '123'
      const mockResponse = { data: { id: userId, username: 'user1' } }
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.getUser(userId)
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/users/${userId}`)
      expect(result).toBe(mockResponse)
    })

    it('应该更新用户', async () => {
      const userId = '123'
      const updateData = { email: 'updated@example.com' }
      const mockResponse = { data: { id: userId, ...updateData } }
      
      mockAxiosInstance.put.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.updateUser(userId, updateData)
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith(`/users/${userId}`, updateData)
      expect(result).toBe(mockResponse)
    })

    it('应该删除用户', async () => {
      const userId = '123'
      const mockResponse = { data: { message: 'User deleted' } }
      
      mockAxiosInstance.delete.mockResolvedValue(mockResponse)
      
      const result = await usersAPI.deleteUser(userId)
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/users/${userId}`)
      expect(result).toBe(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('应该处理API错误', async () => {
      const error = new Error('Network Error')
      mockAxiosInstance.get.mockRejectedValue(error)
      
      await expect(authAPI.getCurrentUser()).rejects.toThrow('Network Error')
    })

    it('应该处理HTTP错误状态', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        }
      }
      mockAxiosInstance.get.mockRejectedValue(error)
      
      await expect(tasksAPI.getTask('non-existent')).rejects.toEqual(error)
    })
  })
})