from rest_framework import serializers
from documents.models import Document, DocumentPage

class DocumentPageSerializer(serializers.ModelSerializer):
    """文档页面序列化器"""
    class Meta:
        model = DocumentPage
        fields = ['id', 'page_num', 'text', 'image_path', 'layout_json']
        read_only_fields = ['id']

class DocumentSerializer(serializers.ModelSerializer):
    """文档序列化器"""
    uploaded_by = serializers.StringRelatedField(read_only=True)
    pages = DocumentPageSerializer(many=True, read_only=True)
    page_count = serializers.IntegerField(source='pages.count', read_only=True)
    
    class Meta:
        model = Document
        fields = ['id', 'filename', 'source_type', 'status', 'uploaded_by', 
                  'created_at', 'storage_path', 'pages', 'page_count']
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'status']
    
    def create(self, validated_data):
        # 文件上传处理在视图中完成
        return super().create(validated_data)

class DocumentCreateSerializer(serializers.ModelSerializer):
    """文档创建序列化器"""
    class Meta:
        model = Document
        fields = ['filename', 'source_type', 'storage_path']
        read_only_fields = ['id', 'status', 'uploaded_by', 'created_at']