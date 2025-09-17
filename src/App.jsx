import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Plus, Search, Filter, BarChart3, Settings, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StorageService } from './lib/storageService.js';
import { PriorityCalculator } from './lib/priorityCalculator.js';
import { Task } from './lib/taskModel.js';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('tasks'); // 'tasks', 'dashboard', 'settings'

  // 新任务表单状态
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    importance: 2,
    urgency: 2,
    dueDate: '',
    estimatedHours: 0
  });

  // 加载任务数据
  useEffect(() => {
    loadTasks();
  }, []);

  // 过滤和搜索任务
  useEffect(() => {
    let filtered = [...tasks];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // 排序
    filtered = PriorityCalculator.sortTasks(filtered, {
      sortBy: 'priority',
      groupByStatus: true,
      prioritizeOverdue: true
    });

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, filterStatus]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const loadedTasks = await StorageService.getAllTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const taskData = {
        ...newTask,
        importance: parseInt(newTask.importance),
        urgency: parseInt(newTask.urgency),
        estimatedHours: parseFloat(newTask.estimatedHours) || 0,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null
      };

      const createdTask = await StorageService.createTask(taskData);
      setTasks(prev => [...prev, createdTask]);
      
      // 重置表单
      setNewTask({
        title: '',
        description: '',
        importance: 2,
        urgency: 2,
        dueDate: '',
        estimatedHours: 0
      });
      
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('创建任务失败：' + error.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const updatedTask = await StorageService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('确定要删除这个任务吗？')) {
      try {
        await StorageService.deleteTask(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const overdue = tasks.filter(task => PriorityCalculator.isOverdue(task)).length;

    return { total, completed, inProgress, pending, overdue };
  };

  const stats = getTaskStats();

  const renderTaskCard = (task) => (
    <Card key={task.id} className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{task.title}</CardTitle>
            <CardDescription className="mt-1">{task.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <Badge className={`${task.getPriorityColor()} text-white`}>
              {task.getPriorityLabel()}
            </Badge>
            <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
              {task.getStatusLabel()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>编号: {task.taskNumber}</span>
            <span>创建: {task.createdAt.toLocaleDateString()}</span>
            {task.dueDate && (
              <span className={task.isOverdue() ? 'text-red-500' : ''}>
                截止: {task.dueDate.toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {task.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateTaskStatus(task.id, 
                  task.status === 'pending' ? 'in_progress' : 'completed'
                )}
              >
                {task.status === 'pending' ? '开始' : '完成'}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteTask(task.id)}
            >
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期任务</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近任务</CardTitle>
          <CardDescription>按优先级排序的最新任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${task.getPriorityColor()} text-white`}>
                    {task.getPriorityLabel()}
                  </Badge>
                  <Badge variant="secondary">{task.getStatusLabel()}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Time Master</h1>
              <p className="text-muted-foreground">智能任务管理工具</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setCurrentView('dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                仪表板
              </Button>
              <Button
                variant={currentView === 'tasks' ? 'default' : 'outline'}
                onClick={() => setCurrentView('tasks')}
              >
                任务列表
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    新建任务
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>创建新任务</DialogTitle>
                    <DialogDescription>
                      填写任务信息，系统将自动计算优先级
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">任务标题</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="输入任务标题"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">任务描述</Label>
                      <Textarea
                        id="description"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="输入任务描述"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="importance">重要度</Label>
                        <Select
                          value={newTask.importance.toString()}
                          onValueChange={(value) => setNewTask(prev => ({ ...prev, importance: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">低</SelectItem>
                            <SelectItem value="2">中</SelectItem>
                            <SelectItem value="3">高</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="urgency">紧急度</Label>
                        <Select
                          value={newTask.urgency.toString()}
                          onValueChange={(value) => setNewTask(prev => ({ ...prev, urgency: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">低</SelectItem>
                            <SelectItem value="2">中</SelectItem>
                            <SelectItem value="3">高</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">截止日期</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="estimatedHours">预估工时（小时）</Label>
                      <Input
                        id="estimatedHours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={newTask.estimatedHours}
                        onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
                      创建任务
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {currentView === 'dashboard' ? (
          renderDashboard()
        ) : (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索任务..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待办</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Task List */}
            <div>
              {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-2">暂无任务</h3>
                      <p className="text-muted-foreground mb-4">
                        {searchTerm || filterStatus !== 'all' 
                          ? '没有找到匹配的任务' 
                          : '开始创建您的第一个任务吧！'
                        }
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        创建任务
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {filteredTasks.map(renderTaskCard)}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

