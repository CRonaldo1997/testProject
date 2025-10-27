import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Avatar, Tag, Progress, Spin } from 'antd';
import { FileTextOutlined, DatabaseOutlined, AuditOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import '../assets/styles/HomePage.css';

const { Title, Text } = Typography;

// 模拟数据
const mockStatistics = {
  totalDocuments: 128,
  pendingExtractions: 14,
  completedExtractions: 326,
  activeUsers: 5
};

const mockRecentActivities = [
  {
    id: 1,
    user: '管理员',
    action: '上传了新文档',
    document: '合同文档.pdf',
    time: '10分钟前',
    status: 'success'
  },
  {
    id: 2,
    user: '张三',
    action: '审核了提取结果',
    document: '发票文件.jpg',
    time: '25分钟前',
    status: 'processing'
  },
  {
    id: 3,
    user: '李四',
    action: '创建了新的提取模板',
    document: '财务模板',
    time: '1小时前',
    status: 'default'
  },
  {
    id: 4,
    user: '王五',
    action: '导出了数据报表',
    document: '月度统计.xlsx',
    time: '2小时前',
    status: 'warning'
  }
];

const mockProgressData = [
  { name: '文档处理', value: 65 },
  { name: '信息提取', value: 82 },
  { name: '数据验证', value: 45 }
];

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(mockStatistics);
  const [recentActivities, setRecentActivities] = useState(mockRecentActivities);

  useEffect(() => {
    // 模拟API请求
    const fetchData = async () => {
      try {
        // 实际项目中这里应该是真实的API调用
        // const response = await axios.get('/api/v1/dashboard/statistics');
        // setStatistics(response.data);
        
        // 模拟加载延迟
        setTimeout(() => {
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('获取首页数据失败:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="homepage-container">
      <div className="page-header">
        <Title level={4}>控制面板</Title>
        <Text className="page-description">系统数据概览和最新活动</Text>
      </div>

      <Row gutter={[16, 16]} className="statistics-row">
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="总文档数"
              value={statistics.totalDocuments}
              prefix={<FileTextOutlined />}
              suffix="份"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理提取"
              value={statistics.pendingExtractions}
              prefix={<DatabaseOutlined />}
              suffix="项"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="已完成提取"
              value={statistics.completedExtractions}
              prefix={<AuditOutlined />}
              suffix="项"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="活跃用户"
              value={statistics.activeUsers}
              prefix={<UserOutlined />}
              suffix="人"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="处理进度" className="progress-card">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : (
              <div className="progress-list">
                {mockProgressData.map((item) => (
                  <div key={item.name} className="progress-item">
                    <div className="progress-header">
                      <Text className="progress-name">{item.name}</Text>
                      <Text className="progress-value">{item.value}%</Text>
                    </div>
                    <Progress percent={item.value} strokeColor={getProgressColor(item.value)} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="最近活动" className="activities-card">
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : (
              <List
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item className="activity-item">
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div className="activity-title">
                          <Text strong>{item.user}</Text>
                          <Text> {item.action}</Text>
                          <Tag color={getStatusColor(item.status)} className="ml-2">{item.document}</Tag>
                        </div>
                      }
                      description={
                        <div className="activity-time">
                          <ClockCircleOutlined className="time-icon" />
                          <Text className="time-text">{item.time}</Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 辅助函数：根据进度值返回不同的颜色
const getProgressColor = (value) => {
  if (value < 30) return '#ff4d4f';
  if (value < 70) return '#faad14';
  return '#52c41a';
};

// 辅助函数：根据状态返回不同的颜色
const getStatusColor = (status) => {
  switch (status) {
    case 'success':
      return 'green';
    case 'processing':
      return 'blue';
    case 'warning':
      return 'orange';
    default:
      return 'default';
  }
};

export default HomePage;