from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Document(models.Model):
    """文档模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    filename = models.CharField(max_length=255)
    source_type = models.CharField(max_length=20)  # pdf, word, image
    status = models.CharField(max_length=20, default='uploaded')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    created_at = models.DateTimeField(auto_now_add=True)
    storage_path = models.TextField()
    
    def __str__(self):
        return f"{self.filename} ({self.source_type})"

class DocumentPage(models.Model):
    """文档页面模型"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='pages')
    page_num = models.IntegerField()
    text = models.TextField()
    image_path = models.TextField()
    layout_json = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.document.filename} - 第{self.page_num}页"
