import React, { useState } from 'react';
import { Button, Upload, Modal, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

// 定义一个非常简单的文档管理页面，专注于文件上传功能
const DocumentsPage = () => {
  // 控制上传模态框的显示/隐藏状态
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  // 存储上传的文件列表
  const [fileList, setFileList] = useState([]);
  // 上传过程中的加载状态
  const [isUploading, setIsUploading] = useState(false);

  // 打开上传模态框
  const openUploadModal = () => {
    setIsUploadModalVisible(true);
  };

  // 关闭上传模态框
  const closeUploadModal = () => {
    setIsUploadModalVisible(false);
    setFileList([]); // 关闭时清空文件列表
  };

  // 文件类型和大小验证
  const beforeUpload = (file) => {
    // 允许的文件类型
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      message.error(`文件类型不支持: ${file.name}`);
      return Upload.LIST_IGNORE; // 忽略不支持的文件
    }
    
    // 检查文件大小（10MB限制）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error(`文件大小超过限制: ${file.name}`);
      return Upload.LIST_IGNORE; // 忽略过大的文件
    }
    
    return false; // 阻止自动上传，使用手动上传
  };

  // 文件列表变化处理
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 执行文件上传
  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }
    
    setIsUploading(true);
    
    // 模拟上传过程
    setTimeout(() => {
      message.success('文件上传成功！');
      setIsUploading(false);
      closeUploadModal();
    }, 1500);
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 页面标题区域 */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', margin: 0 }}>
          文档管理
        </h1>
        <p style={{ color: '#666', marginTop: '8px' }}>上传文档以进行信息提取</p>
      </div>
      
      {/* 主要内容区域 */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px'
      }}>
        {/* 上传按钮区域 - 居中显示 */}
        <div style={{ 
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '60px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '30px', color: '#333' }}>
            点击下方按钮上传文档
          </h2>
          
          {/* 明显的上传按钮 */}
          <Button
            type="primary"
            icon={<UploadOutlined />}
            size="large"
            onClick={openUploadModal}
            style={{
              backgroundColor: '#1890ff',
              borderColor: '#1890ff',
              fontSize: '18px',
              padding: '12px 32px',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
            }}
          >
            上传待提取文件
          </Button>
          
          <p style={{ marginTop: '20px', color: '#999', fontSize: '14px' }}>
            支持 PDF、JPG、PNG、Word、Excel 格式，单个文件最大 10MB
          </p>
        </div>
      </div>
      
      {/* 上传文件模态框 - 简单直接的实现 */}
      <Modal
        title="上传文件"
        open={isUploadModalVisible}
        onCancel={closeUploadModal}
        footer={[
          <Button key="cancel" onClick={closeUploadModal}>
            取消
          </Button>,
          <Button 
            key="upload" 
            type="primary" 
            onClick={handleUpload}
            loading={isUploading}
          >
            确认上传
          </Button>
        ]}
        width={600}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <Upload.Dragger
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleFileChange}
            multiple
            customRequest={() => {}}
            showUploadList={true}
            style={{
              border: '2px dashed #d9d9d9',
              borderRadius: '6px',
              padding: '40px 20px'
            }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: '16px', marginTop: '16px' }}>
              点击或拖拽文件到此处上传
            </p>
            <p className="ant-upload-hint" style={{ marginTop: '16px' }}>
              支持单个或批量上传，仅支持 PDF, JPG, PNG, Word, Excel 格式，最大 10MB
            </p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsPage;