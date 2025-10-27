import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证上下文提供者组件
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查用户登录状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // 设置axios默认请求头
          axios.defaults.headers.common['Authorization'] = `Token ${token}`;
          
          // 获取用户信息
          const response = await axios.get('/api/v1/user/me');
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录方法
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/v1/auth/login/', {
        username,
        password
      });
      
      const { token, user } = response.data;
      
      // 保存token到localStorage
      localStorage.setItem('token', token);
      
      // 设置axios默认请求头
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('登录失败:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || '登录失败，请检查用户名和密码' 
      };
    }
  };

  // 登出方法
  const logout = () => {
    // 移除localStorage中的token
    localStorage.removeItem('token');
    
    // 移除axios默认请求头
    delete axios.defaults.headers.common['Authorization'];
    
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 自定义hook，用于在组件中使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

export { AuthContext };