from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
import os
import uuid
from datetime import datetime

from documents.models import Document
from documents.serializers import DocumentSerializer, DocumentCreateSerializer
from documents.tasks import process_document_async
from audit.models import AuditLog

class DocumentViewSet(viewsets.ModelViewSet):
    """文档视图集"""
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return DocumentCreateSerializer
        return DocumentSerializer
    
    def perform_create(self, serializer):
        # 处理文件上传
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            raise ValueError("请上传文件")
        
        # 生成唯一文件名
        ext = os.path.splitext(file_obj.name)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        # 确保上传目录存在
        upload_dir = os.path.join(os.getcwd(), 'uploads', datetime.now().strftime('%Y%m%d'))
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(upload_dir, unique_filename)
        with open(file_path, 'wb') as f:
            for chunk in file_obj.chunks():
                f.write(chunk)
        
        # 计算相对路径用于存储
        relative_path = os.path.join('uploads', datetime.now().strftime('%Y%m%d'), unique_filename)
        
        # 获取文件类型
        source_type = self._get_file_type(ext)
        
        # 创建文档记录
        document = serializer.save(
            filename=file_obj.name,
            source_type=source_type,
            storage_path=relative_path,
            uploaded_by=self.request.user
        )
        
        # 记录审计日志
        AuditLog.objects.create(
            action=AuditLog.ACTION_UPLOAD,
            entity_type='Document',
            entity_id=str(document.id),
            user=self.request.user,
            details={
                'filename': file_obj.name,
                'source_type': source_type,
                'size': file_obj.size
            }
        )
        
        # 异步处理文档
        process_document_async.delay(document.id)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """下载文档"""
        try:
            document = self.get_object()
            file_path = os.path.join(os.getcwd(), document.storage_path)
            
            if not os.path.exists(file_path):
                return Response({'error': '文件不存在'}, status=status.HTTP_404_NOT_FOUND)
            
            # 记录下载日志
            AuditLog.objects.create(
                action=AuditLog.ACTION_DOWNLOAD,
                entity_type='Document',
                entity_id=str(document.id),
                user=request.user,
                details={'filename': document.filename}
            )
            
            return FileResponse(
                open(file_path, 'rb'),
                as_attachment=True,
                filename=document.filename
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def reprocess(self, request, pk=None):
        """重新处理文档"""
        try:
            document = self.get_object()
            
            # 更新文档状态
            document.status = 'pending'
            document.save()
            
            # 重新触发异步处理
            process_document_async.delay(document.id)
            
            # 记录日志
            AuditLog.objects.create(
                action=AuditLog.ACTION_REPROCESS,
                entity_type='Document',
                entity_id=str(document.id),
                user=request.user,
                details={'document_id': str(document.id)}
            )
            
            return Response({'status': 'processing'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """获取文档统计信息"""
        stats = {
            'total': Document.objects.count(),
            'pending': Document.objects.filter(status='pending').count(),
            'processing': Document.objects.filter(status='processing').count(),
            'processed': Document.objects.filter(status='processed').count(),
            'extracting': Document.objects.filter(status='extracting').count(),
            'extracted': Document.objects.filter(status='extracted').count(),
            'failed': Document.objects.filter(status='failed').count(),
        }
        
        return Response(stats)
    
    def _get_file_type(self, ext):
        """根据文件扩展名判断文件类型"""
        ext = ext.lower()
        if ext in ['.pdf']:
            return 'pdf'
        elif ext in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp']:
            return 'image'
        elif ext in ['.doc', '.docx']:
            return 'word'
        else:
            return 'other'
