import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Switch, Select, InputNumber, Upload, Divider, Collapse, notification } from 'antd';
import { SaveOutlined, UploadOutlined, ReloadOutlined, CheckOutlined, AlertOutlined, PlusOutlined } from '@ant-design/icons';
import '../assets/styles/SettingsPage.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Dragger } = Upload;
const { Panel } = Collapse;

const SettingsPage = () => {
  const [settingsForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  // 模拟系统设置数据
  const initialSettings = {
    systemName: '文档智能处理系统',
    apiTimeout: 30,
    maxFileSize: 100,
    fileFormats: ['pdf', 'docx', 'xlsx', 'jpg', 'png'],
    autoSaveInterval: 60,
    enableNotifications: true,
    enableAutoBackup: true,
    backupFrequency: 'daily',
    logLevel: 'info',
    theme: 'light',
    language: 'zh-CN',
    emailSMTP: 'smtp.example.com',
    emailPort: 587,
    emailUsername: 'notifications@example.com',
    emailPassword: 'password123',
    enableEmailNotifications: true
  };

  useEffect(() => {
    // 加载设置
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 实际项目中这里应该是真实的API调用
      // const response = await axios.get('/api/v1/settings/');
      // settingsForm.setFieldsValue(response.data);
      
      // 模拟API延迟
      setTimeout(() => {
        settingsForm.setFieldsValue(initialSettings);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败');
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const values = await settingsForm.validateFields();
      setLoading(true);
      
      // 实际项目中这里应该是真实的API调用
      // await axios.put('/api/v1/settings/', values);
      
      // 模拟API延迟
      setTimeout(() => {
        message.success('设置保存成功');
        setLoading(false);
        
        // 模拟通知
        notification.success({
          message: '设置已更新',
          description: '系统设置已成功保存，部分设置可能需要刷新页面才能生效。',
          icon: <CheckOutlined style={{ color: '#52c41a' }} />,
        });
      }, 1000);
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    setLoading(true);
    try {
      // 实际项目中这里应该是真实的API调用
      // await axios.post('/api/v1/settings/reset/');
      
      // 模拟API延迟
      setTimeout(() => {
        settingsForm.setFieldsValue(initialSettings);
        message.success('设置已重置为默认值');
        setLoading(false);
        setResetModalVisible(false);
      }, 1000);
    } catch (error) {
      console.error('重置设置失败:', error);
      message.error('重置设置失败');
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'logo',
    multiple: false,
    action: '/api/v1/settings/upload-logo/',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} 文件上传成功`);
      } else if (status === 'error') {
        message.error(`${info.file.name} 文件上传失败`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <div className="settings-page-container">
      <div className="page-header">
        <div className="header-left">
          <Title level={4}>系统设置</Title>
          <Text className="page-description">配置系统参数和个性化选项</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadSettings} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveSettings} loading={loading}>
            保存设置
          </Button>
        </Space>
      </div>

      <Card className="settings-card">
        <Form form={settingsForm} layout="vertical" className="settings-form">
          <Collapse ghost defaultActiveKey={['1']} className="settings-sections">
            {/* 基本设置 */}
            <Panel header="基本设置" key="1" className="settings-panel">
              <div className="settings-grid">
                <Form.Item name="systemName" label="系统名称" rules={[{ required: true }]} className="settings-item">
                  <Input placeholder="请输入系统名称" />
                </Form.Item>
                
                <Form.Item name="theme" label="主题" className="settings-item">
                  <Select placeholder="选择系统主题">
                    <Option value="light">浅色模式</Option>
                    <Option value="dark">深色模式</Option>
                    <Option value="auto">跟随系统</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="language" label="语言" className="settings-item">
                  <Select placeholder="选择系统语言">
                    <Option value="zh-CN">简体中文</Option>
                    <Option value="en-US">English</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="enableNotifications" label="启用通知" valuePropName="checked" className="settings-item">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </div>
              
              <div className="logo-upload-section">
                <Title level={5}>系统Logo</Title>
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持单个文件上传，建议大小不超过2MB，格式为PNG、JPG
                  </p>
                </Dragger>
              </div>
            </Panel>

            {/* 文件处理设置 */}
            <Panel header="文件处理设置" key="2" className="settings-panel">
              <div className="settings-grid">
                <Form.Item name="maxFileSize" label="最大文件大小 (MB)" rules={[{ required: true }]} className="settings-item">
                  <InputNumber min={1} max={1000} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item name="apiTimeout" label="API超时时间 (秒)" rules={[{ required: true }]} className="settings-item">
                  <InputNumber min={5} max={300} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item name="autoSaveInterval" label="自动保存间隔 (秒)" rules={[{ required: true }]} className="settings-item">
                  <InputNumber min={10} max={300} style={{ width: '100%' }} />
                </Form.Item>
              </div>
              
              <Form.Item label="支持的文件格式">
                <div className="file-formats-container">
                  <Form.List name="fileFormats">
                    {(fields, { add, remove }) => (
                      <div className="file-formats-list">
                        {fields.map(({ key, name, ...restField }) => (
                          <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                            <Form.Item
                              {...restField}
                              name={[name]}
                              rules={[{ required: true, message: '请输入文件格式' }]}
                              className="format-item"
                            >
                              <Input placeholder="例如: pdf" />
                            </Form.Item>
                            <Button onClick={() => remove(name)} danger>删除</Button>
                          </Space>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add()} block>
                            <PlusOutlined /> 添加文件格式
                          </Button>
                        </Form.Item>
                      </div>
                    )}
                  </Form.List>
                </div>
              </Form.Item>
            </Panel>

            {/* 备份和日志设置 */}
            <Panel header="备份和日志设置" key="3" className="settings-panel">
              <div className="settings-grid">
                <Form.Item name="enableAutoBackup" label="启用自动备份" valuePropName="checked" className="settings-item">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
                
                <Form.Item 
                  name="backupFrequency" 
                  label="备份频率"
                  rules={[{ required: ({ getFieldValue }) => getFieldValue('enableAutoBackup') }]}
                  className="settings-item"
                >
                  <Select placeholder="选择备份频率">
                    <Option value="daily">每天</Option>
                    <Option value="weekly">每周</Option>
                    <Option value="monthly">每月</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="logLevel" label="日志级别" className="settings-item">
                  <Select placeholder="选择日志级别">
                    <Option value="error">错误</Option>
                    <Option value="warning">警告</Option>
                    <Option value="info">信息</Option>
                    <Option value="debug">调试</Option>
                  </Select>
                </Form.Item>
              </div>
              
              <div className="backup-section">
                <Button type="primary" onClick={() => handleManualBackup()}>手动备份</Button>
                <Button onClick={() => handleDownloadBackup()}>下载最新备份</Button>
              </div>
            </Panel>

            {/* 邮件通知设置 */}
            <Panel header="邮件通知设置" key="4" className="settings-panel">
              <Form.Item name="enableEmailNotifications" label="启用邮件通知" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              
              <div className="email-settings-container">
                <div className="settings-grid">
                  <Form.Item 
                    name="emailSMTP" 
                    label="SMTP服务器" 
                    rules={[{ required: ({ getFieldValue }) => getFieldValue('enableEmailNotifications') }]}
                    className="settings-item"
                  >
                    <Input placeholder="SMTP服务器地址" />
                  </Form.Item>
                  
                  <Form.Item 
                    name="emailPort" 
                    label="SMTP端口" 
                    rules={[{ required: ({ getFieldValue }) => getFieldValue('enableEmailNotifications') }]}
                    className="settings-item"
                  >
                    <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                  </Form.Item>
                  
                  <Form.Item 
                    name="emailUsername" 
                    label="邮箱用户名" 
                    rules={[{ required: ({ getFieldValue }) => getFieldValue('enableEmailNotifications') }]}
                    className="settings-item"
                  >
                    <Input placeholder="邮箱用户名" />
                  </Form.Item>
                  
                  <Form.Item 
                    name="emailPassword" 
                    label="邮箱密码" 
                    rules={[{ required: ({ getFieldValue }) => getFieldValue('enableEmailNotifications') }]}
                    className="settings-item"
                  >
                    <Input.Password placeholder="邮箱密码" />
                  </Form.Item>
                </div>
                
                <Button type="primary" onClick={() => handleTestEmail()}>测试邮件发送</Button>
              </div>
            </Panel>
          </Collapse>
        </Form>
      </Card>

      {/* 安全警告 */}
      <div className="security-warning">
        <AlertOutlined className="warning-icon" />
        <Text type="warning">
          请确保敏感信息（如邮件密码）得到适当保护。系统将加密存储这些信息。
        </Text>
      </div>

      <div className="reset-section">
        <Button danger onClick={() => setResetModalVisible(true)}>
          恢复默认设置
        </Button>
        <Text type="secondary" className="reset-hint">
          此操作将重置所有设置为默认值，且不可撤销。
        </Text>
      </div>
    </div>
  );
};

export default SettingsPage;