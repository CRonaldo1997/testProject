from rest_framework import serializers
from audit.models import AuditLog, SystemLog

class AuditLogSerializer(serializers.ModelSerializer):
    """审计日志序列化器"""
    user_username = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'action_display', 'entity_type', 'entity_id',
            'user', 'user_username', 'details', 'ip_address', 'user_agent',
            'prompt_text', 'response_text', 'created_at'
        ]
        read_only_fields = fields  # 审计日志不可修改
    
    def get_user_username(self, obj):
        """获取用户用户名"""
        return obj.user.username if obj.user else '系统'
    
    def get_action_display(self, obj):
        """获取操作类型的显示名称"""
        return obj.get_action_display()
    
    def to_representation(self, instance):
        """自定义序列化输出"""
        ret = super().to_representation(instance)
        # 格式化时间
        ret['created_at'] = instance.created_at.strftime('%Y-%m-%d %H:%M:%S')
        return ret

class SystemLogSerializer(serializers.ModelSerializer):
    """系统日志序列化器"""
    level_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemLog
        fields = [
            'id', 'level', 'level_display', 'source', 'message', 'details',
            'created_at'
        ]
        read_only_fields = fields  # 系统日志不可修改
    
    def get_level_display(self, obj):
        """获取日志级别显示名称"""
        return obj.get_level_display()
    
    def to_representation(self, instance):
        """自定义序列化输出"""
        ret = super().to_representation(instance)
        # 格式化时间
        ret['created_at'] = instance.created_at.strftime('%Y-%m-%d %H:%M:%S')
        return ret