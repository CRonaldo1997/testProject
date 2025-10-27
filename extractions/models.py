from django.db import models
from django.contrib.auth import get_user_model
from documents.models import Document

User = get_user_model()

class FieldDefinition(models.Model):
    """字段定义模型"""
    key = models.CharField(max_length=100, unique=True, help_text="字段唯一标识")
    label = models.CharField(max_length=100, help_text="字段显示名称")
    data_type = models.CharField(max_length=20, default='string')  # string/date/enum/amount
    enum_values = models.JSONField(null=True, blank=True, help_text="枚举值列表")
    validation_regex = models.CharField(max_length=255, null=True, blank=True, help_text="验证正则表达式")
    required = models.BooleanField(default=False, help_text="是否必填")
    ui_order = models.IntegerField(default=0, help_text="UI显示顺序")
    help_text = models.TextField(null=True, blank=True, help_text="字段帮助文本")
    custom_prompt = models.TextField(null=True, blank=True, help_text="自定义Prompt")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.label} ({self.key})"
    
    class Meta:
        ordering = ['ui_order', 'label']

class ExtractionResult(models.Model):
    """抽取结果模型"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='extraction_results')
    field_def = models.ForeignKey(FieldDefinition, on_delete=models.CASCADE, related_name='extraction_results')
    value_raw = models.TextField(help_text="原始抽取值")
    normalized_value = models.TextField(null=True, blank=True, help_text="标准化后的值")
    confidence = models.FloatField(default=0.0, help_text="置信度")
    page_num = models.IntegerField(null=True, help_text="所在页码")
    bbox = models.JSONField(null=True, blank=True, help_text="边界框坐标")
    model_name = models.CharField(max_length=100, help_text="使用的模型名称")
    model_version = models.CharField(max_length=20, help_text="模型版本")
    prompt_version = models.IntegerField(help_text="Prompt版本")
    verified = models.BooleanField(default=False, help_text="是否已验证")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.document.filename} - {self.field_def.label}: {self.value_raw}"

class VerificationRecord(models.Model):
    """验证记录模型"""
    extraction_result = models.ForeignKey(ExtractionResult, on_delete=models.CASCADE, related_name='verification_records')
    verifier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='verification_records')
    action = models.CharField(max_length=20)  # accept/modify/reject
    corrected_value = models.TextField(null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.action} - {self.extraction_result.field_def.label} - {self.timestamp}"
