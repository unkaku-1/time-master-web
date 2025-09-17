/**
 * 优先级计算器类
 * 基于艾森豪威尔矩阵计算优先级和智能排序
 */
export class PriorityCalculator {
  /**
   * 计算任务优先级分数
   * 基于艾森豪威尔矩阵: 重要且紧急(12) > 重要不紧急(9) > 不重要但紧急(6) > 不重要不紧急(3)
   * @param {number} importance - 重要度 (1-3)
   * @param {number} urgency - 紧急度 (1-3)
   * @returns {number} 优先级分数
   */
  static calculatePriority(importance, urgency) {
    // 验证输入参数
    if (!Number.isInteger(importance) || importance < 1 || importance > 3) {
      throw new Error('重要度必须是1-3之间的整数');
    }
    if (!Number.isInteger(urgency) || urgency < 1 || urgency > 3) {
      throw new Error('紧急度必须是1-3之间的整数');
    }

    return importance * 3 + urgency;
  }

  /**
   * 获取优先级类别
   * @param {number} importance - 重要度
   * @param {number} urgency - 紧急度
   * @returns {string} 优先级类别
   */
  static getPriorityCategory(importance, urgency) {
    if (importance === 3 && urgency === 3) return 'urgent_important';
    if (importance === 3 && urgency < 3) return 'important_not_urgent';
    if (importance < 3 && urgency === 3) return 'urgent_not_important';
    return 'not_urgent_not_important';
  }

  /**
   * 获取优先级权重（用于更细粒度的排序）
   * @param {number} importance - 重要度
   * @param {number} urgency - 紧急度
   * @param {Date} createdAt - 创建时间
   * @returns {number} 优先级权重
   */
  static calculatePriorityWeight(importance, urgency, createdAt = new Date()) {
    const basePriority = this.calculatePriority(importance, urgency);
    
    // 时间因子：越早创建的任务权重稍高（避免任务被长期搁置）
    const now = new Date();
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const timeFactor = Math.min(daysSinceCreation * 0.01, 0.5); // 最多增加0.5的权重
    
    return basePriority + timeFactor;
  }

  /**
   * 排序任务列表
   * @param {Array} tasks - 任务列表
   * @param {Object} options - 排序选项
   * @returns {Array} 排序后的任务列表
   */
  static sortTasks(tasks, options = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error('任务列表必须是数组');
    }

    const {
      sortBy = 'priority', // 'priority', 'createdAt', 'dueDate', 'title'
      sortOrder = 'desc', // 'asc', 'desc'
      groupByStatus = false,
      prioritizeOverdue = true
    } = options;

    // 创建任务副本以避免修改原数组
    const sortedTasks = [...tasks];

    // 排序函数
    sortedTasks.sort((a, b) => {
      // 优先处理逾期任务 (只在默认优先级排序时应用)
      if (prioritizeOverdue && sortBy === 'priority') {
        const aOverdue = this.isOverdue(a);
        const bOverdue = this.isOverdue(b);
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
      }

      // 按状态分组 (只在默认优先级排序时应用)
      if (groupByStatus && sortBy === 'priority') {
        const statusOrder = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
      }

      // 主要排序逻辑
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          const aWeight = this.calculatePriorityWeight(a.importance, a.urgency, a.createdAt);
          const bWeight = this.calculatePriorityWeight(b.importance, b.urgency, b.createdAt);
          comparison = aWeight - bWeight;
          break;
          
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
          
        case 'dueDate':
          // 处理空的截止日期
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
          
        case 'title':
          comparison = a.title.localeCompare(b.title, 'zh-CN');
          break;
          
        default:
          comparison = 0;
      }

      // 应用排序顺序
      if (sortOrder === 'desc') {
        comparison = -comparison;
      }

      // 如果主要排序相等，使用优先级作为次要排序
      if (comparison === 0 && sortBy !== 'priority') {
        const aWeight = this.calculatePriorityWeight(a.importance, a.urgency, a.createdAt);
        const bWeight = this.calculatePriorityWeight(b.importance, b.urgency, b.createdAt);
        comparison = bWeight - aWeight;
      }

      return comparison;
    });

    return sortedTasks;
  }

  /**
   * 检查任务是否逾期
   * @param {Object} task - 任务对象
   * @returns {boolean} 是否逾期
   */
  static isOverdue(task) {
    if (!task.dueDate) return false;
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    return now > dueDate && task.status !== 'completed';
  }

  /**
   * 获取优先级颜色
   * @param {number} importance - 重要度
   * @param {number} urgency - 紧急度
   * @returns {string} 颜色类名
   */
  static getPriorityColor(importance, urgency) {
    const category = this.getPriorityCategory(importance, urgency);
    const colorMap = {
      'urgent_important': 'bg-red-500',
      'important_not_urgent': 'bg-yellow-500',
      'urgent_not_important': 'bg-blue-500',
      'not_urgent_not_important': 'bg-gray-500'
    };
    return colorMap[category] || 'bg-gray-500';
  }

  /**
   * 获取优先级标签
   * @param {number} importance - 重要度
   * @param {number} urgency - 紧急度
   * @returns {string} 优先级标签
   */
  static getPriorityLabel(importance, urgency) {
    const category = this.getPriorityCategory(importance, urgency);
    const labelMap = {
      'urgent_important': '紧急重要',
      'important_not_urgent': '重要不紧急',
      'urgent_not_important': '紧急不重要',
      'not_urgent_not_important': '不紧急不重要'
    };
    return labelMap[category] || '未知';
  }
}

