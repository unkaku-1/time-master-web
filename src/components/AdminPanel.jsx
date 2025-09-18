import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { 
  Users, 
  Settings, 
  BarChart3, 
  Mail, 
  Server, 
  Shield,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
          管理员后台
        </h1>
        <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
          系统管理和配置中心
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              概览
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="ldap" className="data-[state=active]:bg-blue-600">
              <Server className="h-4 w-4 mr-2" />
              LDAP设置
            </TabsTrigger>
            <TabsTrigger value="smtp" className="data-[state=active]:bg-blue-600">
              <Mail className="h-4 w-4 mr-2" />
              邮件设置
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              系统设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="ldap">
            <LdapTab />
          </TabsContent>

          <TabsContent value="smtp">
            <SmtpTab />
          </TabsContent>

          <TabsContent value="system">
            <SystemTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = () => {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['admin', 'usage'],
    queryFn: () => adminAPI.getUsageReport(30),
  });

  const usage = usageData?.data || {};

  if (isLoading) {
    return (
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
    );
  }

  const departmentData = usage.departments?.map(dept => ({
    name: dept.department,
    users: dept.user_count,
    tasks: dept.task_count,
  })) || [];

  const activityData = usage.users?.map((user, index) => ({
    name: user.user.username,
    tasks: user.total_tasks,
    completed: user.tasks_completed,
    active: user.has_logged_in ? 1 : 0,
  })).slice(0, 10) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户数"
          value={usage.summary?.total_users || 0}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="活跃用户"
          value={usage.summary?.active_users || 0}
          icon={<UserCheck className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="总任务数"
          value={usage.summary?.total_tasks || 0}
          icon={<Activity className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="本月完成"
          value={usage.summary?.tasks_completed_period || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
              部门分布
            </CardTitle>
            <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              各部门用户和任务统计
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
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
                <Bar dataKey="users" fill="#3b82f6" name="用户数" />
                <Bar dataKey="tasks" fill="#10b981" name="任务数" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
              用户活跃度
            </CardTitle>
            <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
              Top 10 活跃用户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="tasks" fill="#f59e0b" name="总任务" />
                <Bar dataKey="completed" fill="#10b981" name="已完成" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            用户详情
          </CardTitle>
          <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            用户登录和使用情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usage.users?.slice(0, 10).map((userStat, index) => (
              <motion.div
                key={userStat.user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    userStat.has_logged_in ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <div>
                    <h4 className="text-white font-medium" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      {userStat.user.full_name || userStat.user.username}
                    </h4>
                    <p className="text-sm text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      {userStat.user.department || '未设置部门'} • {userStat.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="text-white font-medium">{userStat.total_tasks}</div>
                    <div className="text-slate-400">总任务</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-medium">{userStat.tasks_completed}</div>
                    <div className="text-slate-400">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-300 font-medium">
                      {userStat.days_since_login !== null ? `${userStat.days_since_login}天前` : '从未'}
                    </div>
                    <div className="text-slate-400">最后登录</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Users Tab Component
const UsersTab = () => {
  const queryClient = useQueryClient();
  
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers(),
  });

  const syncLdapMutation = useMutation({
    mutationFn: () => adminAPI.syncLdapUsers(),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'users']);
    },
  });

  const users = usersData?.data?.users || [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            用户管理
          </h2>
          <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            管理系统用户和权限
          </p>
        </div>
        <Button
          onClick={() => syncLdapMutation.mutate()}
          disabled={syncLdapMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Server className="h-4 w-4 mr-2" />
          {syncLdapMutation.isPending ? '同步中...' : '同步LDAP用户'}
        </Button>
      </div>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            用户列表
          </CardTitle>
          <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            系统中的所有用户
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-slate-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.3 }}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white font-medium" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                        {user.full_name || user.username}
                      </h4>
                      <p className="text-sm text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                      {user.is_admin ? '管理员' : '普通用户'}
                    </Badge>
                    <div className="text-sm text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      {user.department || '未设置部门'}
                    </div>
                    <div className="text-sm text-slate-400">
                      {user.last_login ? (
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 mr-1 text-green-400" />
                          {new Date(user.last_login).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <UserX className="h-4 w-4 mr-1 text-red-400" />
                          从未登录
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// LDAP Tab Component
const LdapTab = () => {
  const [formData, setFormData] = useState({
    server: '',
    port: 389,
    base_dn: '',
    admin_dn: '',
    admin_password: '',
    username_attribute: 'uid',
    email_attribute: 'mail',
    name_attribute: 'cn',
    department_attribute: 'department',
    use_ssl: false,
  });

  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'ldap-settings'],
    queryFn: () => adminAPI.getLdapSettings(),
    onSuccess: (data) => {
      if (data.data.ldap_config) {
        setFormData({ ...formData, ...data.data.ldap_config });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => adminAPI.updateLdapSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'ldap-settings']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
          LDAP配置
        </h2>
        <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
          配置LDAP服务器以实现企业用户认证
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            LDAP服务器设置
          </CardTitle>
          <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            配置LDAP连接参数和用户属性映射
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="server" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    LDAP服务器地址 *
                  </Label>
                  <Input
                    id="server"
                    value={formData.server}
                    onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                    placeholder="ldap.company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="port" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    端口 *
                  </Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="base_dn" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    Base DN *
                  </Label>
                  <Input
                    id="base_dn"
                    value={formData.base_dn}
                    onChange={(e) => setFormData({ ...formData, base_dn: e.target.value })}
                    placeholder="ou=users,dc=company,dc=com"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="admin_dn" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    管理员DN *
                  </Label>
                  <Input
                    id="admin_dn"
                    value={formData.admin_dn}
                    onChange={(e) => setFormData({ ...formData, admin_dn: e.target.value })}
                    placeholder="cn=admin,dc=company,dc=com"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="admin_password" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    管理员密码
                  </Label>
                  <Input
                    id="admin_password"
                    type="password"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="留空保持不变"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-lg font-medium text-white mb-4" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
                  属性映射
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="username_attribute" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      用户名属性
                    </Label>
                    <Input
                      id="username_attribute"
                      value={formData.username_attribute}
                      onChange={(e) => setFormData({ ...formData, username_attribute: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_attribute" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      邮箱属性
                    </Label>
                    <Input
                      id="email_attribute"
                      value={formData.email_attribute}
                      onChange={(e) => setFormData({ ...formData, email_attribute: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name_attribute" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      姓名属性
                    </Label>
                    <Input
                      id="name_attribute"
                      value={formData.name_attribute}
                      onChange={(e) => setFormData({ ...formData, name_attribute: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="department_attribute" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                      部门属性
                    </Label>
                    <Input
                      id="department_attribute"
                      value={formData.department_attribute}
                      onChange={(e) => setFormData({ ...formData, department_attribute: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="use_ssl"
                  checked={formData.use_ssl}
                  onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                />
                <Label htmlFor="use_ssl" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                  使用SSL连接
                </Label>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// SMTP Tab Component
const SmtpTab = () => {
  const [formData, setFormData] = useState({
    server: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    use_tls: true,
    use_ssl: false,
  });

  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'smtp-settings'],
    queryFn: () => adminAPI.getSmtpSettings(),
    onSuccess: (data) => {
      if (data.data.smtp_config) {
        setFormData({ ...formData, ...data.data.smtp_config });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => adminAPI.updateSmtpSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'smtp-settings']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
          邮件配置
        </h2>
        <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
          配置SMTP服务器以发送系统通知邮件
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            SMTP服务器设置
          </CardTitle>
          <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            配置邮件服务器连接参数
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="server" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    SMTP服务器 *
                  </Label>
                  <Input
                    id="server"
                    value={formData.server}
                    onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="port" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    端口 *
                  </Label>
                  <Input
                    id="port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    用户名 *
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="your-email@company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    密码
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="留空保持不变"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="from_email" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    发件人邮箱 *
                  </Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    placeholder="noreply@company.com"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_tls"
                    checked={formData.use_tls}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_tls: checked })}
                  />
                  <Label htmlFor="use_tls" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    使用TLS加密
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="use_ssl"
                    checked={formData.use_ssl}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                  />
                  <Label htmlFor="use_ssl" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    使用SSL加密
                  </Label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// System Tab Component
const SystemTab = () => {
  const [formData, setFormData] = useState({
    company_name: 'Your Company',
    system_name: 'Time Master Enterprise',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
  });

  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['admin', 'general-settings'],
    queryFn: () => adminAPI.getGeneralSettings(),
    onSuccess: (data) => {
      if (data.data.general_config) {
        setFormData({ ...formData, ...data.data.general_config });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => adminAPI.updateGeneralSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'general-settings']);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
          系统设置
        </h2>
        <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
          配置系统基本信息和显示格式
        </p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            基本设置
          </CardTitle>
          <CardDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            配置系统名称和显示格式
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company_name" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    公司名称
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="system_name" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    系统名称
                  </Label>
                  <Input
                    id="system_name"
                    value={formData.system_name}
                    onChange={(e) => setFormData({ ...formData, system_name: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    时区
                  </Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    placeholder="Asia/Shanghai"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="date_format" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    日期格式
                  </Label>
                  <Input
                    id="date_format"
                    value={formData.date_format}
                    onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="time_format" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    时间格式
                  </Label>
                  <Input
                    id="time_format"
                    value={formData.time_format}
                    onChange={(e) => setFormData({ ...formData, time_format: e.target.value })}
                    placeholder="24h 或 12h"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
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
    purple: 'text-purple-400 bg-purple-400/10',
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
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

export default AdminPanel;

