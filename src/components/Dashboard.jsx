import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { tasksAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.getTasks(),
  });

  const tasks = tasksData?.data?.tasks || [];

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && t.status !== 'completed';
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate
    };
  }, [tasks]);

  // Prepare chart data
  const priorityData = React.useMemo(() => {
    const priorities = { high: 0, medium: 0, low: 0 };
    tasks.forEach(task => {
      const priority = task.priority || 0;
      if (priority >= 8) priorities.high++;
      else if (priority >= 5) priorities.medium++;
      else priorities.low++;
    });

    return [
      { name: '高优先级', value: priorities.high, color: '#ef4444' },
      { name: '中优先级', value: priorities.medium, color: '#f59e0b' },
      { name: '低优先级', value: priorities.low, color: '#10b981' },
    ];
  }, [tasks]);

  const weeklyData = React.useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const data = days.map(day => ({
      name: day,
      completed: Math.floor(Math.random() * 10) + 1, // Mock data
      created: Math.floor(Math.random() * 15) + 1,
    }));
    return data;
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-600 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen" data-testid="dashboard">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
          仪表板
        </h1>
        <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
          欢迎回来！这里是您的任务概览。
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="总任务数"
          value={stats.total}
          icon={<Target className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={<Activity className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="逾期任务"
          value={stats.overdue}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="red"
        />
      </motion.div>

      {/* Progress and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
                完成进度
              </CardTitle>
              <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                本月任务完成情况
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                  完成率
                </span>
                <span className="text-2xl font-bold text-white">
                  {stats.completionRate}%
                </span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-green-400">{stats.completed}</div>
                  <div className="text-xs text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>已完成</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-yellow-400">{stats.inProgress}</div>
                  <div className="text-xs text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>进行中</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-400">{stats.pending}</div>
                  <div className="text-xs text-slate-300" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>待开始</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
                优先级分布
              </CardTitle>
              <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                任务优先级统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-4">
                {priorityData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
              本周活动
            </CardTitle>
            <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              任务创建和完成趋势
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completed" fill="#10b981" name="已完成" />
                <Bar dataKey="created" fill="#3b82f6" name="新创建" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
              最近任务
            </CardTitle>
            <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              最新创建或更新的任务
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-400' :
                      task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-slate-400'
                    }`}></div>
                    <div>
                      <h4 className="text-white font-medium" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                        {task.title}
                      </h4>
                      <p className="text-sm text-slate-300" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                        {task.description?.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      task.priority >= 8 ? 'destructive' :
                      task.priority >= 5 ? 'default' : 'secondary'
                    }>
                      优先级 {Math.round(task.priority || 0)}
                    </Badge>
                    {task.due_date && (
                      <div className="flex items-center text-sm text-slate-300">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-green-400 bg-green-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
    red: 'text-red-400 bg-red-400/10',
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300 mb-1" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              {title}
            </p>
            <p className="text-2xl font-bold text-white">
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;

