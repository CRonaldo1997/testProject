import React, { useState } from 'react';
import { Button, Upload, Modal, message, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DocumentsPage = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 上传前检查
  const beforeUpload = (file) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      message.error('仅支持 PDF, JPG, PNG, Word, Excel 格式的文件!');
      return Upload.LIST_IGNORE;
    }
    
    const validSize = file.size / 1024 / 1024 < 10; // 10MB
    if (!validSize) {
      message.error('文件大小不能超过 10MB!');
      return Upload.LIST_IGNORE;
    }
    
    return false; // 手动上传
  };

  // 处理文件变化
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 上传文档
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }
    
    setLoading(true);
    try {
      // 模拟上传延迟
      setTimeout(() => {
        message.success('文件上传成功');
        setFileList([]);
        setUploadModalVisible(false);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error('文件上传失败');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* 页面标题和上传按钮区域 - 固定在顶部 */}
      <div style={{ 
        position: 'fixed', 
        top: '64px', 
        left: '200px', 
        right: '0', 
        padding: '20px', 
        backgroundColor: 'white', 
        zIndex: 1000,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>文档管理</Title>
          
          {/* 大尺寸、颜色鲜明的上传按钮 */}
          <Button 
            type="primary" 
            icon={<UploadOutlined />} 
            onClick={() => setUploadModalVisible(true)}
            size="large"
            style={{ 
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              fontSize: '16px',
              padding: '10px 24px',
              fontWeight: 'bold'
            }}
          >
            上传待提取文件
          </Button>
        </div>
      </div>

      {/* 主要内容区域 - 添加足够的顶部边距避免被固定头部遮挡 */}
      <div style={{ marginTop: '120px', padding: '0 20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Title level={3} style={{ color: '#1890ff' }}>文档上传指南</Title>
          <p style={{ fontSize: '16px', color: '#666', margin: '20px 0' }}>
            点击上方的「上传待提取文件」按钮，选择您需要提取信息的文档。
          </p>
          <p style={{ fontSize: '14px', color: '#999' }}>
            支持 PDF、JPG、PNG、Word 和 Excel 格式，单个文件最大 10MB。
          </p>
        </div>
      </div>

      {/* 上传文档弹窗 */}
      <Modal
        title="上传待提取文件"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setUploadModalVisible(false);
            setFileList([]);
          }}>
            取消
          </Button>,
          <Button key="upload" type="primary" onClick={handleUpload} loading={loading}>
            上传
          </Button>
        ]}
        width={600}
      >
        <Upload.Dragger
          multiple
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={handleFileChange}
          customRequest={() => {}}
          style={{ 
            padding: '40px', 
            border: '2px dashed #1890ff',
            borderRadius: '8px'
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '16px', marginTop: '16px' }}>
            点击或拖拽文件到此区域上传
          </p>
          <p className="ant-upload-hint" style={{ marginTop: '16px' }}>
            支持单个或批量上传，仅支持 PDF, JPG, PNG, Word, Excel 格式，最大 10MB
          </p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

export default DocumentsPage;