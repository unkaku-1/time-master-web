import { vi } from 'vitest'
import { Task } from '../lib/taskModel.js'

/**
 * 标准化测试工具集
 * 提供统一的Mock配置、数据工厂和测试基类
 */

// ============ Mock配置工具 ============

/**
 * 创建标准化的axios mock
 */
export const createMockAxios = () => {
  const mockAxiosInstance = {
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
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      ...mockAxiosInstance
    },
    instance: mockAxiosInstance
  }
}

/**
 * 创建标准化的localStorage mock
 */
export const createMockLocalStorage = () => {
  const store = {}
  
  return {
    store,
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// ============ 数据工厂 ============

/**
 * 任务数据工厂
 */
export const TaskFactory = {
  /**
   * 创建单个任务
   */
  build: (overrides = {}) => {
    const defaultData = {
      title: 'Test Task',
      description: 'Test Description',
      importance: 2,
      urgency: 2,
      status: 'pending'
    }
    
    return new Task({ ...defaultData, ...overrides })
  },

  /**
   * 创建任务列表
   */
  buildList: (count, overrides = {}) => {
    return Array.from({ length: count }, (_, index) => 
      TaskFactory.build({ 
        title: `Test Task ${index + 1}`,
        ...overrides 
      })
    )
  },

  /**
   * 创建JSON格式的任务数据
   */
  buildJSON: (overrides = {}) => {
    return TaskFactory.build(overrides).toJSON()
  },

  /**
   * 创建JSON格式的任务列表
   */
  buildJSONList: (count, overrides = {}) => {
    return TaskFactory.buildList(count, overrides).map(task => task.toJSON())
  }
}

/**
 * 设置数据工厂
 */
export const SettingsFactory = {
  /**
   * 创建默认设置
   */
  build: (overrides = {}) => {
    const defaultSettings = {
      theme: 'dark',
      language: 'zh-CN',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true
      },
      sorting: {
        defaultSort: 'priority',
        groupByStatus: false,
        prioritizeOverdue: true
      },
      display: {
        showSubTasks: true,
        compactMode: false,
        showProgress: true
      }
    }
    
    return { ...defaultSettings, ...overrides }
  }
}

// ============ 测试基类 ============

/**
 * 基础测试类
 * 提供通用的测试设置和清理方法
 */
export class BaseTest {
  constructor() {
    this.mockLocalStorage = createMockLocalStorage()
    this.setupGlobalMocks()
  }

  /**
   * 设置全局Mock
   */
  setupGlobalMocks() {
    // 设置localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: this.mockLocalStorage,
      configurable: true
    })
  }

  /**
   * 测试前的清理工作
   */
  beforeEach() {
    this.clearStorage()
    this.resetMocks()
  }

  /**
   * 清理localStorage
   */
  clearStorage() {
    this.mockLocalStorage.clear()
  }

  /**
   * 重置所有Mock
   */
  resetMocks() {
    vi.clearAllMocks()
  }

  /**
   * 测试后的清理工作
   */
  afterEach() {
    this.clearStorage()
  }
}

// ============ 测试辅助函数 ============

/**
 * 等待异步操作完成
 */
export const waitFor = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 创建测试用的Promise
 */
export const createTestPromise = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  
  return { promise, resolve, reject }
}

/**
 * 模拟异步错误
 */
export const mockAsyncError = (message = 'Test Error') => {
  return Promise.reject(new Error(message))
}

/**
 * 验证Mock调用
 */
export const expectMockCall = (mockFn, callIndex = 0) => {
  return {
    toHaveBeenCalledWith: (...args) => {
      expect(mockFn).toHaveBeenCalled()
      expect(mockFn.mock.calls[callIndex]).toEqual(args)
    },
    toHaveBeenCalledTimes: (times) => {
      expect(mockFn).toHaveBeenCalledTimes(times)
    }
  }
}

// ============ 存储测试工具 ============

/**
 * 存储服务测试工具
 */
export const StorageTestUtils = {
  /**
   * 设置localStorage中的任务数据
   */
  setTasks: (tasks, storageKeys) => {
    const tasksData = Array.isArray(tasks) ? tasks : [tasks]
    const jsonData = tasksData.map(task => 
      task instanceof Task ? task.toJSON() : task
    )
    localStorage.setItem(storageKeys.TASKS, JSON.stringify(jsonData))
  },

  /**
   * 设置localStorage中的设置数据
   */
  setSettings: (settings, storageKeys) => {
    localStorage.setItem(storageKeys.SETTINGS, JSON.stringify(settings))
  },

  /**
   * 获取localStorage中的任务数据
   */
  getTasks: (storageKeys) => {
    const data = localStorage.getItem(storageKeys.TASKS)
    return data ? JSON.parse(data) : []
  },

  /**
   * 获取localStorage中的设置数据
   */
  getSettings: (storageKeys) => {
    const data = localStorage.getItem(storageKeys.SETTINGS)
    return data ? JSON.parse(data) : null
  }
}

// ============ API测试工具 ============

/**
 * API测试工具
 */
export const APITestUtils = {
  /**
   * 创建标准的API响应
   */
  createResponse: (data, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  }),

  /**
   * 创建API错误响应
   */
  createErrorResponse: (message = 'API Error', status = 500) => ({
    response: {
      status,
      statusText: 'Internal Server Error',
      data: { message }
    }
  }),

  /**
   * 设置Mock axios响应
   */
  setupMockResponses: (mockAxios, responses) => {
    Object.entries(responses).forEach(([method, response]) => {
      if (mockAxios[method]) {
        mockAxios[method].mockResolvedValue(response)
      }
    })
  }
}

export default {
  createMockAxios,
  createMockLocalStorage,
  TaskFactory,
  SettingsFactory,
  BaseTest,
  waitFor,
  createTestPromise,
  mockAsyncError,
  expectMockCall,
  StorageTestUtils,
  APITestUtils
}