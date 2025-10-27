from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.timezone import now

User = get_user_model()

class AuditLog(models.Model):
    """审计日志模型"""
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_UPLOAD = 'upload'
    ACTION_EXTRACT = 'extract'
    ACTION_VERIFY = 'verify'
    ACTION_TEST = 'test'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, '创建'),
        (ACTION_UPDATE, '更新'),
        (ACTION_DELETE, '删除'),
        (ACTION_UPLOAD, '上传'),
        (ACTION_EXTRACT, '抽取'),
        (ACTION_VERIFY, '验证'),
        (ACTION_TEST, '测试'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=100, help_text="操作的实体类型")
    entity_id = models.CharField(max_length=255, null=True, blank=True, help_text="操作的实体ID")
    
    # 通用外键，可选使用
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    details = models.JSONField(null=True, blank=True, help_text="操作详情")
    prompt_text = models.TextField(null=True, blank=True, help_text="使用的Prompt")
    model_response = models.TextField(null=True, blank=True, help_text="模型响应")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=now)
    
    def __str__(self):
        return f"{self.user} - {self.get_action_display()} - {self.entity_type} - {self.created_at}"
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['created_at']),
        ]

class SystemLog(models.Model):
    """系统日志模型"""
    LEVEL_DEBUG = 'debug'
    LEVEL_INFO = 'info'
    LEVEL_WARNING = 'warning'
    LEVEL_ERROR = 'error'
    LEVEL_CRITICAL = 'critical'
    
    LEVEL_CHOICES = [
        (LEVEL_DEBUG, '调试'),
        (LEVEL_INFO, '信息'),
        (LEVEL_WARNING, '警告'),
        (LEVEL_ERROR, '错误'),
        (LEVEL_CRITICAL, '严重'),
    ]
    
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default=LEVEL_INFO)
    message = models.TextField()
    source = models.CharField(max_length=100, null=True, blank=True, help_text="日志来源")
    context = models.JSONField(null=True, blank=True, help_text="日志上下文")
    created_at = models.DateTimeField(default=now)
    
    def __str__(self):
        return f"{self.get_level_display()} - {self.source} - {self.message[:50]}..." if len(self.message) > 50 else self.message
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['level']),
            models.Index(fields=['source']),
            models.Index(fields=['created_at']),
        ]
