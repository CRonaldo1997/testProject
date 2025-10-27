from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction

from extractions.models import FieldDefinition, ExtractionResult, VerificationRecord
from extractions.serializers import (
    FieldDefinitionSerializer, 
    ExtractionResultSerializer, 
    VerificationRecordSerializer,
    DocumentExtractionResultsSerializer,
    ExtractionCreateSerializer
)
from extractions.tasks import extract_fields
from documents.models import Document
from audit.models import AuditLog

class FieldDefinitionViewSet(viewsets.ModelViewSet):
    """字段定义视图集"""
    queryset = FieldDefinition.objects.all().order_by('ui_order')
    serializer_class = FieldDefinitionSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        field = serializer.save()
        # 记录审计日志
        AuditLog.objects.create(
            action=AuditLog.ACTION_CREATE,
            entity_type='FieldDefinition',
            entity_id=str(field.id),
            user=self.request.user,
            details={
                'key': field.key,
                'label': field.label,
                'data_type': field.data_type
            }
        )
    
    def perform_update(self, serializer):
        old_field = self.get_object()
        new_field = serializer.save()
        # 记录审计日志
        AuditLog.objects.create(
            action=AuditLog.ACTION_UPDATE,
            entity_type='FieldDefinition',
            entity_id=str(new_field.id),
            user=self.request.user,
            details={
                'old_key': old_field.key,
                'new_key': new_field.key,
                'old_label': old_field.label,
                'new_label': new_field.label
            }
        )
    
    def perform_destroy(self, instance):
        # 记录审计日志
        AuditLog.objects.create(
            action=AuditLog.ACTION_DELETE,
            entity_type='FieldDefinition',
            entity_id=str(instance.id),
            user=self.request.user,
            details={
                'key': instance.key,
                'label': instance.label
            }
        )
        instance.delete()

class ExtractionResultViewSet(viewsets.ModelViewSet):
    """抽取结果视图集"""
    queryset = ExtractionResult.objects.all().order_by('-created_at')
    serializer_class = ExtractionResultSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # 支持按文档过滤
        document_id = self.request.query_params.get('document_id')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        # 支持按字段过滤
        field_key = self.request.query_params.get('field_key')
        if field_key:
            queryset = queryset.filter(field_def__key=field_key)
        
        # 支持按置信度过滤
        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            try:
                queryset = queryset.filter(confidence__gte=float(min_confidence))
            except ValueError:
                pass
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def document_results(self, request):
        """获取指定文档的所有抽取结果"""
        document_id = request.query_params.get('document_id')
        if not document_id:
            return Response(
                {'error': 'document_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            document = Document.objects.get(id=document_id)
            serializer = DocumentExtractionResultsSerializer(document)
            return Response(serializer.data)
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def extract(self, request):
        """创建抽取任务"""
        serializer = ExtractionCreateSerializer(data=request.data)
        if serializer.is_valid():
            document_id = serializer.validated_data['document_id']
            prompt_template_id = serializer.validated_data.get('prompt_template_id')
            
            try:
                document = Document.objects.get(id=document_id)
                
                # 异步执行抽取任务
                task = extract_fields.delay(document_id, prompt_template_id)
                
                # 记录审计日志
                AuditLog.objects.create(
                    action=AuditLog.ACTION_START_EXTRACTION,
                    entity_type='ExtractionTask',
                    user=request.user,
                    details={
                        'document_id': str(document_id),
                        'document_name': document.filename,
                        'prompt_template_id': prompt_template_id
                    }
                )
                
                return Response({
                    'status': 'extraction_started',
                    'document_id': document_id,
                    'task_id': task.id
                })
            except Document.DoesNotExist:
                return Response(
                    {'error': 'Document not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reextract(self, request, pk=None):
        """重新抽取单个字段"""
        try:
            result = self.get_object()
            
            # 异步执行抽取任务
            task = extract_fields.delay(result.document.id, None)
            
            return Response({
                'status': 'reextraction_started',
                'document_id': result.document.id,
                'field_key': result.field_def.key,
                'task_id': task.id
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerificationRecordViewSet(viewsets.ModelViewSet):
    """验证记录视图集"""
    queryset = VerificationRecord.objects.all().order_by('-timestamp')
    serializer_class = VerificationRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        with transaction.atomic():
            # 创建验证记录
            verification = serializer.save(user=self.request.user)
            
            # 如果验证通过且有校正值，更新抽取结果
            if verification.status == VerificationRecord.STATUS_CONFIRMED and verification.corrected_value:
                result = verification.result
                result.normalized_value = verification.corrected_value
                result.save()
            
            # 记录审计日志
            AuditLog.objects.create(
                action=AuditLog.ACTION_VERIFY,
                entity_type='VerificationRecord',
                entity_id=str(verification.id),
                user=self.request.user,
                details={
                    'extraction_result_id': str(verification.result.id),
                    'field_key': verification.result.field_def.key,
                    'status': verification.status,
                    'corrected_value': verification.corrected_value
                }
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """获取验证统计信息"""
        stats = {
            'total_verified': VerificationRecord.objects.count(),
            'confirmed': VerificationRecord.objects.filter(status=VerificationRecord.STATUS_CONFIRMED).count(),
            'corrected': VerificationRecord.objects.filter(status=VerificationRecord.STATUS_CORRECTED).count(),
            'rejected': VerificationRecord.objects.filter(status=VerificationRecord.STATUS_REJECTED).count(),
            'unverified': ExtractionResult.objects.filter(verification_records__isnull=True).count()
        }
        
        return Response(stats)
