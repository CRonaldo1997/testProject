from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from audit.models import AuditLog, SystemLog
from audit.serializers import AuditLogSerializer, SystemLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """审计日志视图集"""
    queryset = AuditLog.objects.all().order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # 过滤字段
    filterset_fields = {
        'action': ['exact', 'in'],
        'entity_type': ['exact', 'contains'],
        'entity_id': ['exact'],
        'user': ['exact'],
        'created_at': ['exact', 'gt', 'gte', 'lt', 'lte'],
    }
    
    # 搜索字段
    search_fields = [
        'action',
        'entity_type',
        'entity_id',
        'user__username',
        'user__email',
    ]
    
    # 排序字段
    ordering_fields = ['created_at', 'user']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 获取过滤参数
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        # 日期范围过滤
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """获取审计日志统计信息"""
        from django.db.models import Count, Q
        from datetime import datetime, timedelta
        
        # 默认统计最近7天
        days = int(request.query_params.get('days', 7))
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # 按操作类型统计
        action_stats = AuditLog.objects.filter(
            created_at__range=(start_date, end_date)
        ).values('action').annotate(count=Count('id'))
        
        # 按实体类型统计
        entity_stats = AuditLog.objects.filter(
            created_at__range=(start_date, end_date)
        ).values('entity_type').annotate(count=Count('id'))
        
        # 按用户统计
        user_stats = AuditLog.objects.filter(
            created_at__range=(start_date, end_date)
        ).values('user__username').annotate(count=Count('id'))
        
        # 时间线统计（按天）
        timeline_data = []
        current_date = start_date
        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)
            count = AuditLog.objects.filter(
                created_at__range=(current_date, next_date)
            ).count()
            timeline_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'count': count
            })
            current_date = next_date
        
        return Response({
            'time_range': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'days': days
            },
            'total_logs': AuditLog.objects.filter(
                created_at__range=(start_date, end_date)
            ).count(),
            'action_stats': list(action_stats),
            'entity_stats': list(entity_stats),
            'user_stats': list(user_stats),
            'timeline': timeline_data
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """导出审计日志为CSV格式"""
        import csv
        from io import StringIO
        from django.http import HttpResponse
        
        # 获取过滤后的查询集
        queryset = self.filter_queryset(self.get_queryset())
        
        # 创建CSV响应
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
        
        # 写入CSV数据
        writer = csv.writer(response)
        # 写入表头
        writer.writerow([
            '操作时间', '操作用户', '操作类型', '实体类型', '实体ID',
            '详情', 'IP地址', '用户代理'
        ])
        
        # 写入数据
        for log in queryset:
            writer.writerow([
                log.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                log.user.username if log.user else '系统',
                log.get_action_display(),
                log.entity_type,
                log.entity_id,
                str(log.details),
                log.ip_address,
                log.user_agent
            ])
        
        return response

class SystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    """系统日志视图集"""
    queryset = SystemLog.objects.all().order_by('-created_at')
    serializer_class = SystemLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # 过滤字段
    filterset_fields = {
        'level': ['exact', 'in'],
        'source': ['exact', 'contains'],
        'created_at': ['exact', 'gt', 'gte', 'lt', 'lte'],
    }
    
    # 搜索字段
    search_fields = ['message', 'source', 'details']
    
    # 排序字段
    ordering_fields = ['created_at', 'level']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # 获取过滤参数
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        # 日期范围过滤
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """获取系统日志统计信息"""
        from django.db.models import Count
        from datetime import datetime, timedelta
        
        # 默认统计最近7天
        days = int(request.query_params.get('days', 7))
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # 按日志级别统计
        level_stats = SystemLog.objects.filter(
            created_at__range=(start_date, end_date)
        ).values('level').annotate(count=Count('id'))
        
        # 按来源统计
        source_stats = SystemLog.objects.filter(
            created_at__range=(start_date, end_date)
        ).values('source').annotate(count=Count('id'))
        
        # 时间线统计（按天）
        timeline_data = []
        current_date = start_date
        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)
            count = SystemLog.objects.filter(
                created_at__range=(current_date, next_date)
            ).count()
            timeline_data.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'count': count,
                'error_count': SystemLog.objects.filter(
                    created_at__range=(current_date, next_date),
                    level=SystemLog.LEVEL_ERROR
                ).count(),
                'warning_count': SystemLog.objects.filter(
                    created_at__range=(current_date, next_date),
                    level=SystemLog.LEVEL_WARNING
                ).count()
            })
            current_date = next_date
        
        return Response({
            'time_range': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'days': days
            },
            'total_logs': SystemLog.objects.filter(
                created_at__range=(start_date, end_date)
            ).count(),
            'error_count': SystemLog.objects.filter(
                created_at__range=(start_date, end_date),
                level=SystemLog.LEVEL_ERROR
            ).count(),
            'warning_count': SystemLog.objects.filter(
                created_at__range=(start_date, end_date),
                level=SystemLog.LEVEL_WARNING
            ).count(),
            'level_stats': list(level_stats),
            'source_stats': list(source_stats),
            'timeline': timeline_data
        })
    
    @action(detail=False, methods=['get'])
    def latest_errors(self, request):
        """获取最近的错误日志"""
        limit = int(request.query_params.get('limit', 50))
        error_logs = SystemLog.objects.filter(
            level=SystemLog.LEVEL_ERROR
        ).order_by('-created_at')[:limit]
        
        serializer = self.get_serializer(error_logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """清除系统日志（需要管理员权限）"""
        # 检查用户是否是管理员
        if not request.user.is_staff:
            return Response(
                {'error': '需要管理员权限'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 获取清除参数
        before_date = request.data.get('before_date')
        level = request.data.get('level')
        
        # 构建过滤条件
        filters = {}
        if before_date:
            filters['created_at__lte'] = before_date
        if level:
            filters['level'] = level
        
        # 执行清除操作
        count = SystemLog.objects.filter(**filters).delete()[0]
        
        return Response({
            'message': f'已清除 {count} 条系统日志',
            'filters': filters
        })
