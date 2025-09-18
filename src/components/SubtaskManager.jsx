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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const SubtaskManager = ({ parentTask, isOpen, onClose }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState(null);

  const queryClient = useQueryClient();

  const { data: subtasksData, isLoading } = useQuery({
    queryKey: ['subtasks', parentTask.id],
    queryFn: () => tasksAPI.getSubtasks(parentTask.id),
    enabled: isOpen,
  });

  const subtasks = subtasksData?.data?.subtasks || [];

  // Create subtask mutation
  const createSubtaskMutation = useMutation({
    mutationFn: (subtaskData) => tasksAPI.createSubtask(parentTask.id, subtaskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['subtasks', parentTask.id]);
      queryClient.invalidateQueries(['tasks']);
      setIsCreateDialogOpen(false);
    },
  });

  // Update subtask mutation
  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, ...subtask }) => tasksAPI.updateSubtask(id, subtask),
    onSuccess: () => {
      queryClient.invalidateQueries(['subtasks', parentTask.id]);
      queryClient.invalidateQueries(['tasks']);
    },
  });

  // Delete subtask mutation
  const deleteSubtaskMutation = useMutation({
    mutationFn: tasksAPI.deleteSubtask,
    onSuccess: () => {
      queryClient.invalidateQueries(['subtasks', parentTask.id]);
      queryClient.invalidateQueries(['tasks']);
    },
  });

  const handleStatusChange = (subtask, newStatus) => {
    updateSubtaskMutation.mutate({
      id: subtask.id,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    });
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

  const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-red-400';
    if (priority >= 5) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            子任务管理 - {parentTask.title}
          </DialogTitle>
          <DialogDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            管理主任务的子任务，每个子任务都可以独立设置截止日期和优先级
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              共 {subtasks.length} 个子任务，已完成 {subtasks.filter(s => s.status === 'completed').length} 个
            </div>
            
            <CreateSubtaskDialog 
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onSubmit={createSubtaskMutation.mutate}
              isLoading={createSubtaskMutation.isPending}
              parentTask={parentTask}
            />
          </div>

          {/* Subtasks List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-slate-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {subtasks.map((subtask, index) => (
                  <SubtaskCard
                    key={subtask.id}
                    subtask={subtask}
                    index={index}
                    onStatusChange={handleStatusChange}
                    onEdit={setSelectedSubtask}
                    onDelete={(id) => deleteSubtaskMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
              
              {subtasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-slate-400 mb-4">
                    <PauseCircle className="h-12 w-12 mx-auto mb-4" />
                    <p style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      还没有子任务，创建第一个子任务吧！
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    创建子任务
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Edit Subtask Dialog */}
        {selectedSubtask && (
          <EditSubtaskDialog
            subtask={selectedSubtask}
            onClose={() => setSelectedSubtask(null)}
            onSubmit={(data) => {
              updateSubtaskMutation.mutate({ id: selectedSubtask.id, ...data });
              setSelectedSubtask(null);
            }}
            isLoading={updateSubtaskMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// Subtask Card Component
const SubtaskCard = ({ subtask, index, onStatusChange, onEdit, onDelete }) => {
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

  const isOverdue = subtask.due_date && new Date(subtask.due_date) < new Date() && subtask.status !== 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className={`bg-slate-700/50 border-slate-600 hover:border-slate-500 transition-colors ${
        isOverdue ? 'border-red-500/50' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Priority Indicator */}
              <div className={`w-1 h-12 rounded-full ${getPriorityColor(subtask.priority)}`}></div>
              
              <div className="flex-1 min-w-0">
                {/* Subtask Header */}
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(subtask.status)}
                  
                  <h4 className="text-white font-medium truncate" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    {subtask.title}
                  </h4>
                  
                  <Badge variant={subtask.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {subtask.status === 'completed' ? '已完成' : 
                     subtask.status === 'in_progress' ? '进行中' : '待开始'}
                  </Badge>

                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      逾期
                    </Badge>
                  )}
                </div>

                {/* Subtask Description */}
                {subtask.description && (
                  <p className="text-slate-400 text-sm mb-2 line-clamp-1" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    {subtask.description}
                  </p>
                )}

                {/* Subtask Meta */}
                <div className="flex items-center space-x-4 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <span>优先级: {Math.round(subtask.priority || 0)}</span>
                  </div>
                  
                  {subtask.due_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(subtask.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Select
                value={subtask.status}
                onValueChange={(value) => onStatusChange(subtask, value)}
              >
                <SelectTrigger className="w-24 h-8 bg-slate-600 border-slate-500 text-white text-xs">
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
                onClick={() => onEdit(subtask)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <Edit className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(subtask.id)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Create Subtask Dialog Component
const CreateSubtaskDialog = ({ isOpen, onOpenChange, onSubmit, isLoading, parentTask }) => {
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
          创建子任务
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            创建子任务
          </DialogTitle>
          <DialogDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            为 "{parentTask.title}" 创建子任务
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              子任务标题 *
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
              子任务描述
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              rows={2}
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
              {isLoading ? '创建中...' : '创建子任务'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Subtask Dialog Component
const EditSubtaskDialog = ({ subtask, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: subtask.title,
    description: subtask.description || '',
    importance: subtask.importance,
    urgency: subtask.urgency,
    due_date: subtask.due_date ? new Date(subtask.due_date).toISOString().slice(0, 16) : '',
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
            编辑子任务
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              子任务标题 *
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
              子任务描述
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              rows={2}
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

export default SubtaskManager;

