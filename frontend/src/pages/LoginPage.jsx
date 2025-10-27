import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/LoginPage.css';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const result = await login(values.username, values.password);
      
      if (result.success) {
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(result.error || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('登录时发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 开发环境下的快速登录功能
  const quickLogin = async () => {
    setLoading(true);
    try {
      // 模拟登录成功
      // 在实际环境中应该注释掉这个功能
      login('admin', 'admin');
      message.success('开发环境快速登录成功');
      navigate('/');
    } catch (error) {
      message.error('快速登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2} className="login-title">信息抽取与管理系统</Title>
          <Text className="login-subtitle">登录您的账号</Text>
        </div>
        
        <Divider className="login-divider" />
        
        <Form
          form={form}
          name="login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="login-button"
              size="large"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        {/* 开发环境下的快速登录按钮 */}
        <div className="quick-login-section">
          <Button
            type="link"
            onClick={quickLogin}
            disabled={loading}
            className="quick-login-button"
          >
            开发环境快速登录
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;