from django.urls import path, include
from rest_framework.routers import DefaultRouter

from audit.views import AuditLogViewSet, SystemLogViewSet

# 创建路由器
router = DefaultRouter()

# 注册视图集
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'system-logs', SystemLogViewSet, basename='systemlog')

# 生成URL模式
urlpatterns = [
    path('', include(router.urls)),
]