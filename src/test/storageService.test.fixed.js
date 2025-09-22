import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '../lib/storageService.js'
import { Task } from '../lib/taskModel.js'

describe('StorageService - 修复版本', () => {
  beforeEach(() => {
    // 清理localStorage中的测试数据
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('time_master_')) {
        localStorage.removeItem(key)
      }
    })
  })

  describe('存储键定义', () => {
    it('应该定义正确的存储键', () => {
      expect(StorageService.STORAGE_KEYS.TASKS).toBe('time_master_tasks')
      expect(StorageService.STORAGE_KEYS.SETTINGS).toBe('time_master_settings')
    })
  })

  describe('getAllTasks', () => {
    it('应该返回空数组当没有存储数据时', async () => {
      const tasks = await StorageService.getAllTasks()
      expect(tasks).toEqual([])
    })

    it('应该从localStorage加载任务', async () => {
      // 创建正确格式的测试数据
      const task = new Task({ 
        title: '测试任务',
        description: '测试描述',
        importance: 2,
        urgency: 3
      })
      const testData = [task.toJSON()]
      
      // 直接设置到localStorage
      localStorage.setItem(StorageService.STORAGE_KEYS.TASKS, JSON.stringify(testData))
      
      const tasks = await StorageService.getAllTasks()
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toBeInstanceOf(Task)
      expect(tasks[0].title).toBe('测试任务')
    })

    it('应该处理损坏的JSON数据', async () => {
      localStorage.setItem(StorageService.STORAGE_KEYS.TASKS, 'invalid json')
      
      const tasks = await StorageService.getAllTasks()
      expect(tasks).toEqual([])
    })
  })

  describe('saveTasks', () => {
    it('应该保存任务到localStorage', async () => {
      const tasks = [
        new Task({ title: '任务1', importance: 3, urgency: 2 }),
        new Task({ title: '任务2', importance: 2, urgency: 3 })
      ]

      const result = await StorageService.saveTasks(tasks)
      
      expect(result).toBe(true)
      
      // 验证数据已保存
      const savedData = JSON.parse(localStorage.getItem(StorageService.STORAGE_KEYS.TASKS))
      expect(savedData).toHaveLength(2)
      expect(savedData[0].title).toBe('任务1')
    })

    it('应该处理保存错误', async () => {
      // 模拟存储空间不足
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      const tasks = [new Task({ title: '测试任务' })]
      const result = await StorageService.saveTasks(tasks)
      
      expect(result).toBe(false)
      
      // 恢复原始方法
      localStorage.setItem = originalSetItem
    })
  })

  describe('getTaskById', () => {
    it('应该根据ID找到任务', async () => {
      const task1 = new Task({ title: '任务1' })
      const task2 = new Task({ title: '任务2' })
      
      await StorageService.saveTasks([task1, task2])
      
      const foundTask = await StorageService.getTaskById(task1.id)
      expect(foundTask).toBeTruthy()
      expect(foundTask.title).toBe('任务1')
    })

    it('应该返回null当任务不存在时', async () => {
      const foundTask = await StorageService.getTaskById('non-existent-id')
      expect(foundTask).toBeNull()
    })
  })

  describe('createTask', () => {
    it('应该创建顶级任务', async () => {
      const taskData = {
        title: '新任务',
        description: '新任务描述',
        importance: 2,
        urgency: 3
      }

      const task = await StorageService.createTask(taskData)
      
      expect(task.title).toBe('新任务')
      expect(task.id).toBeTruthy()
      expect(task.taskLevel).toBe(1)
      expect(task.taskNumber).toBe('T001')

      // 验证任务已保存
      const allTasks = await StorageService.getAllTasks()
      expect(allTasks).toHaveLength(1)
      expect(allTasks[0].id).toBe(task.id)
    })

    it('应该创建子任务', async () => {
      // 先创建父任务
      const parentTask = await StorageService.createTask({
        title: '父任务',
        importance: 2,
        urgency: 2
      })

      // 创建子任务
      const subTaskData = {
        title: '子任务',
        parentId: parentTask.id,
        importance: 1,
        urgency: 2
      }

      const subTask = await StorageService.createTask(subTaskData)
      
      expect(subTask.title).toBe('子任务')
      expect(subTask.parentId).toBe(parentTask.id)
      expect(subTask.taskLevel).toBe(2)
      expect(subTask.taskNumber).toBe('T001.1')

      // 验证子任务已添加到父任务
      const updatedParent = await StorageService.getTaskById(parentTask.id)
      expect(updatedParent.subTasks).toHaveLength(1)
      expect(updatedParent.subTasks[0].id).toBe(subTask.id)
    })

    it('应该在父任务不存在时抛出错误', async () => {
      const taskData = {
        title: '子任务',
        parentId: 'non-existent-parent'
      }
      await expect(StorageService.createTask(taskData)).rejects.toThrow('父任务不存在')
    })
  })

  describe('updateTask', () => {
    it('应该更新现有任务', async () => {
      const task = await StorageService.createTask({
        title: '原始任务',
        importance: 2,
        urgency: 2
      })

      const updateData = {
        title: '更新后的任务',
        importance: 3,
        urgency: 1
      }

      const updatedTask = await StorageService.updateTask(task.id, updateData)
      
      expect(updatedTask.title).toBe('更新后的任务')
      expect(updatedTask.importance).toBe(3)
      expect(updatedTask.urgency).toBe(1)

      // 验证优先级分数已重新计算
      expect(updatedTask.priorityScore).toBe(10) // 3 * 3 + 1 = 10
    })

    it('应该在任务不存在时抛出错误', async () => {
      await expect(StorageService.updateTask('non-existent-id', { title: '新标题' }))
        .rejects.toThrow('任务不存在')
    })
  })

  describe('deleteTask', () => {
    it('应该删除顶级任务', async () => {
      const task1 = await StorageService.createTask({ title: '任务1' })
      const task2 = await StorageService.createTask({ title: '任务2' })

      const result = await StorageService.deleteTask(task1.id)
      expect(result).toBe(true)

      const remainingTasks = await StorageService.getAllTasks()
      expect(remainingTasks).toHaveLength(1)
      expect(remainingTasks[0].id).toBe(task2.id)
    })

    it('应该删除子任务', async () => {
      const parentTask = await StorageService.createTask({ title: '父任务' })
      const subTask = await StorageService.createTask({
        title: '子任务',
        parentId: parentTask.id
      })

      const result = await StorageService.deleteTask(subTask.id)
      expect(result).toBe(true)

      const updatedParent = await StorageService.getTaskById(parentTask.id)
      expect(updatedParent.subTasks).toHaveLength(0)
    })
  })

  describe('getSettings', () => {
    it('应该返回默认设置当没有存储设置时', () => {
      const settings = StorageService.getSettings()
      const defaultSettings = StorageService.getDefaultSettings()
      expect(settings).toEqual(defaultSettings)
    })

    it('应该从localStorage加载设置', () => {
      const testSettings = {
        theme: 'dark',
        language: 'en',
        notifications: { enabled: false }
      }
      
      localStorage.setItem(StorageService.STORAGE_KEYS.SETTINGS, JSON.stringify(testSettings))
      
      const settings = StorageService.getSettings()
      expect(settings.theme).toBe('dark')
      expect(settings.language).toBe('en')
      expect(settings.notifications.enabled).toBe(false)
    })

    it('应该处理损坏的设置数据', () => {
      localStorage.setItem(StorageService.STORAGE_KEYS.SETTINGS, 'invalid json')
      
      const settings = StorageService.getSettings()
      const defaultSettings = StorageService.getDefaultSettings()
      expect(settings).toEqual(defaultSettings)
    })
  })

  describe('saveSettings', () => {
    it('应该保存设置到localStorage', () => {
      const newSettings = {
        theme: 'light',
        language: 'zh-CN',
        notifications: { enabled: true }
      }

      const result = StorageService.saveSettings(newSettings)
      expect(result).toBe(true)

      const savedSettings = JSON.parse(localStorage.getItem(StorageService.STORAGE_KEYS.SETTINGS))
      expect(savedSettings).toEqual(newSettings)
    })

    it('应该处理保存错误', () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error')
      })

      const result = StorageService.saveSettings({ theme: 'light' })
      expect(result).toBe(false)

      localStorage.setItem = originalSetItem
    })
  })

  describe('exportData', () => {
    it('应该导出所有数据', async () => {
      // 创建测试数据
      const task = await StorageService.createTask({ title: '测试任务' })
      const settings = { theme: 'dark' }
      StorageService.saveSettings(settings)

      const exportedData = await StorageService.exportData()

      expect(exportedData.version).toBe('1.0.0')
      expect(exportedData.exportDate).toBeTruthy()
      expect(exportedData.tasks).toHaveLength(1)
      expect(exportedData.tasks[0].title).toBe('测试任务')
      expect(exportedData.settings.theme).toBe('dark')
    })
  })

  describe('importData', () => {
    it('应该导入任务和设置', async () => {
      const task = new Task({ title: '导入的任务' })
      const importData = {
        version: '1.0.0',
        tasks: [task.toJSON()],
        settings: {
          theme: 'light',
          language: 'en'
        }
      }

      const result = await StorageService.importData(importData)
      expect(result).toBe(true)

      const tasks = await StorageService.getAllTasks()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('导入的任务')

      const settings = StorageService.getSettings()
      expect(settings.theme).toBe('light')
      expect(settings.language).toBe('en')
    })

    it('应该处理导入错误', async () => {
      const result = await StorageService.importData({ invalid: 'data' })
      expect(result).toBe(true) // 即使没有有效数据也应该返回true
    })
  })

  describe('clearAllData', () => {
    it('应该清空所有数据', () => {
      // 设置一些数据
      localStorage.setItem(StorageService.STORAGE_KEYS.TASKS, JSON.stringify([]))
      localStorage.setItem(StorageService.STORAGE_KEYS.SETTINGS, JSON.stringify({}))

      const result = StorageService.clearAllData()
      expect(result).toBe(true)

      expect(localStorage.getItem(StorageService.STORAGE_KEYS.TASKS)).toBeNull()
      expect(localStorage.getItem(StorageService.STORAGE_KEYS.SETTINGS)).toBeNull()
    })

    it('应该处理清空错误', () => {
      const originalRemoveItem = localStorage.removeItem
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error')
      })

      const result = StorageService.clearAllData()
      expect(result).toBe(false)

      localStorage.removeItem = originalRemoveItem
    })
  })

  describe('getStorageInfo', () => {
    it('应该返回存储信息', () => {
      // 设置测试数据
      const testData = JSON.stringify([{ id: '1', title: 'test' }])
      const testSettings = JSON.stringify({ theme: 'dark' })
      
      localStorage.setItem(StorageService.STORAGE_KEYS.TASKS, testData)
      localStorage.setItem(StorageService.STORAGE_KEYS.SETTINGS, testSettings)

      const info = StorageService.getStorageInfo()

      expect(typeof info.tasksSize).toBe('number')
      expect(typeof info.settingsSize).toBe('number')
      expect(typeof info.totalSize).toBe('number')
      expect(info.totalSize).toBe(info.tasksSize + info.settingsSize)
    })

    it('应该处理空存储', () => {
      const info = StorageService.getStorageInfo()
      
      expect(info.tasksSize).toBe(0)
      expect(info.settingsSize).toBe(0)
      expect(info.totalSize).toBe(0)
    })
  })
})