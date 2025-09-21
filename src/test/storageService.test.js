import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService } from '../lib/storageService.js'
import { Task } from '../lib/taskModel.js'

describe('StorageService', () => {
  // 使用真实的localStorage mock
  let localStorageMock

  beforeEach(() => {
    // 创建localStorage mock
    localStorageMock = {
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

    // 替换全局localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    })

    // 清空mock调用记录
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('STORAGE_KEYS', () => {
    it('应该定义正确的存储键', () => {
      expect(StorageService.STORAGE_KEYS.TASKS).toBe('time_master_tasks')
      expect(StorageService.STORAGE_KEYS.SETTINGS).toBe('time_master_settings')
      expect(StorageService.STORAGE_KEYS.LAST_BACKUP).toBe('time_master_last_backup')
    })
  })

  describe('getAllTasks', () => {
    it('应该返回空数组当没有存储数据时', async () => {
      const tasks = await StorageService.getAllTasks()
      expect(tasks).toEqual([])
    })

    it('应该从localStorage加载任务', async () => {
      const taskData = [{
        id: 'test-1',
        title: '测试任务',
        importance: 3,
        urgency: 2,
        status: 'pending',
        createdAt: new Date().toISOString()
      }]
      
      localStorageMock.store[StorageService.STORAGE_KEYS.TASKS] = JSON.stringify(taskData)
      
      const tasks = await StorageService.getAllTasks()
      
      expect(tasks).toHaveLength(1)
      expect(tasks[0]).toBeInstanceOf(Task)
      expect(tasks[0].title).toBe('测试任务')
    })

    it('应该处理损坏的JSON数据', async () => {
      localStorageMock.store[StorageService.STORAGE_KEYS.TASKS] = 'invalid json'
      
      // 在测试环境中，console.error不会被调用，因为我们检查了NODE_ENV
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
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        StorageService.STORAGE_KEYS.TASKS,
        expect.any(String)
      )
      
      const savedData = JSON.parse(localStorageMock.store[StorageService.STORAGE_KEYS.TASKS])
      expect(savedData).toHaveLength(2)
      expect(savedData[0].title).toBe('任务1')
    })

    it('应该处理保存错误', async () => {
      // Mock localStorage.setItem 抛出错误
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const tasks = [new Task({ title: '测试任务' })]
      const result = await StorageService.saveTasks(tasks)
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('getTaskById', () => {
    it('应该根据ID找到任务', async () => {
      const task1 = new Task({ title: '任务1' })
      const task2 = new Task({ title: '任务2' })
      
      await StorageService.saveTasks([task1, task2])
      
      const foundTask = await StorageService.getTaskById(task1.id)
      
      expect(foundTask).toBeTruthy()
      expect(foundTask.id).toBe(task1.id)
      expect(foundTask.title).toBe('任务1')
    })

    it('应该返回null当任务不存在时', async () => {
      await StorageService.saveTasks([])
      
      const foundTask = await StorageService.getTaskById('non-existent-id')
      
      expect(foundTask).toBeNull()
    })
  })

  describe('findTaskById', () => {
    it('应该在顶级任务中找到任务', () => {
      const task1 = new Task({ title: '任务1' })
      const task2 = new Task({ title: '任务2' })
      const tasks = [task1, task2]
      
      const found = StorageService.findTaskById(tasks, task1.id)
      
      expect(found).toBe(task1)
    })

    it('应该在子任务中找到任务', () => {
      const parentTask = new Task({ title: '父任务' })
      const subTask = new Task({ title: '子任务' })
      parentTask.addSubTask(subTask)
      
      const tasks = [parentTask]
      
      const found = StorageService.findTaskById(tasks, subTask.id)
      
      expect(found).toBe(subTask)
    })

    it('应该返回null当任务不存在时', () => {
      const tasks = [new Task({ title: '任务1' })]
      
      const found = StorageService.findTaskById(tasks, 'non-existent-id')
      
      expect(found).toBeNull()
    })
  })

  describe('createTask', () => {
    it('应该创建顶级任务', async () => {
      const taskData = {
        title: '新任务',
        importance: 3,
        urgency: 2
      }
      
      const task = await StorageService.createTask(taskData)
      
      expect(task).toBeInstanceOf(Task)
      expect(task.title).toBe('新任务')
      expect(task.taskNumber).toBe('T001')
      expect(task.taskLevel).toBe(1)
      
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
        importance: 3,
        urgency: 1,
        parentId: parentTask.id
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
        urgency: 2,
        status: 'pending'
      })
      
      const updates = {
        title: '更新后的任务',
        importance: 3,
        status: 'in_progress'
      }
      
      const updatedTask = await StorageService.updateTask(task.id, updates)
      
      expect(updatedTask.title).toBe('更新后的任务')
      expect(updatedTask.importance).toBe(3)
      expect(updatedTask.status).toBe('in_progress')
      expect(updatedTask.startedAt).toBeInstanceOf(Date)
      
      // 验证优先级分数已重新计算
      expect(updatedTask.priorityScore).toBe(11) // 3*3 + 2 = 11
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

  describe('generateTaskNumber', () => {
    it('应该为顶级任务生成正确的编号', () => {
      const tasks = [
        { taskNumber: 'T001', parentId: null },
        { taskNumber: 'T002', parentId: null }
      ]
      
      const number = StorageService.generateTaskNumber(tasks)
      expect(number).toBe('T003')
    })

    it('应该为子任务生成正确的编号', () => {
      const parentTask = {
        id: 'parent-1',
        taskNumber: 'T001',
        subTasks: [
          { taskNumber: 'T001.1' }
        ]
      }
      
      const tasks = [parentTask]
      
      const number = StorageService.generateTaskNumber(tasks, 'parent-1')
      expect(number).toBe('T001.2')
    })

    it('应该处理没有子任务的父任务', () => {
      const parentTask = {
        id: 'parent-1',
        taskNumber: 'T001',
        subTasks: []
      }
      
      const tasks = [parentTask]
      
      const number = StorageService.generateTaskNumber(tasks, 'parent-1')
      expect(number).toBe('T001.1')
    })
  })

  describe('getSettings', () => {
    it('应该返回默认设置当没有存储设置时', () => {
      const settings = StorageService.getSettings()
      
      expect(settings).toEqual(StorageService.getDefaultSettings())
    })

    it('应该从localStorage加载设置', () => {
      const customSettings = {
        theme: 'light',
        language: 'en-US'
      }
      
      localStorageMock.store[StorageService.STORAGE_KEYS.SETTINGS] = JSON.stringify(customSettings)
      
      const settings = StorageService.getSettings()
      
      expect(settings.theme).toBe('light')
      expect(settings.language).toBe('en-US')
    })

    it('应该处理损坏的设置数据', () => {
      localStorageMock.store[StorageService.STORAGE_KEYS.SETTINGS] = 'invalid json'
      
      // 在测试环境中，console.error不会被调用，因为我们检查了NODE_ENV
      const settings = StorageService.getSettings()
      
      expect(settings).toEqual(StorageService.getDefaultSettings())
    })
  })

  describe('saveSettings', () => {
    it('应该保存设置到localStorage', () => {
      const settings = {
        theme: 'light',
        language: 'en-US'
      }
      
      const result = StorageService.saveSettings(settings)
      
      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        StorageService.STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings)
      )
    })

    it('应该处理保存错误', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = StorageService.saveSettings({ theme: 'light' })
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('getDefaultSettings', () => {
    it('应该返回正确的默认设置', () => {
      const defaultSettings = StorageService.getDefaultSettings()
      
      expect(defaultSettings).toEqual({
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
      })
    })
  })

  describe('exportData', () => {
    it('应该导出所有数据', async () => {
      // 创建测试数据
      const task = await StorageService.createTask({ title: '测试任务' })
      const settings = { theme: 'light' }
      StorageService.saveSettings(settings)
      
      const exportedData = await StorageService.exportData()
      
      expect(exportedData.version).toBe('1.0.0')
      expect(exportedData.exportDate).toBeTruthy()
      expect(exportedData.tasks).toHaveLength(1)
      expect(exportedData.tasks[0].title).toBe('测试任务')
      expect(exportedData.settings.theme).toBe('light')
    })
  })

  describe('importData', () => {
    it('应该导入任务和设置', async () => {
      const importData = {
        version: '1.0.0',
        tasks: [{
          id: 'imported-1',
          title: '导入的任务',
          importance: 3,
          urgency: 2,
          status: 'pending',
          createdAt: new Date().toISOString()
        }],
        settings: {
          theme: 'light',
          language: 'en-US'
        }
      }
      
      const result = await StorageService.importData(importData)
      
      expect(result).toBe(true)
      
      const tasks = await StorageService.getAllTasks()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('导入的任务')
      
      const settings = StorageService.getSettings()
      expect(settings.theme).toBe('light')
      expect(settings.language).toBe('en-US')
    })

    it('应该处理导入错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = await StorageService.importData({ invalid: 'data' })
      
      expect(result).toBe(true) // 即使没有有效数据也应该返回true
      
      consoleSpy.mockRestore()
    })
  })

  describe('clearAllData', () => {
    it('应该清空所有数据', () => {
      // 设置一些数据
      localStorage.setItem(StorageService.STORAGE_KEYS.TASKS, JSON.stringify([{ id: '1' }]));
      localStorage.setItem(StorageService.STORAGE_KEYS.SETTINGS, JSON.stringify({ theme: 'dark' }));
      
      const result = StorageService.clearAllData();
      
      expect(result).toBe(true);
      expect(localStorage.getItem(StorageService.STORAGE_KEYS.TASKS)).toBeNull();
      expect(localStorage.getItem(StorageService.STORAGE_KEYS.SETTINGS)).toBeNull();
    });

    it('应该处理清空错误', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // 模拟localStorage.removeItem抛出错误
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = StorageService.clearAllData();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      // 恢复原始方法
      localStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  describe('getStorageInfo', () => {
    it('应该返回存储信息', () => {
      // 设置测试数据
      const tasksData = JSON.stringify([{ id: '1', title: 'Test Task' }]);
      const settingsData = JSON.stringify({ theme: 'dark' });
      
      localStorage.setItem(StorageService.STORAGE_KEYS.TASKS, tasksData);
      localStorage.setItem(StorageService.STORAGE_KEYS.SETTINGS, settingsData);
      
      const info = StorageService.getStorageInfo();
      
      expect(info).toHaveProperty('tasksSize');
      expect(info).toHaveProperty('settingsSize');
      expect(info).toHaveProperty('totalSize');
      expect(typeof info.tasksSize).toBe('number');
      expect(typeof info.settingsSize).toBe('number');
      expect(typeof info.totalSize).toBe('number');
      expect(info.totalSize).toBe(info.tasksSize + info.settingsSize);
    });

    it('应该处理空存储', () => {
      localStorage.clear();
      
      const info = StorageService.getStorageInfo();
      
      expect(info.tasksSize).toBe(0);
      expect(info.settingsSize).toBe(0);
      expect(info.totalSize).toBe(0);
    });
  });
});