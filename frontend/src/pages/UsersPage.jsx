import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, message, Typography, Space, Tag, Form, Input, Select, Switch, Avatar, Upload } from 'antd';
import { UserOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import '../assets/styles/UsersPage.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Dragger } = Upload;

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    name: '系统管理员',
    email: 'admin@example.com',
    role: '管理员',
    status: '激活',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    createdAt: '2024-01-01 00:00:00',
    lastLogin: '2024-01-15 14:30:00'
  },
  {
    id: 2,
    username: 'manager',
    name: '部门经理',
    email: 'manager@example.com',
    role: '经理',
    status: '激活',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    createdAt: '2024-01-05 10:00:00',
    lastLogin: '2024-01-14 16:20:00'
  },
  {
    id: 3,
    username: 'analyst',
    name: '分析师',
    email: 'analyst@example.com',
    role: '分析师',
    status: '激活',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=analyst',
    createdAt: '2024-01-10 09:15:00',
    lastLogin: '2024-01-15 10:45:00'
  },
  {
    id: 4,
    username: 'user123',
    name: '测试用户',
    email: 'user123@example.com',
    role: '用户',
    status: '禁用',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123',
    createdAt: '2024-01-12 11:30:00',
    lastLogin: '2024-01-13 15:10:00'
  }
];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 实际项目中这里应该是真实的API调用
      // const response = await axios.get('/api/v1/users/');
      // setUsers(response.data);
      
      // 模拟API延迟
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
      setLoading(false);
    }
  };

  // 搜索用户
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // 过滤用户
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchText.toLowerCase()) || 
                           user.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchText.toLowerCase());
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  };

  // 创建用户
  const handleCreateUser = () => {
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // 保存新用户
  const handleSaveUser = async () => {
    try {
      const values = await createForm.validateFields();
      
      // 实际项目中这里应该是真实的API调用
      // const response = await axios.post('/api/v1/users/', values);
      // setUsers([...users, response.data]);
      
      // 模拟添加新用户
      const newUser = {
        id: users.length + 1,
        ...values,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.username}`,
        createdAt: new Date().toLocaleString('zh-CN'),
        lastLogin: '-' // 新用户没有登录记录
      };
      
      setUsers([...users, newUser]);
      message.success('用户创建成功');
      setCreateModalVisible(false);
    } catch (error) {
      console.error('创建用户失败:', error);
      message.error('创建用户失败');
    }
  };

  // 编辑用户
  const handleEditUser = (user) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status === '激活' ? true : false
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      
      // 实际项目中这里应该是真实的API调用
      // await axios.put(`/api/v1/users/${selectedUser.id}/`, values);
      
      // 更新本地状态
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            ...values,
            status: values.status ? '激活' : '禁用'
          };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      message.success('用户更新成功');
      setEditModalVisible(false);
    } catch (error) {
      console.error('更新用户失败:', error);
      message.error('更新用户失败');
    }
  };

  // 删除用户
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    try {
      // 实际项目中这里应该是真实的API调用
      // await axios.delete(`/api/v1/users/${selectedUser.id}/`);
      
      // 更新本地状态
      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      message.success('用户删除成功');
      setDeleteModalVisible(false);
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error('删除用户失败');
    }
  };

  // 切换用户状态
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === '激活' ? '禁用' : '激活';
    try {
      // 实际项目中这里应该是真实的API调用
      // await axios.patch(`/api/v1/users/${user.id}/`, { status: newStatus });
      
      // 更新本地状态
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return { ...u, status: newStatus };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      message.success(`用户已${newStatus}`);
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '用户头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 64,
      render: (avatar) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      )
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div className="user-info">
          <div className="username">{text}</div>
          <div className="email">{record.email}</div>
        </div>
      )
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text) => (
        <Tag color={getRoleColor(text)}>{text}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text, record) => (
        <Space>
          <Tag color={text === '激活' ? 'green' : 'red'}>{text}</Tag>
          <Switch 
            checked={text === '激活'} 
            onChange={() => handleToggleStatus(record)}
            size="small"
          />
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (text) => (
        <Text type={text === '-' ? 'secondary' : 'default'}>{text}</Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEditUser(record)}>编辑</Button>
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger 
            onClick={() => handleDeleteUser(record)}
            disabled={record.username === 'admin'} // 防止删除管理员
          >删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="users-page-container">
      <div className="page-header">
        <div className="header-left">
          <Title level={4}>用户管理</Title>
          <Text className="page-description">管理系统用户和权限</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
          创建用户
        </Button>
      </div>

      <Card className="users-card">
        <div className="filter-section">
          <Search
            placeholder="搜索用户名、姓名或邮箱"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          <div className="filters-row">
            <Select
              placeholder="选择角色"
              allowClear
              style={{ width: 150, marginRight: 12 }}
              onChange={setRoleFilter}
              className="filter-select"
            >
              <Option value="管理员">管理员</Option>
              <Option value="经理">经理</Option>
              <Option value="分析师">分析师</Option>
              <Option value="用户">用户</Option>
            </Select>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: 150, marginRight: 12 }}
              onChange={setStatusFilter}
              className="filter-select"
            >
              <Option value="激活">激活</Option>
              <Option value="禁用">禁用</Option>
            </Select>
            <Button icon={<SearchOutlined />} onClick={fetchUsers} loading={loading}>
              筛选
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredUsers()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          className="users-table"
        />
      </Card>

      {/* 创建用户弹窗 */}
      <Modal
        title="创建用户"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveUser}>
            创建
          </Button>
        ]}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select placeholder="请选择角色">
              <Option value="管理员">管理员</Option>
              <Option value="经理">经理</Option>
              <Option value="分析师">分析师</Option>
              <Option value="用户">用户</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveEdit}>
            保存
          </Button>
        ]}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input disabled placeholder="用户名不可修改" />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select placeholder="请选择角色">
              <Option value="管理员">管理员</Option>
              <Option value="经理">经理</Option>
              <Option value="分析师">分析师</Option>
              <Option value="用户">用户</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="激活" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            取消
          </Button>,
          <Button key="delete" danger onClick={confirmDelete}>
            确认删除
          </Button>
        ]}
      >
        {selectedUser && (
          <div>
            <Text>您确定要删除用户 <Text strong>{selectedUser.username}</Text> 吗？</Text>
            <div className="delete-warning">
              <Text type="danger">此操作不可撤销，删除后用户将无法登录系统。</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// 辅助函数：根据角色返回不同的颜色
const getRoleColor = (role) => {
  const colorMap = {
    '管理员': 'red',
    '经理': 'orange',
    '分析师': 'blue',
    '用户': 'green'
  };
  return colorMap[role] || 'default';
};

export default UsersPage;