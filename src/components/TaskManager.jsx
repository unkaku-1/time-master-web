import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import SubtaskManager from './SubtaskManager';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  ChevronDown,
  ChevronRight,
  List
} from 'lucide-react';

const TaskManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [subtaskManagerTask, setSubtaskManagerTask] = useState(null);

  const queryClient = useQueryClient();

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { parent_only: true }],
    queryFn: () => tasksAPI.getTasks({ parent_only: true }),
  });

  const tasks = tasksData?.data?.tasks || [];

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    let filtered = [...tasks];

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    return filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [tasks, searchTerm, filterStatus]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: tasksAPI.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setIsCreateDialogOpen(false);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, ...task }) => tasksAPI.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: tasksAPI.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const toggleTaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleStatusChange = (task, newStatus) => {
    updateTaskMutation.mutate({
      id: task.id,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen" data-testid="task-manager">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            任务管理
          </h1>
          <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            管理您的任务和子任务
          </p>
        </div>
        
        <CreateTaskDialog 
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={createTaskMutation.mutate}
          isLoading={createTaskMutation.isPending}
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="搜索任务..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
            style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待开始</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <AnimatePresence>
          {filteredTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              isExpanded={expandedTasks.has(task.id)}
              onToggleExpansion={() => toggleTaskExpansion(task.id)}
              onStatusChange={handleStatusChange}
              onEdit={setSelectedTask}
              onDelete={(id) => deleteTaskMutation.mutate(id)}
              onManageSubtasks={setSubtaskManagerTask}
            />
          ))}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-slate-400 mb-4">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                {searchTerm || filterStatus !== 'all' ? '没有找到匹配的任务' : '还没有任务，创建第一个任务吧！'}
              </p>
            </div>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                创建任务
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Edit Task Dialog */}
      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmit={(data) => {
            updateTaskMutation.mutate({ id: selectedTask.id, ...data });
            setSelectedTask(null);
          }}
          isLoading={updateTaskMutation.isPending}
        />
      )}

      {/* Subtask Manager */}
      <SubtaskManager
        parentTask={subtaskManagerTask}
        isOpen={!!subtaskManagerTask}
        onClose={() => setSubtaskManagerTask(null)}
      />
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, index, isExpanded, onToggleExpansion, onStatusChange, onEdit, onDelete, onManageSubtasks }) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  
  const { data: subtasksData } = useQuery({
    queryKey: ['subtasks', task.id],
    queryFn: () => tasksAPI.getSubtasks(task.id),
    enabled: isExpanded,
  });

  const subtasks = subtasksData?.data?.subtasks || [];

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'bg-red-500';
    if (priority >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <PauseCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {/* Priority Indicator */}
              <div className={`w-1 h-16 rounded-full ${getPriorityColor(task.priority)}`}></div>
              
              <div className="flex-1 min-w-0">
                {/* Task Header */}
                <div className="flex items-center space-x-2 mb-2">
                  {subtasks.length > 0 && (
                    <button
                      onClick={onToggleExpansion}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  
                  <h3 className="text-lg font-semibold text-white truncate" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    {task.title}
                  </h3>
                  
                  <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                    {task.status === 'completed' ? '已完成' : 
                     task.status === 'in_progress' ? '进行中' : '待开始'}
                  </Badge>
                </div>

                {/* Task Description */}
                {task.description && (
                  <p className="text-slate-400 mb-3 line-clamp-2" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    {task.description}
                  </p>
                )}

                {/* Task Meta */}
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(task.status)}
                    <span>优先级: {Math.round(task.priority || 0)}</span>
                  </div>
                  
                  {task.due_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {subtasks.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <span>{subtasks.filter(s => s.status === 'completed').length}/{subtasks.length} 子任务</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onManageSubtasks(task)}
                className="text-slate-400 hover:text-white"
                title="管理子任务"
              >
                <List className="h-4 w-4" />
              </Button>

              <Select
                value={task.status}
                onValueChange={(value) => onStatusChange(task, value)}
              >
                <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="pending">待开始</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                className="text-slate-400 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Subtasks */}
          <AnimatePresence>
            {isExpanded && subtasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pl-6 border-l-2 border-slate-700"
              >
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(subtask.status)}
                        <div>
                          <h4 className="text-white font-medium" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                            {subtask.title}
                          </h4>
                          {subtask.due_date && (
                            <div className="flex items-center text-xs text-slate-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(subtask.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={subtask.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        优先级 {Math.round(subtask.priority || 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Create Task Dialog Component
const CreateTaskDialog = ({ isOpen, onOpenChange, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    importance: 2,
    urgency: 2,
    due_date: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      importance: 2,
      urgency: 2,
      due_date: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          创建任务
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            创建新任务
          </DialogTitle>
          <DialogDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            填写任务信息，系统将自动计算优先级
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              任务标题 *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              任务描述
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                重要度
              </Label>
              <Select
                value={formData.importance.toString()}
                onValueChange={(value) => setFormData({ ...formData, importance: parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">低</SelectItem>
                  <SelectItem value="2">中</SelectItem>
                  <SelectItem value="3">高</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                紧急度
              </Label>
              <Select
                value={formData.urgency.toString()}
                onValueChange={(value) => setFormData({ ...formData, urgency: parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">低</SelectItem>
                  <SelectItem value="2">中</SelectItem>
                  <SelectItem value="3">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="due_date" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              截止日期
            </Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '创建中...' : '创建任务'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Task Dialog Component (similar to Create but with existing data)
const EditTaskDialog = ({ task, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    importance: task.importance,
    urgency: task.urgency,
    due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            编辑任务
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              任务标题 *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              任务描述
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                重要度
              </Label>
              <Select
                value={formData.importance.toString()}
                onValueChange={(value) => setFormData({ ...formData, importance: parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">低</SelectItem>
                  <SelectItem value="2">中</SelectItem>
                  <SelectItem value="3">高</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                紧急度
              </Label>
              <Select
                value={formData.urgency.toString()}
                onValueChange={(value) => setFormData({ ...formData, urgency: parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1">低</SelectItem>
                  <SelectItem value="2">中</SelectItem>
                  <SelectItem value="3">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="due_date" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              截止日期
            </Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskManager;

