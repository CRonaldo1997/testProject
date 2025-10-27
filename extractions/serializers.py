from rest_framework import serializers
from extractions.models import FieldDefinition, ExtractionResult, VerificationRecord
from documents.models import Document

class FieldDefinitionSerializer(serializers.ModelSerializer):
    """字段定义序列化器"""
    class Meta:
        model = FieldDefinition
        fields = ['id', 'key', 'label', 'data_type', 'required', 'enum_values', 
                  'description', 'ui_order', 'custom_prompt', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ExtractionResultSerializer(serializers.ModelSerializer):
    """抽取结果序列化器"""
    document = serializers.PrimaryKeyRelatedField(queryset=Document.objects.all())
    field_def = FieldDefinitionSerializer(read_only=True)
    field_key = serializers.CharField(source='field_def.key', read_only=True)
    field_label = serializers.CharField(source='field_def.label', read_only=True)
    verification_status = serializers.CharField(read_only=True, source='get_verification_status')
    
    class Meta:
        model = ExtractionResult
        fields = ['id', 'document', 'field_def', 'field_key', 'field_label', 'value_raw', 
                  'normalized_value', 'confidence', 'page_num', 'bbox', 'model_name', 
                  'model_version', 'prompt_version', 'verification_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class VerificationRecordSerializer(serializers.ModelSerializer):
    """验证记录序列化器"""
    user = serializers.StringRelatedField(read_only=True)
    result = serializers.PrimaryKeyRelatedField(queryset=ExtractionResult.objects.all())
    
    class Meta:
        model = VerificationRecord
        fields = ['id', 'result', 'user', 'status', 'corrected_value', 'confidence_feedback', 
                  'comments', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class DocumentExtractionResultsSerializer(serializers.ModelSerializer):
    """文档抽取结果序列化器，用于获取单个文档的所有抽取结果"""
    extraction_results = ExtractionResultSerializer(many=True, read_only=True)
    
    class Meta:
        model = Document
        fields = ['id', 'filename', 'extraction_results']

class ExtractionCreateSerializer(serializers.Serializer):
    """创建抽取任务的序列化器"""
    document_id = serializers.IntegerField(required=True)
    prompt_template_id = serializers.IntegerField(required=False, allow_null=True)