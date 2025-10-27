from django.urls import path, include
from rest_framework.routers import DefaultRouter

from prompts.views import PromptTemplateViewSet, PromptTestResultViewSet

# 创建路由器
router = DefaultRouter()

# 注册视图集
router.register(r'templates', PromptTemplateViewSet, basename='prompttemplate')
router.register(r'test-results', PromptTestResultViewSet, basename='prompttestresult')

# 生成URL模式
urlpatterns = [
    path('', include(router.urls)),
]