from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import json

from prompts.models import PromptTemplate, PromptTestResult
from prompts.serializers import (
    PromptTemplateSerializer,
    PromptTemplateCreateSerializer,
    PromptTestResultSerializer,
    PromptTestCreateSerializer
)
from audit.models import AuditLog

class PromptTemplateViewSet(viewsets.ModelViewSet):
    """Prompt模板视图集"""
    queryset = PromptTemplate.objects.all().order_by('-created_at')
    serializer_class = PromptTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PromptTemplateCreateSerializer
        return PromptTemplateSerializer
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # 创建新模板
            template = serializer.save(
                created_by=self.request.user,
                version=1  # 新模板从版本1开始
            )
            
            # 如果设置为激活状态，将其他模板设置为非激活
            if template.is_active:
                PromptTemplate.objects.exclude(id=template.id).update(is_active=False)
            
            # 记录审计日志
            AuditLog.objects.create(
                action=AuditLog.ACTION_CREATE,
                entity_type='PromptTemplate',
                entity_id=str(template.id),
                user=self.request.user,
                details={
                    'name': template.name,
                    'llm_model': template.llm_model,
                    'is_active': template.is_active
                }
            )
    
    def perform_update(self, serializer):
        with transaction.atomic():
            old_template = self.get_object()
            new_template = serializer.save()
            
            # 如果设置为激活状态，将其他模板设置为非激活
            if new_template.is_active and old_template.is_active != new_template.is_active:
                PromptTemplate.objects.exclude(id=new_template.id).update(is_active=False)
            
            # 记录审计日志
            AuditLog.objects.create(
                action=AuditLog.ACTION_UPDATE,
                entity_type='PromptTemplate',
                entity_id=str(new_template.id),
                user=self.request.user,
                details={
                    'old_name': old_template.name,
                    'new_name': new_template.name,
                    'old_is_active': old_template.is_active,
                    'new_is_active': new_template.is_active
                }
            )
    
    def perform_destroy(self, instance):
        # 记录审计日志
        AuditLog.objects.create(
            action=AuditLog.ACTION_DELETE,
            entity_type='PromptTemplate',
            entity_id=str(instance.id),
            user=self.request.user,
            details={
                'name': instance.name,
                'version': instance.version
            }
        )
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """克隆Prompt模板"""
        try:
            template = self.get_object()
            
            # 创建新的克隆模板
            cloned_template = PromptTemplate.objects.create(
                name=f"{template.name} (克隆)",
                description=template.description,
                system_prompt=template.system_prompt,
                field_prompts=template.field_prompts,
                llm_model=template.llm_model,
                temperature=template.temperature,
                top_p=template.top_p,
                is_active=False,  # 克隆的模板默认为非激活状态
                version=1,
                created_by=request.user
            )
            
            # 记录审计日志
            AuditLog.objects.create(
                action=AuditLog.ACTION_CLONE,
                entity_type='PromptTemplate',
                entity_id=str(cloned_template.id),
                user=request.user,
                details={
                    'source_template_id': str(template.id),
                    'source_template_name': template.name
                }
            )
            
            serializer = self.get_serializer(cloned_template)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """激活指定的Prompt模板"""
        try:
            with transaction.atomic():
                # 先将所有模板设置为非激活
                PromptTemplate.objects.update(is_active=False)
                
                # 激活当前模板
                template = self.get_object()
                template.is_active = True
                template.save()
                
                # 记录审计日志
                AuditLog.objects.create(
                    action=AuditLog.ACTION_ACTIVATE,
                    entity_type='PromptTemplate',
                    entity_id=str(template.id),
                    user=request.user,
                    details={
                        'name': template.name,
                        'version': template.version
                    }
                )
                
                return Response({
                    'status': 'activated',
                    'template_id': template.id
                })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取当前激活的Prompt模板"""
        try:
            template = PromptTemplate.objects.get(is_active=True)
            serializer = self.get_serializer(template)
            return Response(serializer.data)
        except PromptTemplate.DoesNotExist:
            return Response({
                'error': 'No active template found'
            }, status=status.HTTP_404_NOT_FOUND)

class PromptTestResultViewSet(viewsets.ModelViewSet):
    """Prompt测试结果视图集"""
    queryset = PromptTestResult.objects.all().order_by('-created_at')
    serializer_class = PromptTestResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # 支持按模板过滤
        template_id = self.request.query_params.get('template_id')
        if template_id:
            queryset = queryset.filter(prompt_template_id=template_id)
        
        # 支持按字段过滤
        field_key = self.request.query_params.get('field_key')
        if field_key:
            queryset = queryset.filter(field_key=field_key)
        
        return queryset
    
    def perform_create(self, serializer):
        # 创建测试结果
        test_result = serializer.save()
        
        # 记录审计日志
        AuditLog.objects.create(
            action=AuditLog.ACTION_TEST,
            entity_type='PromptTestResult',
            entity_id=str(test_result.id),
            user=self.request.user,
            details={
                'template_id': str(test_result.prompt_template.id),
                'field_key': test_result.field_key,
                'success': test_result.success,
                'evaluation_score': test_result.evaluation_score
            }
        )
    
    @action(detail=False, methods=['post'])
    def run_test(self, request):
        """运行Prompt测试"""
        serializer = PromptTestCreateSerializer(data=request.data)
        if serializer.is_valid():
            template_id = serializer.validated_data['prompt_template_id']
            field_key = serializer.validated_data['field_key']
            sample_text = serializer.validated_data['sample_text']
            expected_output = serializer.validated_data['expected_output']
            
            try:
                template = PromptTemplate.objects.get(id=template_id)
                
                # 构建测试Prompt
                test_prompt = build_test_prompt(template, field_key, sample_text)
                
                # 模拟模型调用（实际应用中应该调用真实的LLM服务）
                actual_output = simulate_model_call(test_prompt)
                
                # 评估测试结果
                success, score = evaluate_test_result(expected_output, actual_output)
                
                # 保存测试结果
                test_result = PromptTestResult.objects.create(
                    prompt_template=template,
                    field_key=field_key,
                    sample_text=sample_text,
                    expected_output=expected_output,
                    actual_output=actual_output,
                    success=success,
                    evaluation_score=score
                )
                
                # 记录审计日志
                AuditLog.objects.create(
                    action=AuditLog.ACTION_RUN_TEST,
                    entity_type='PromptTest',
                    user=request.user,
                    details={
                        'template_id': str(template.id),
                        'field_key': field_key,
                        'success': success,
                        'score': score
                    },
                    prompt_text=test_prompt
                )
                
                return Response({
                    'test_result_id': test_result.id,
                    'actual_output': actual_output,
                    'success': success,
                    'evaluation_score': score
                })
            except PromptTemplate.DoesNotExist:
                return Response(
                    {'error': 'Prompt template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """获取测试统计信息"""
        from django.db.models import Avg
        
        template_id = request.query_params.get('template_id')
        queryset = PromptTestResult.objects.all()
        
        if template_id:
            queryset = queryset.filter(prompt_template_id=template_id)
        
        total_tests = queryset.count()
        if total_tests == 0:
            return Response({
                'total_tests': 0,
                'success_rate': 0.0,
                'average_score': 0.0
            })
        
        success_count = queryset.filter(success=True).count()
        avg_score = queryset.aggregate(Avg('evaluation_score'))['evaluation_score__avg'] or 0.0
        
        return Response({
            'total_tests': total_tests,
            'success_count': success_count,
            'success_rate': success_count / total_tests if total_tests > 0 else 0.0,
            'average_score': round(float(avg_score), 2)
        })

# 辅助函数
def build_test_prompt(template, field_key, sample_text):
    """构建测试用的Prompt"""
    # 获取字段对应的Prompt
    field_prompt = template.field_prompts.get(field_key, '')
    
    prompt = f"""
{template.system_prompt}

任务：请从下面的上下文中提取字段 {field_key}。
{field_prompt}

上下文：
{sample_text}

请直接返回提取的值，不要包含其他解释。
"""
    
    return prompt

def simulate_model_call(prompt):
    """模拟模型调用（实际应用中应该调用真实的LLM服务）"""
    # 简单的模拟实现
    # 在实际应用中，这里应该调用真实的LLM API
    import re
    
    # 模拟一些常见字段的提取结果
    if '姓名' in prompt:
        match = re.search(r'姓名[：:]([\u4e00-\u9fa5]+)', prompt)
        if match:
            return match.group(1)
    elif '日期' in prompt:
        match = re.search(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})', prompt)
        if match:
            return match.group(1)
    elif '金额' in prompt:
        match = re.search(r'(\d+(?:\.\d+)?)元', prompt)
        if match:
            return match.group(1)
    
    # 默认返回空字符串
    return ""

def evaluate_test_result(expected, actual):
    """评估测试结果"""
    if not expected and not actual:
        return True, 1.0
    
    if not expected or not actual:
        return False, 0.0
    
    # 简单的字符串匹配评估
    expected_lower = expected.lower().strip()
    actual_lower = actual.lower().strip()
    
    if expected_lower == actual_lower:
        return True, 1.0
    
    # 部分匹配
    if expected_lower in actual_lower or actual_lower in expected_lower:
        # 计算匹配度分数
        if len(expected_lower) > len(actual_lower):
            score = len(actual_lower) / len(expected_lower)
        else:
            score = len(expected_lower) / len(actual_lower)
        return score >= 0.8, score
    
    return False, 0.0
