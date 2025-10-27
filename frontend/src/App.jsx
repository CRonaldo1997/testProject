import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Spin, message } from 'antd';
import { FileTextOutlined, DatabaseOutlined, UserOutlined, HomeOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import './App.css';

// 导入页面组件
import HomePage from './pages/HomePage';
import DocumentsPage from './pages/DocumentsPage';
import ExtractionsPage from './pages/ExtractionsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

// 导入认证提供者和hook
import { AuthProvider, useAuth } from './contexts/AuthContext';

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// 主布局组件
const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const location = window.location.pathname;
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = () => {
    logout();
    message.success('退出登录成功');
  };

  return (
    <Layout className="main-layout">
      <Header className="header">
        <div className="logo" />
        <div className="header-right">
          {currentUser ? (
            <Menu theme="dark" mode="horizontal" selectedKeys={[]}>
              <SubMenu key="user" icon={<UserOutlined />} title={currentUser.username}>
                <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>退出登录</Menu.Item>
              </SubMenu>
            </Menu>
          ) : null}
        </div>
      </Header>
      <Layout>
        <Sider width={200} theme="dark" collapsible collapsed={collapsed} onCollapse={setCollapsed}>
          <Menu
              mode="inline"
              selectedKeys={[location]}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.Item key="/" icon={<HomeOutlined />}>
                <a href="/">首页</a>
              </Menu.Item>
              <Menu.Item key="/documents" icon={<FileTextOutlined />}>
                <a href="/documents">文档管理</a>
              </Menu.Item>
              <Menu.Item key="/extractions" icon={<DatabaseOutlined />}>
                <a href="/extractions">提取管理</a>
              </Menu.Item>
              <Menu.Item key="/users" icon={<UserOutlined />}>
                <a href="/users">用户管理</a>
              </Menu.Item>
              <Menu.Item key="/settings" icon={<SettingOutlined />}>
                <a href="/settings">系统设置</a>
              </Menu.Item>
            </Menu>
        </Sider>
        <Layout className="content-layout">
          <Content className="content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/documents" element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              } />
              <Route path="/extractions" element={
                <ProtectedRoute>
                  <ExtractionsPage />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

// 应用主组件
function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
