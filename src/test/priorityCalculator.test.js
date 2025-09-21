import { describe, it, expect, beforeEach } from 'vitest'
import { PriorityCalculator } from '../lib/priorityCalculator.js'

describe('PriorityCalculator', () => {
  describe('calculatePriority', () => {
    it('应该正确计算基础优先级分数', () => {
      // 重要且紧急 (3,3) = 12
      expect(PriorityCalculator.calculatePriority(3, 3)).toBe(12)
      
      // 重要不紧急 (3,1) = 10
      expect(PriorityCalculator.calculatePriority(3, 1)).toBe(10)
      
      // 不重要但紧急 (1,3) = 6
      expect(PriorityCalculator.calculatePriority(1, 3)).toBe(6)
      
      // 不重要不紧急 (1,1) = 4
      expect(PriorityCalculator.calculatePriority(1, 1)).toBe(4)
    })

    it('应该验证输入参数的有效性', () => {
      // 测试无效的重要度
      expect(() => PriorityCalculator.calculatePriority(0, 2)).toThrow('重要度必须是1-3之间的整数')
      expect(() => PriorityCalculator.calculatePriority(4, 2)).toThrow('重要度必须是1-3之间的整数')
      expect(() => PriorityCalculator.calculatePriority(1.5, 2)).toThrow('重要度必须是1-3之间的整数')
      
      // 测试无效的紧急度
      expect(() => PriorityCalculator.calculatePriority(2, 0)).toThrow('紧急度必须是1-3之间的整数')
      expect(() => PriorityCalculator.calculatePriority(2, 4)).toThrow('紧急度必须是1-3之间的整数')
      expect(() => PriorityCalculator.calculatePriority(2, 2.5)).toThrow('紧急度必须是1-3之间的整数')
    })
  })

  describe('getPriorityCategory', () => {
    it('应该正确返回优先级类别', () => {
      expect(PriorityCalculator.getPriorityCategory(3, 3)).toBe('urgent_important')
      expect(PriorityCalculator.getPriorityCategory(3, 2)).toBe('important_not_urgent')
      expect(PriorityCalculator.getPriorityCategory(3, 1)).toBe('important_not_urgent')
      expect(PriorityCalculator.getPriorityCategory(2, 3)).toBe('urgent_not_important')
      expect(PriorityCalculator.getPriorityCategory(1, 3)).toBe('urgent_not_important')
      expect(PriorityCalculator.getPriorityCategory(2, 2)).toBe('not_urgent_not_important')
      expect(PriorityCalculator.getPriorityCategory(1, 1)).toBe('not_urgent_not_important')
    })
  })

  describe('calculatePriorityWeight', () => {
    it('应该计算包含时间因子的优先级权重', () => {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      
      // 基础权重应该等于基础优先级
      const baseWeight = PriorityCalculator.calculatePriorityWeight(3, 3, now)
      expect(baseWeight).toBe(12)
      
      // 一天前创建的任务权重应该稍高
      const oneDayWeight = PriorityCalculator.calculatePriorityWeight(3, 3, oneDayAgo)
      expect(oneDayWeight).toBeGreaterThan(12)
      expect(oneDayWeight).toBeLessThan(12.1)
      
      // 十天前创建的任务权重应该更高
      const tenDayWeight = PriorityCalculator.calculatePriorityWeight(3, 3, tenDaysAgo)
      expect(tenDayWeight).toBeGreaterThan(oneDayWeight)
    })

    it('应该限制时间因子的最大值', () => {
      const now = new Date()
      const longAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000) // 100天前
      
      const weight = PriorityCalculator.calculatePriorityWeight(1, 1, longAgo)
      expect(weight).toBeLessThanOrEqual(4.5) // 基础分数4 + 最大时间因子0.5
    })
  })

  describe('isOverdue', () => {
    it('应该正确判断任务是否逾期', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      // 逾期的待办任务
      const overdueTask = {
        dueDate: yesterday,
        status: 'pending'
      }
      expect(PriorityCalculator.isOverdue(overdueTask)).toBe(true)
      
      // 未逾期的任务
      const futureTask = {
        dueDate: tomorrow,
        status: 'pending'
      }
      expect(PriorityCalculator.isOverdue(futureTask)).toBe(false)
      
      // 已完成的逾期任务不算逾期
      const completedOverdueTask = {
        dueDate: yesterday,
        status: 'completed'
      }
      expect(PriorityCalculator.isOverdue(completedOverdueTask)).toBe(false)
      
      // 没有截止日期的任务不算逾期
      const noDateTask = {
        status: 'pending'
      }
      expect(PriorityCalculator.isOverdue(noDateTask)).toBe(false)
    })
  })

  describe('getPriorityColor', () => {
    it('应该返回正确的优先级颜色', () => {
      expect(PriorityCalculator.getPriorityColor(3, 3)).toBe('bg-red-500')
      expect(PriorityCalculator.getPriorityColor(3, 2)).toBe('bg-yellow-500')
      expect(PriorityCalculator.getPriorityColor(2, 3)).toBe('bg-blue-500')
      expect(PriorityCalculator.getPriorityColor(1, 1)).toBe('bg-gray-500')
    })
  })

  describe('getPriorityLabel', () => {
    it('应该返回正确的优先级标签', () => {
      expect(PriorityCalculator.getPriorityLabel(3, 3)).toBe('紧急重要')
      expect(PriorityCalculator.getPriorityLabel(3, 2)).toBe('重要不紧急')
      expect(PriorityCalculator.getPriorityLabel(2, 3)).toBe('紧急不重要')
      expect(PriorityCalculator.getPriorityLabel(1, 1)).toBe('不紧急不重要')
    })
  })

  describe('sortTasks', () => {
    let tasks

    beforeEach(() => {
      const now = new Date()
      tasks = [
        {
          id: 1,
          title: '任务A',
          importance: 1,
          urgency: 1,
          status: 'pending',
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          title: '任务B',
          importance: 3,
          urgency: 3,
          status: 'in_progress',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 逾期
        },
        {
          id: 3,
          title: '任务C',
          importance: 2,
          urgency: 2,
          status: 'completed',
          createdAt: now,
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
        }
      ]
    })

    it('应该验证输入参数', () => {
      expect(() => PriorityCalculator.sortTasks('not an array')).toThrow('任务列表必须是数组')
    })

    it('应该按优先级降序排序', () => {
      const sorted = PriorityCalculator.sortTasks(tasks)
      
      // 逾期的高优先级任务应该排在最前面
      expect(sorted[0].id).toBe(2)
      
      // 其他任务按优先级权重排序
      expect(sorted[1].importance * 3 + sorted[1].urgency).toBeGreaterThanOrEqual(
        sorted[2].importance * 3 + sorted[2].urgency
      )
    })

    it('应该按创建时间排序', () => {
      const sorted = PriorityCalculator.sortTasks(tasks, { sortBy: 'createdAt', sortOrder: 'asc' })
      
      expect(sorted[0].createdAt.getTime()).toBeLessThanOrEqual(sorted[1].createdAt.getTime())
      expect(sorted[1].createdAt.getTime()).toBeLessThanOrEqual(sorted[2].createdAt.getTime())
    })

    it('应该按截止日期排序', () => {
      const sorted = PriorityCalculator.sortTasks(tasks, { sortBy: 'dueDate', sortOrder: 'asc' })
      
      // 逾期任务应该排在最前面
      expect(sorted[0].id).toBe(2)
    })

    it('应该按标题排序', () => {
      const sorted = PriorityCalculator.sortTasks(tasks, { sortBy: 'title', sortOrder: 'asc' })
      
      expect(sorted[0].title).toBe('任务A')
      expect(sorted[1].title).toBe('任务B')
      expect(sorted[2].title).toBe('任务C')
    })

    it('应该按状态分组', () => {
      const sorted = PriorityCalculator.sortTasks(tasks, { groupByStatus: true })
      
      // 进行中的任务应该排在最前面
      expect(sorted[0].status).toBe('in_progress')
      
      // 已完成的任务应该排在最后面
      expect(sorted[sorted.length - 1].status).toBe('completed')
    })

    it('应该不修改原数组', () => {
      const originalTasks = [...tasks]
      PriorityCalculator.sortTasks(tasks)
      
      expect(tasks).toEqual(originalTasks)
    })

    it('应该处理空数组', () => {
      const sorted = PriorityCalculator.sortTasks([])
      expect(sorted).toEqual([])
    })

    it('应该处理没有截止日期的任务', () => {
      const tasksWithoutDueDate = [
        { ...tasks[0], dueDate: null },
        { ...tasks[1], dueDate: undefined },
        tasks[2]
      ]
      
      const sorted = PriorityCalculator.sortTasks(tasksWithoutDueDate, { sortBy: 'dueDate' })
      
      // 有截止日期的任务应该在排序中被考虑
      const taskWithDueDate = sorted.find(task => task.dueDate)
      expect(taskWithDueDate).toBeTruthy()
      expect(taskWithDueDate.title).toBe('任务C')
    })
  })
})