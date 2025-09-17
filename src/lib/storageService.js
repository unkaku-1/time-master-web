import { Task } from './taskModel.js';

/**
 * 本地存储服务类
 * 使用localStorage进行数据持久化
 */
export class StorageService {
  static STORAGE_KEYS = {
    TASKS: 'time_master_tasks',
    SETTINGS: 'time_master_settings',
    LAST_BACKUP: 'time_master_last_backup'
  };

  /**
   * 获取所有任务
   * @returns {Promise<Array<Task>>}
   */
  static async getAllTasks() {
    try {
      const tasksData = localStorage.getItem(this.STORAGE_KEYS.TASKS);
      if (!tasksData) return [];
      
      const parsedData = JSON.parse(tasksData);
      return parsedData.map(taskData => Task.fromJSON(taskData));
    } catch (error) {
      console.error('Failed to load tasks from storage:', error);
      return [];
    }
  }

  /**
   * 保存所有任务
   * @param {Array<Task>} tasks - 任务列表
   * @returns {Promise<boolean>}
   */
  static async saveTasks(tasks) {
    try {
      const tasksData = tasks.map(task => task.toJSON ? task.toJSON() : task);
      localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasksData));
      return true;
    } catch (error) {
      console.error('Failed to save tasks to storage:', error);
      return false;
    }
  }

  /**
   * 根据ID获取任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Task|null>}
   */
  static async getTaskById(taskId) {
    const tasks = await this.getAllTasks();
    return this.findTaskById(tasks, taskId);
  }

  /**
   * 递归查找任务（包括子任务）
   * @param {Array<Task>} tasks - 任务列表
   * @param {string} taskId - 任务ID
   * @returns {Task|null}
   */
  static findTaskById(tasks, taskId) {
    for (const task of tasks) {
      if (task.id === taskId) return task;
      
      // 递归查找子任务
      if (task.subTasks && task.subTasks.length > 0) {
        const found = this.findTaskById(task.subTasks, taskId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 创建新任务
   * @param {Object} taskData - 任务数据
   * @returns {Promise<Task>}
   */
  static async createTask(taskData) {
    try {
      const tasks = await this.getAllTasks();
      
      // 生成任务编号
      const taskNumber = this.generateTaskNumber(tasks, taskData.parentId);
      
      // 计算任务层级
      const taskLevel = taskData.parentId ? 
        await this.calculateTaskLevel(taskData.parentId) : 1;
      
      // 创建任务实例
      const task = new Task({
        ...taskData,
        taskNumber,
        taskLevel
      });

      // 如果是子任务，添加到父任务中
      if (taskData.parentId) {
        const parentTask = this.findTaskById(tasks, taskData.parentId);
        if (parentTask) {
          parentTask.addSubTask(task);
        } else {
          throw new Error('父任务不存在');
        }
      } else {
        // 顶级任务直接添加到列表
        tasks.push(task);
      }

      await this.saveTasks(tasks);
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * 更新任务
   * @param {string} taskId - 任务ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<Task|null>}
   */
  static async updateTask(taskId, updates) {
    try {
      const tasks = await this.getAllTasks();
      const task = this.findTaskById(tasks, taskId);
      
      if (!task) {
        throw new Error('任务不存在');
      }

      // 更新任务属性
      Object.keys(updates).forEach(key => {
        if (key in task && updates[key] !== undefined) {
          if (key === 'status') {
            task.updateStatus(updates[key]);
          } else {
            task[key] = updates[key];
          }
        }
      });

      // 重新计算优先级分数
      task.priorityScore = task.calculatePriorityScore();

      await this.saveTasks(tasks);
      return task;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  /**
   * 删除任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<boolean>}
   */
  static async deleteTask(taskId) {
    try {
      const tasks = await this.getAllTasks();
      const updatedTasks = this.removeTaskById(tasks, taskId);
      
      await this.saveTasks(updatedTasks);
      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  }

  /**
   * 递归删除任务（包括从子任务中删除）
   * @param {Array<Task>} tasks - 任务列表
   * @param {string} taskId - 任务ID
   * @returns {Array<Task>}
   */
  static removeTaskById(tasks, taskId) {
    return tasks.filter(task => {
      if (task.id === taskId) return false;
      
      // 递归处理子任务
      if (task.subTasks && task.subTasks.length > 0) {
        task.subTasks = this.removeTaskById(task.subTasks, taskId);
      }
      
      return true;
    });
  }

  /**
   * 生成任务编号
   * @param {Array<Task>} tasks - 现有任务列表
   * @param {string|null} parentId - 父任务ID
   * @returns {string}
   */
  static generateTaskNumber(tasks, parentId = null) {
    if (!parentId) {
      // 顶级任务编号
      const topLevelTasks = tasks.filter(task => !task.parentId);
      return `T${String(topLevelTasks.length + 1).padStart(3, '0')}`;
    } else {
      // 子任务编号
      const parentTask = this.findTaskById(tasks, parentId);
      if (parentTask) {
        const siblingCount = parentTask.subTasks ? parentTask.subTasks.length : 0;
        return `${parentTask.taskNumber}.${siblingCount + 1}`;
      }
      return 'T001.1';
    }
  }

  /**
   * 计算任务层级
   * @param {string} parentId - 父任务ID
   * @returns {Promise<number>}
   */
  static async calculateTaskLevel(parentId) {
    const tasks = await this.getAllTasks();
    const parentTask = this.findTaskById(tasks, parentId);
    return parentTask ? parentTask.taskLevel + 1 : 1;
  }

  /**
   * 获取设置
   * @returns {Object}
   */
  static getSettings() {
    try {
      const settingsData = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
      return settingsData ? JSON.parse(settingsData) : this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 保存设置
   * @param {Object} settings - 设置对象
   * @returns {boolean}
   */
  static saveSettings(settings) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  /**
   * 获取默认设置
   * @returns {Object}
   */
  static getDefaultSettings() {
    return {
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
    };
  }

  /**
   * 导出数据
   * @returns {Object}
   */
  static async exportData() {
    const tasks = await this.getAllTasks();
    const settings = this.getSettings();
    
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      tasks: tasks.map(task => task.toJSON()),
      settings
    };
  }

  /**
   * 导入数据
   * @param {Object} data - 导入的数据
   * @returns {Promise<boolean>}
   */
  static async importData(data) {
    try {
      if (data.tasks && Array.isArray(data.tasks)) {
        const tasks = data.tasks.map(taskData => Task.fromJSON(taskData));
        await this.saveTasks(tasks);
      }
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   * @returns {boolean}
   */
  static clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.TASKS);
      localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(this.STORAGE_KEYS.LAST_BACKUP);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Object}
   */
  static getStorageInfo() {
    try {
      const tasksSize = localStorage.getItem(this.STORAGE_KEYS.TASKS)?.length || 0;
      const settingsSize = localStorage.getItem(this.STORAGE_KEYS.SETTINGS)?.length || 0;
      
      return {
        tasksSize: Math.round(tasksSize / 1024 * 100) / 100, // KB
        settingsSize: Math.round(settingsSize / 1024 * 100) / 100, // KB
        totalSize: Math.round((tasksSize + settingsSize) / 1024 * 100) / 100 // KB
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { tasksSize: 0, settingsSize: 0, totalSize: 0 };
    }
  }
}

