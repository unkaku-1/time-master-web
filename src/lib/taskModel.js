import { PriorityCalculator } from './priorityCalculator.js';

/**
 * 任务数据模型类
 * 包含所有属性和计算方法
 */
export class Task {
  constructor({
    id = null,
    title = '',
    description = '',
    importance = 2,
    urgency = 2,
    status = 'pending',
    parentId = null,
    taskLevel = 1,
    taskNumber = '',
    createdAt = new Date(),
    startedAt = null,
    completedAt = null,
    dueDate = null,
    reminderTime = null,
    estimatedHours = 0,
    actualHours = 0,
    subTasks = []
  } = {}) {
    this.id = id || this.generateId();
    this.title = title;
    this.description = description;
    this.importance = this.validateImportance(importance);
    this.urgency = this.validateUrgency(urgency);
    this.status = this.validateStatus(status);
    this.parentId = parentId;
    this.taskLevel = Math.max(1, Math.min(10, taskLevel)); // 限制在1-10层
    this.taskNumber = taskNumber;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.startedAt = startedAt ? (startedAt instanceof Date ? startedAt : new Date(startedAt)) : null;
    this.completedAt = completedAt ? (completedAt instanceof Date ? completedAt : new Date(completedAt)) : null;
    this.dueDate = dueDate ? (dueDate instanceof Date ? dueDate : new Date(dueDate)) : null;
    this.reminderTime = reminderTime ? (reminderTime instanceof Date ? reminderTime : new Date(reminderTime)) : null;
    this.estimatedHours = Math.max(0, parseFloat(estimatedHours) || 0);
    this.actualHours = Math.max(0, parseFloat(actualHours) || 0);
    this.subTasks = Array.isArray(subTasks) ? subTasks : [];
    
    // 计算优先级分数
    this.priorityScore = this.calculatePriorityScore();
  }

  /**
   * 生成唯一ID
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 验证重要度值
   * @param {number} importance - 重要度 (1-3)
   * @returns {number}
   */
  validateImportance(importance) {
    const value = parseInt(importance);
    if (value >= 1 && value <= 3) {
      return value;
    }
    return 2; // 默认值
  }

  /**
   * 验证紧急度值
   * @param {number} urgency - 紧急度 (1-3)
   * @returns {number}
   */
  validateUrgency(urgency) {
    const value = parseInt(urgency);
    if (value >= 1 && value <= 3) {
      return value;
    }
    return 2; // 默认值
  }

  /**
   * 验证状态值
   * @param {string} status - 状态
   * @returns {string}
   */
  validateStatus(status) {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (validStatuses.includes(status)) {
      return status;
    }
    return 'pending'; // 默认值
  }

  /**
   * 计算优先级分数
   * @returns {number}
   */
  calculatePriorityScore() {
    return PriorityCalculator.calculatePriority(this.importance, this.urgency);
  }

  /**
   * 检查任务是否逾期
   * @returns {boolean}
   */
  isOverdue() {
    return PriorityCalculator.isOverdue(this);
  }

  /**
   * 获取优先级类别
   * @returns {string}
   */
  getPriorityCategory() {
    return PriorityCalculator.getPriorityCategory(this.importance, this.urgency);
  }

  /**
   * 获取优先级颜色
   * @returns {string}
   */
  getPriorityColor() {
    return PriorityCalculator.getPriorityColor(this.importance, this.urgency);
  }

  /**
   * 获取优先级标签
   * @returns {string}
   */
  getPriorityLabel() {
    return PriorityCalculator.getPriorityLabel(this.importance, this.urgency);
  }

  /**
   * 获取状态标签
   * @returns {string}
   */
  getStatusLabel() {
    const statusMap = {
      'pending': '待办',
      'in_progress': '进行中',
      'completed': '已完成'
    };
    return statusMap[this.status] || '未知';
  }

  /**
   * 获取状态颜色
   * @returns {string}
   */
  getStatusColor() {
    const colorMap = {
      'pending': 'bg-gray-500',
      'in_progress': 'bg-blue-500',
      'completed': 'bg-green-500'
    };
    return colorMap[this.status] || 'bg-gray-500';
  }

  /**
   * 计算任务进度（基于子任务）
   * @returns {number} 进度百分比 (0-100)
   */
  calculateProgress() {
    if (this.status === 'completed') return 100;
    if (this.subTasks.length === 0) {
      return this.status === 'in_progress' ? 50 : 0;
    }

    const completedSubTasks = this.subTasks.filter(subTask => subTask.status === 'completed').length;
    return Math.round((completedSubTasks / this.subTasks.length) * 100);
  }

  /**
   * 更新任务状态
   * @param {string} newStatus - 新状态
   */
  updateStatus(newStatus) {
    const oldStatus = this.status;
    this.status = this.validateStatus(newStatus);
    
    // 更新时间戳
    const now = new Date();
    if (this.status === 'in_progress' && oldStatus === 'pending') {
      this.startedAt = now;
    } else if (this.status === 'completed' && oldStatus !== 'completed') {
      this.completedAt = now;
    }
  }

  /**
   * 添加子任务
   * @param {Task} subTask - 子任务
   */
  addSubTask(subTask) {
    if (this.taskLevel >= 10) {
      throw new Error('任务层级不能超过10层');
    }
    
    subTask.parentId = this.id;
    subTask.taskLevel = this.taskLevel + 1;
    this.subTasks.push(subTask);
  }

  /**
   * 移除子任务
   * @param {string} subTaskId - 子任务ID
   */
  removeSubTask(subTaskId) {
    this.subTasks = this.subTasks.filter(subTask => subTask.id !== subTaskId);
  }

  /**
   * 转换为普通对象（用于存储）
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      importance: this.importance,
      urgency: this.urgency,
      status: this.status,
      parentId: this.parentId,
      taskLevel: this.taskLevel,
      taskNumber: this.taskNumber,
      createdAt: this.createdAt.toISOString(),
      startedAt: this.startedAt ? this.startedAt.toISOString() : null,
      completedAt: this.completedAt ? this.completedAt.toISOString() : null,
      dueDate: this.dueDate ? this.dueDate.toISOString() : null,
      reminderTime: this.reminderTime ? this.reminderTime.toISOString() : null,
      estimatedHours: this.estimatedHours,
      actualHours: this.actualHours,
      priorityScore: this.priorityScore,
      subTasks: this.subTasks.map(subTask => subTask.toJSON ? subTask.toJSON() : subTask)
    };
  }

  /**
   * 从普通对象创建任务实例
   * @param {Object} data - 任务数据
   * @returns {Task}
   */
  static fromJSON(data) {
    const task = new Task(data);
    
    // 递归创建子任务
    if (data.subTasks && Array.isArray(data.subTasks)) {
      task.subTasks = data.subTasks.map(subTaskData => Task.fromJSON(subTaskData));
    }
    
    return task;
  }

  /**
   * 克隆任务
   * @returns {Task}
   */
  clone() {
    return Task.fromJSON(this.toJSON());
  }
}

