import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, User, Lock, Building } from 'lucide-react';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(credentials);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('登录失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Time Master" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
            Time Master Enterprise
          </h1>
          <p className="text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            企业级任务管理系统
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white" style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}>
                登录
              </CardTitle>
              <CardDescription className="text-center text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                使用您的企业账号登录系统
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                      <AlertDescription style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-slate-300" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="请输入用户名"
                      value={credentials.username}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                      style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="请输入密码"
                      value={credentials.password}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                      style={{ fontFamily: 'Nunito, "Noto Sans SC", sans-serif' }}
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                    disabled={isLoading}
                    style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      '登录'
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Admin Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600"
              >
                <div className="flex items-center mb-2">
                  <Building className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm font-medium text-slate-300" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                    管理员登录
                  </span>
                </div>
                <p className="text-xs text-slate-400" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
                  默认管理员账号：admin / admin4fmm
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-slate-500" style={{ fontFamily: '"Noto Sans SC", Nunito, sans-serif' }}>
            © 2025 Time Master Enterprise. 保留所有权利。
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

