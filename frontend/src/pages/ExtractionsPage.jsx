import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, message, Typography, Space, Tag, Input, Select, Form, InputNumber, Switch } from 'antd';
import { DatabaseOutlined, SearchOutlined, EditOutlined, CheckOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import '../assets/styles/ExtractionsPage.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// 模拟提取结果数据
const mockExtractions = [
  {
    id: 1,
    documentId: 1,
    documentTitle: '合同文档.pdf',
    extractionTime: '2024-01-15 14:35:00',
    status: '已验证',
    confidence: 0.95,
    fields: [
      { id: 1, name: '合同编号', value: 'HT-2024-0001', verified: true },
      { id: 2, name: '甲方名称', value: '北京科技有限公司', verified: true },
      { id: 3, name: '乙方名称', value: '上海贸易有限公司', verified: true },
      { id: 4, name: '签订日期', value: '2024-01-10', verified: true },
      { id: 5, name: '合同金额', value: '¥100,000.00', verified: true }
    ]
  },
  {
    id: 2,
    documentId: 2,
    documentTitle: '发票文件.jpg',
    extractionTime: '2024-01-15 13:50:00',
    status: '待验证',
    confidence: 0.88,
    fields: [
      { id: 6, name: '发票号码', value: '00123456', verified: false },
      { id: 7, name: '开票日期', value: '2024-01-14', verified: false },
      { id: 8, name: '购买方', value: '广州电子科技有限公司', verified: false },
      { id: 9, name: '销售方', value: '深圳设备制造有限公司', verified: false },
      { id: 10, name: '金额', value: '¥15,600.00', verified: false }
    ]
  },
  {
    id: 3,
    documentId: 3,
    documentTitle: '财务报表.xlsx',
    extractionTime: '2024-01-15 10:25:00',
    status: '已验证',
    confidence: 0.98,
    fields: [
      { id: 11, name: '报表期间', value: '2023年12月', verified: true },
      { id: 12, name: '营业收入', value: '¥1,500,000.00', verified: true },
      { id: 13, name: '营业成本', value: '¥900,000.00', verified: true },
      { id: 14, name: '净利润', value: '¥450,000.00', verified: true }
    ]
  }
];

const ExtractionsPage = () => {
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExtraction, setSelectedExtraction] = useState(null);
  const [currentField, setCurrentField] = useState(null);
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchExtractions();
  }, []);

  // 获取提取结果列表
  const fetchExtractions = async () => {
    setLoading(true);
    try {
      // 实际项目中这里应该是真实的API调用
      // const response = await axios.get('/api/v1/extractions/');
      // setExtractions(response.data);
      
      // 模拟API延迟
      setTimeout(() => {
        setExtractions(mockExtractions);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('获取提取结果失败:', error);
      message.error('获取提取结果失败');
      setLoading(false);
    }
  };

  // 搜索提取结果
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // 过滤提取结果
  const getFilteredExtractions = () => {
    return extractions.filter(extraction => {
      const matchesSearch = extraction.documentTitle.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = !statusFilter || extraction.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // 查看提取详情
  const handleViewDetails = (record) => {
    setSelectedExtraction(record);
    setDetailsModalVisible(true);
  };

  // 编辑字段值
  const handleEditField = (extraction, field) => {
    setSelectedExtraction(extraction);
    setCurrentField(field);
    editForm.setFieldsValue({
      name: field.name,
      value: field.value,
      verified: field.verified
    });
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      
      // 实际项目中这里应该是真实的API调用
      // await axios.put(`/api/v1/extractions/${selectedExtraction.id}/fields/${currentField.id}/`, values);
      
      // 更新本地状态
      const updatedExtractions = extractions.map(extraction => {
        if (extraction.id === selectedExtraction.id) {
          const updatedFields = extraction.fields.map(field => {
            if (field.id === currentField.id) {
              return { ...field, ...values };
            }
            return field;
          });
          return { ...extraction, fields: updatedFields };
        }
        return extraction;
      });
      
      setExtractions(updatedExtractions);
      message.success('字段更新成功');
      setEditModalVisible(false);
      
      // 如果所有字段都已验证，更新提取状态
      const currentExtraction = updatedExtractions.find(e => e.id === selectedExtraction.id);
      if (currentExtraction && currentExtraction.fields.every(f => f.verified)) {
        updateExtractionStatus(currentExtraction.id, '已验证');
      }
    } catch (error) {
      console.error('更新字段失败:', error);
      message.error('更新字段失败');
    }
  };

  // 更新提取状态
  const updateExtractionStatus = async (id, status) => {
    try {
      // 实际项目中这里应该是真实的API调用
      // await axios.patch(`/api/v1/extractions/${id}/`, { status });
      
      const updatedExtractions = extractions.map(extraction => {
        if (extraction.id === id) {
          return { ...extraction, status };
        }
        return extraction;
      });
      
      setExtractions(updatedExtractions);
      
      // 如果在详情弹窗中，更新选中的提取项
      if (selectedExtraction && selectedExtraction.id === id) {
        setSelectedExtraction(updatedExtractions.find(e => e.id === id));
      }
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('更新状态失败');
    }
  };

  // 导出提取结果
  const handleExport = () => {
    message.success('导出成功');
    // 实际项目中应该调用导出API
  };

  // 表格列定义
  const columns = [
    {
      title: '文档名称',
      dataIndex: 'documentTitle',
      key: 'documentTitle',
      render: (text) => (
        <div className="document-title">
          <DatabaseOutlined className="document-icon" />
          <Text ellipsis={{ tooltip: text }}>{text}</Text>
        </div>
      )
    },
    {
      title: '提取时间',
      dataIndex: 'extractionTime',
      key: 'extractionTime'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={getStatusColor(text)}>{text}</Tag>
      )
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value) => (
        <Progress percent={value * 100} strokeColor={getConfidenceColor(value)} width={80} />
      )
    },
    {
      title: '字段数量',
      key: 'fieldCount',
      render: (_, record) => record.fields.length
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<DatabaseOutlined />} size="small" onClick={() => handleViewDetails(record)}>详情</Button>
          {record.status === '待验证' && (
            <Button icon={<CheckOutlined />} size="small" type="primary" onClick={() => updateExtractionStatus(record.id, '已验证')}>验证</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="extractions-page-container">
      <div className="page-header">
        <div className="header-left">
          <Title level={4}>提取管理</Title>
          <Text className="page-description">查看和管理信息提取结果</Text>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          导出数据
        </Button>
      </div>

      <Card className="extractions-card">
        <div className="filter-section">
          <Search
            placeholder="搜索文档名称"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            className="search-input"
          />
          <div className="filters-row">
            <Select
              placeholder="选择处理状态"
              allowClear
              style={{ width: 180 }}
              onChange={setStatusFilter}
              className="filter-select"
            >
              <Option value="已验证">已验证</Option>
              <Option value="待验证">待验证</Option>
              <Option value="验证失败">验证失败</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchExtractions} loading={loading}>
              刷新
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={getFilteredExtractions()}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          className="extractions-table"
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="提取详情"
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedExtraction && (
          <div className="extraction-details">
            <div className="detail-header">
              <div className="detail-item">
                <Text strong>文档名称：</Text>
                <Text>{selectedExtraction.documentTitle}</Text>
              </div>
              <div className="detail-item">
                <Text strong>提取时间：</Text>
                <Text>{selectedExtraction.extractionTime}</Text>
              </div>
              <div className="detail-item">
                <Text strong>状态：</Text>
                <Tag color={getStatusColor(selectedExtraction.status)}>{selectedExtraction.status}</Tag>
              </div>
              <div className="detail-item">
                <Text strong>置信度：</Text>
                <Progress percent={selectedExtraction.confidence * 100} strokeColor={getConfidenceColor(selectedExtraction.confidence)} showInfo />
              </div>
            </div>
            
            <div className="fields-section">
              <Title level={5}>提取字段</Title>
              <Table
                columns={[
                  {
                    title: '字段名称',
                    dataIndex: 'name',
                    key: 'name'
                  },
                  {
                    title: '提取值',
                    dataIndex: 'value',
                    key: 'value',
                    render: (text, record) => (
                      <Text ellipsis={{ tooltip: text }}>{text}</Text>
                    )
                  },
                  {
                    title: '验证状态',
                    dataIndex: 'verified',
                    key: 'verified',
                    render: (verified) => (
                      <Tag color={verified ? 'green' : 'orange'}>
                        {verified ? '已验证' : '待验证'}
                      </Tag>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <Button icon={<EditOutlined />} size="small" onClick={() => handleEditField(selectedExtraction, record)}>
                        编辑
                      </Button>
                    )
                  }
                ]}
                dataSource={selectedExtraction.fields}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* 编辑字段弹窗 */}
      <Modal
        title="编辑字段"
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
          <Form.Item name="name" label="字段名称" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="value" label="字段值" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="verified" label="验证状态" valuePropName="checked">
            <Switch checkedChildren="已验证" unCheckedChildren="待验证" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// 辅助函数：根据状态返回不同的颜色
const getStatusColor = (status) => {
  const colorMap = {
    '已验证': 'green',
    '待验证': 'orange',
    '验证失败': 'red'
  };
  return colorMap[status] || 'default';
};

// 辅助函数：根据置信度返回不同的颜色
const getConfidenceColor = (confidence) => {
  if (confidence >= 0.9) return '#52c41a';
  if (confidence >= 0.7) return '#faad14';
  return '#ff4d4f';
};

export default ExtractionsPage;