import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 从环境变量获取开发模式配置
  const DEV_MODE_ENABLED = import.meta.env.VITE_DEV_MODE === 'true' || 
                          import.meta.env.VITE_MOCK_LOGIN === 'true' ||
                          import.meta.env.DEV;
  
  const DEV_ADMIN_USERNAME = import.meta.env.VITE_DEV_ADMIN_USERNAME || 'admin';
  const DEV_ADMIN_PASSWORD = import.meta.env.VITE_DEV_ADMIN_PASSWORD || 'admin123';

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        if (DEV_MODE_ENABLED) {
          // 开发模式：跳过 token 验证
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // 生产模式：验证 token
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      // Token 无效或过期，清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // 检查是否启用开发模式
    if (DEV_MODE_ENABLED) {
      // 开发模式登录逻辑
      if (credentials.username === DEV_ADMIN_USERNAME && credentials.password === DEV_ADMIN_PASSWORD) {
        const mockUser = {
          id: 1,
          username: DEV_ADMIN_USERNAME,
          email: 'admin@company.com',
          full_name: '系统管理员',
          is_admin: true,
          department: 'IT部门',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };

        const mockToken = 'dev-mock-token-' + Date.now();
        
        localStorage.setItem('auth_token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        setUser(mockUser);
        setIsAuthenticated(true);
        
        return { success: true, user: mockUser };
      } else {
        return {
          success: false,
          error: '用户名或密码错误'
        };
      }
    }
    
    // 生产模式：尝试连接后端 API
    try {
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      // 如果是网络错误且开发模式可用，回退到开发模式
      if (error.code === 'NETWORK_ERROR' && DEV_MODE_ENABLED) {
        if (credentials.username === DEV_ADMIN_USERNAME && credentials.password === DEV_ADMIN_PASSWORD) {
          const mockUser = {
            id: 1,
            username: DEV_ADMIN_USERNAME,
            email: 'admin@company.com',
            full_name: '系统管理员',
            is_admin: true,
            department: 'IT部门',
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          };

          const mockToken = 'fallback-mock-token-' + Date.now();
          
          localStorage.setItem('auth_token', mockToken);
          localStorage.setItem('user', JSON.stringify(mockUser));
          
          setUser(mockUser);
          setIsAuthenticated(true);
          
          return { success: true, user: mockUser };
        } else {
          return {
            success: false,
            error: '用户名或密码错误'
          };
        }
      }
      
      // 非网络错误，返回原始错误信息
      return {
        success: false,
        error: error.response?.data?.message || error.message || '登录失败'
      };
    }
  };

  const logout = async () => {
    try {
      // 清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // 即使登出失败也要清除本地状态
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

