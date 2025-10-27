from rest_framework import serializers
from prompts.models import PromptTemplate, PromptTestResult
import json

class PromptTemplateSerializer(serializers.ModelSerializer):
    """Prompt模板序列化器"""
    field_prompts = serializers.JSONField(required=False)
    
    class Meta:
        model = PromptTemplate
        fields = ['id', 'name', 'description', 'system_prompt', 'field_prompts', 
                  'llm_model', 'temperature', 'top_p', 'is_active', 'version',
                  'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'version', 'created_by', 'created_at', 'updated_at']
    
    def validate_field_prompts(self, value):
        """验证field_prompts是否为有效的JSON格式"""
        if value is not None:
            try:
                # 确保可以被JSON序列化（已经是dict类型的话就直接返回）
                if isinstance(value, dict):
                    return value
                else:
                    raise serializers.ValidationError("field_prompts必须是字典格式")
            except Exception:
                raise serializers.ValidationError("field_prompts格式无效")
        return {}

class PromptTemplateCreateSerializer(serializers.ModelSerializer):
    """Prompt模板创建序列化器"""
    field_prompts = serializers.JSONField(required=False)
    
    class Meta:
        model = PromptTemplate
        fields = ['name', 'description', 'system_prompt', 'field_prompts', 
                  'llm_model', 'temperature', 'top_p', 'is_active']
        read_only_fields = ['id', 'version', 'created_by', 'created_at', 'updated_at']
    
    def validate_field_prompts(self, value):
        """验证field_prompts是否为有效的JSON格式"""
        if value is not None:
            try:
                if isinstance(value, dict):
                    return value
                else:
                    raise serializers.ValidationError("field_prompts必须是字典格式")
            except Exception:
                raise serializers.ValidationError("field_prompts格式无效")
        return {}

class PromptTestResultSerializer(serializers.ModelSerializer):
    """Prompt测试结果序列化器"""
    prompt_template = serializers.PrimaryKeyRelatedField(queryset=PromptTemplate.objects.all())
    
    class Meta:
        model = PromptTestResult
        fields = ['id', 'prompt_template', 'field_key', 'sample_text', 
                  'expected_output', 'actual_output', 'success', 'evaluation_score',
                  'created_at']
        read_only_fields = ['id', 'created_at']

class PromptTestCreateSerializer(serializers.Serializer):
    """创建Prompt测试的序列化器"""
    prompt_template_id = serializers.IntegerField(required=True)
    field_key = serializers.CharField(required=True)
    sample_text = serializers.CharField(required=True)
    expected_output = serializers.CharField(required=True)