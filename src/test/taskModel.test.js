import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Task } from '../lib/taskModel.js'

describe('Task', () => {
  let taskData

  beforeEach(() => {
    taskData = {
      title: '测试任务',
      description: '这是一个测试任务',
      importance: 3,
      urgency: 2,
      status: 'pending',
      estimatedHours: 5,
      actualHours: 2
    }
  })

  describe('constructor', () => {
    it('应该创建具有默认值的任务', () => {
      const task = new Task()
      
      expect(task.id).toBeTruthy()
      expect(task.title).toBe('')
      expect(task.description).toBe('')
      expect(task.importance).toBe(2)
      expect(task.urgency).toBe(2)
      expect(task.status).toBe('pending')
      expect(task.taskLevel).toBe(1)
      expect(task.estimatedHours).toBe(0)
      expect(task.actualHours).toBe(0)
      expect(task.subTasks).toEqual([])
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.priorityScore).toBe(8) // importance(2) * 3 + urgency(2) = 8
    })

    it('应该创建具有指定值的任务', () => {
      const task = new Task(taskData)
      
      expect(task.title).toBe('测试任务')
      expect(task.description).toBe('这是一个测试任务')
      expect(task.importance).toBe(3)
      expect(task.urgency).toBe(2)
      expect(task.status).toBe('pending')
      expect(task.estimatedHours).toBe(5)
      expect(task.actualHours).toBe(2)
      expect(task.priorityScore).toBe(11) // importance(3) * 3 + urgency(2) = 11
    })

    it('应该正确处理日期字符串', () => {
      const dateString = '2024-01-01T10:00:00.000Z'
      const task = new Task({
        createdAt: dateString,
        dueDate: dateString,
        reminderTime: dateString
      })
      
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.dueDate).toBeInstanceOf(Date)
      expect(task.reminderTime).toBeInstanceOf(Date)
      expect(task.createdAt.toISOString()).toBe(dateString)
    })

    it('应该限制任务层级在1-10之间', () => {
      const task1 = new Task({ taskLevel: 0 })
      expect(task1.taskLevel).toBe(1)
      
      const task2 = new Task({ taskLevel: 15 })
      expect(task2.taskLevel).toBe(10)
      
      const task3 = new Task({ taskLevel: 5 })
      expect(task3.taskLevel).toBe(5)
    })

    it('应该确保数值字段为非负数', () => {
      const task = new Task({
        estimatedHours: -5,
        actualHours: -2
      })
      
      expect(task.estimatedHours).toBe(0)
      expect(task.actualHours).toBe(0)
    })
  })

  describe('generateId', () => {
    it('应该生成唯一的ID', () => {
      const task1 = new Task()
      const task2 = new Task()
      
      expect(task1.id).toBeTruthy()
      expect(task2.id).toBeTruthy()
      expect(task1.id).not.toBe(task2.id)
    })
  })

  describe('validateImportance', () => {
    it('应该验证有效的重要度值', () => {
      const task = new Task()
      
      expect(task.validateImportance(1)).toBe(1)
      expect(task.validateImportance(2)).toBe(2)
      expect(task.validateImportance(3)).toBe(3)
    })

    it('应该对无效值返回默认值', () => {
      const task = new Task()
      
      expect(task.validateImportance(0)).toBe(2)
      expect(task.validateImportance(4)).toBe(2)
      expect(task.validateImportance('invalid')).toBe(2)
    })
  })

  describe('validateUrgency', () => {
    it('应该验证有效的紧急度值', () => {
      const task = new Task()
      
      expect(task.validateUrgency(1)).toBe(1)
      expect(task.validateUrgency(2)).toBe(2)
      expect(task.validateUrgency(3)).toBe(3)
    })

    it('应该对无效值返回默认值', () => {
      const task = new Task()
      
      expect(task.validateUrgency(0)).toBe(2)
      expect(task.validateUrgency(4)).toBe(2)
      expect(task.validateUrgency('invalid')).toBe(2)
    })
  })

  describe('validateStatus', () => {
    it('应该验证有效的状态值', () => {
      const task = new Task()
      
      expect(task.validateStatus('pending')).toBe('pending')
      expect(task.validateStatus('in_progress')).toBe('in_progress')
      expect(task.validateStatus('completed')).toBe('completed')
    })

    it('应该对无效值返回默认值', () => {
      const task = new Task()
      
      expect(task.validateStatus('invalid')).toBe('pending')
      expect(task.validateStatus('')).toBe('pending')
    })
  })

  describe('calculatePriorityScore', () => {
    it('应该正确计算优先级分数', () => {
      const task = new Task({ importance: 3, urgency: 3 })
      expect(task.calculatePriorityScore()).toBe(12)
      
      const task2 = new Task({ importance: 1, urgency: 1 })
      expect(task2.calculatePriorityScore()).toBe(4)
    })
  })

  describe('isOverdue', () => {
    it('应该正确判断任务是否逾期', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      
      const overdueTask = new Task({ dueDate: yesterday, status: 'pending' })
      expect(overdueTask.isOverdue()).toBe(true)
      
      const futureTask = new Task({ dueDate: tomorrow, status: 'pending' })
      expect(futureTask.isOverdue()).toBe(false)
      
      const completedTask = new Task({ dueDate: yesterday, status: 'completed' })
      expect(completedTask.isOverdue()).toBe(false)
    })
  })

  describe('getPriorityCategory', () => {
    it('应该返回正确的优先级类别', () => {
      const task1 = new Task({ importance: 3, urgency: 3 })
      expect(task1.getPriorityCategory()).toBe('urgent_important')
      
      const task2 = new Task({ importance: 3, urgency: 1 })
      expect(task2.getPriorityCategory()).toBe('important_not_urgent')
      
      const task3 = new Task({ importance: 1, urgency: 3 })
      expect(task3.getPriorityCategory()).toBe('urgent_not_important')
      
      const task4 = new Task({ importance: 1, urgency: 1 })
      expect(task4.getPriorityCategory()).toBe('not_urgent_not_important')
    })
  })

  describe('getPriorityColor', () => {
    it('应该返回正确的优先级颜色', () => {
      const task = new Task({ importance: 3, urgency: 3 })
      expect(task.getPriorityColor()).toBe('bg-red-500')
    })
  })

  describe('getPriorityLabel', () => {
    it('应该返回正确的优先级标签', () => {
      const task = new Task({ importance: 3, urgency: 3 })
      expect(task.getPriorityLabel()).toBe('紧急重要')
    })
  })

  describe('getStatusLabel', () => {
    it('应该返回正确的状态标签', () => {
      const task1 = new Task({ status: 'pending' })
      expect(task1.getStatusLabel()).toBe('待办')
      
      const task2 = new Task({ status: 'in_progress' })
      expect(task2.getStatusLabel()).toBe('进行中')
      
      const task3 = new Task({ status: 'completed' })
      expect(task3.getStatusLabel()).toBe('已完成')
    })
  })

  describe('getStatusColor', () => {
    it('应该返回正确的状态颜色', () => {
      const task1 = new Task({ status: 'pending' })
      expect(task1.getStatusColor()).toBe('bg-gray-500')
      
      const task2 = new Task({ status: 'in_progress' })
      expect(task2.getStatusColor()).toBe('bg-blue-500')
      
      const task3 = new Task({ status: 'completed' })
      expect(task3.getStatusColor()).toBe('bg-green-500')
    })
  })

  describe('calculateProgress', () => {
    it('应该为已完成任务返回100%', () => {
      const task = new Task({ status: 'completed' })
      expect(task.calculateProgress()).toBe(100)
    })

    it('应该为没有子任务的进行中任务返回50%', () => {
      const task = new Task({ status: 'in_progress' })
      expect(task.calculateProgress()).toBe(50)
    })

    it('应该为没有子任务的待办任务返回0%', () => {
      const task = new Task({ status: 'pending' })
      expect(task.calculateProgress()).toBe(0)
    })

    it('应该基于子任务完成情况计算进度', () => {
      const task = new Task()
      task.subTasks = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'pending' },
        { status: 'pending' }
      ]
      
      expect(task.calculateProgress()).toBe(50) // 2/4 = 50%
    })
  })

  describe('updateStatus', () => {
    it('应该更新任务状态', () => {
      const task = new Task({ status: 'pending' })
      task.updateStatus('in_progress')
      
      expect(task.status).toBe('in_progress')
    })

    it('应该在开始任务时设置startedAt时间', () => {
      const task = new Task({ status: 'pending' })
      task.updateStatus('in_progress')
      
      expect(task.startedAt).toBeInstanceOf(Date)
    })

    it('应该在完成任务时设置completedAt时间', () => {
      const task = new Task({ status: 'in_progress' })
      task.updateStatus('completed')
      
      expect(task.completedAt).toBeInstanceOf(Date)
    })

    it('应该验证新状态的有效性', () => {
      const task = new Task({ status: 'pending' })
      task.updateStatus('invalid_status')
      
      expect(task.status).toBe('pending') // 应该保持默认值
    })
  })

  describe('addSubTask', () => {
    it('应该添加子任务', () => {
      const parentTask = new Task({ taskLevel: 1 })
      const subTask = new Task({ title: '子任务' })
      
      parentTask.addSubTask(subTask)
      
      expect(parentTask.subTasks).toHaveLength(1)
      expect(parentTask.subTasks[0]).toBe(subTask)
      expect(subTask.parentId).toBe(parentTask.id)
      expect(subTask.taskLevel).toBe(2)
    })

    it('应该阻止超过10层的任务嵌套', () => {
      const parentTask = new Task({ taskLevel: 10 })
      const subTask = new Task({ title: '子任务' })
      
      expect(() => parentTask.addSubTask(subTask)).toThrow('任务层级不能超过10层')
    })
  })

  describe('removeSubTask', () => {
    it('应该移除指定的子任务', () => {
      const parentTask = new Task()
      const subTask1 = new Task({ title: '子任务1' })
      const subTask2 = new Task({ title: '子任务2' })
      
      parentTask.addSubTask(subTask1)
      parentTask.addSubTask(subTask2)
      
      expect(parentTask.subTasks).toHaveLength(2)
      
      parentTask.removeSubTask(subTask1.id)
      
      expect(parentTask.subTasks).toHaveLength(1)
      expect(parentTask.subTasks[0]).toBe(subTask2)
    })
  })

  describe('toJSON', () => {
    it('应该转换为普通对象', () => {
      const task = new Task(taskData)
      const json = task.toJSON()
      
      expect(json).toBeTypeOf('object')
      expect(json.id).toBe(task.id)
      expect(json.title).toBe(task.title)
      expect(json.importance).toBe(task.importance)
      expect(json.urgency).toBe(task.urgency)
      expect(json.priorityScore).toBe(task.priorityScore)
      expect(json.createdAt).toBeTypeOf('string')
    })

    it('应该正确处理日期字段', () => {
      const now = new Date()
      const task = new Task({
        createdAt: now,
        dueDate: now,
        startedAt: now,
        completedAt: now,
        reminderTime: now
      })
      
      const json = task.toJSON()
      
      expect(json.createdAt).toBe(now.toISOString())
      expect(json.dueDate).toBe(now.toISOString())
      expect(json.startedAt).toBe(now.toISOString())
      expect(json.completedAt).toBe(now.toISOString())
      expect(json.reminderTime).toBe(now.toISOString())
    })

    it('应该正确处理null日期字段', () => {
      const task = new Task()
      const json = task.toJSON()
      
      expect(json.startedAt).toBeNull()
      expect(json.completedAt).toBeNull()
      expect(json.dueDate).toBeNull()
      expect(json.reminderTime).toBeNull()
    })
  })

  describe('fromJSON', () => {
    it('应该从普通对象创建任务实例', () => {
      const data = {
        id: 'test-id',
        title: '测试任务',
        importance: 3,
        urgency: 2,
        status: 'in_progress',
        createdAt: '2024-01-01T10:00:00.000Z',
        estimatedHours: 5
      }
      
      const task = Task.fromJSON(data)
      
      expect(task).toBeInstanceOf(Task)
      expect(task.id).toBe(data.id)
      expect(task.title).toBe(data.title)
      expect(task.importance).toBe(data.importance)
      expect(task.urgency).toBe(data.urgency)
      expect(task.status).toBe(data.status)
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.estimatedHours).toBe(data.estimatedHours)
    })

    it('应该递归创建子任务', () => {
      const data = {
        title: '父任务',
        subTasks: [
          { title: '子任务1', importance: 2, urgency: 1 },
          { title: '子任务2', importance: 1, urgency: 3 }
        ]
      }
      
      const task = Task.fromJSON(data)
      
      expect(task.subTasks).toHaveLength(2)
      expect(task.subTasks[0]).toBeInstanceOf(Task)
      expect(task.subTasks[1]).toBeInstanceOf(Task)
      expect(task.subTasks[0].title).toBe('子任务1')
      expect(task.subTasks[1].title).toBe('子任务2')
    })
  })

  describe('clone', () => {
    it('应该创建任务的深拷贝', () => {
      const originalTask = new Task({
        title: '原始任务',
        importance: 3,
        urgency: 2,
        subTasks: [{ title: '子任务' }]
      })
      
      const clonedTask = originalTask.clone()
      
      expect(clonedTask).toBeInstanceOf(Task)
      expect(clonedTask).not.toBe(originalTask)
      expect(clonedTask.id).not.toBe(originalTask.id) // 应该有新的ID
      expect(clonedTask.title).toBe(originalTask.title)
      expect(clonedTask.importance).toBe(originalTask.importance)
      expect(clonedTask.urgency).toBe(originalTask.urgency)
      
      // 修改克隆任务不应影响原任务
      clonedTask.title = '修改后的任务'
      expect(originalTask.title).toBe('原始任务')
    })
  })
})