from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import fitz  # PyMuPDF
import json

from documents.models import Document, DocumentPage
from audit.models import AuditLog, SystemLog

logger = get_task_logger(__name__)

@shared_task
def preprocess_document(document_id):
    """
    预处理文档任务
    1. 根据文档类型使用不同的处理方式
    2. 提取文本和布局信息
    3. 创建DocumentPage记录
    """
    try:
        document = Document.objects.get(id=document_id)
        logger.info(f"开始预处理文档: {document.filename}")
        
        # 更新文档状态
        document.status = 'processing'
        document.save()
        
        # 创建存储目录
        pages_dir = os.path.join('document_pages', str(document.id))
        os.makedirs(settings.MEDIA_ROOT / pages_dir, exist_ok=True)
        
        # 根据文档类型进行处理
        if document.source_type == 'pdf':
            process_pdf(document, pages_dir)
        elif document.source_type == 'image':
            process_image(document, pages_dir)
        elif document.source_type == 'word':
            # TODO: 实现Word文档处理
            process_word(document, pages_dir)
        else:
            raise ValueError(f"不支持的文档类型: {document.source_type}")
        
        # 更新文档状态为已处理
        document.status = 'preprocessed'
        document.save()
        
        logger.info(f"文档预处理完成: {document.filename}")
        
        # 记录系统日志
        SystemLog.objects.create(
            level=SystemLog.LEVEL_INFO,
            message=f"文档预处理成功",
            source='document_preprocess',
            context={'document_id': str(document.id), 'filename': document.filename}
        )
        
        return {'status': 'success', 'document_id': str(document.id)}
        
    except Exception as e:
        logger.error(f"文档预处理失败: {str(e)}")
        
        # 更新文档状态为失败
        if 'document' in locals():
            document.status = 'failed'
            document.save()
        
        # 记录错误日志
        SystemLog.objects.create(
            level=SystemLog.LEVEL_ERROR,
            message=f"文档预处理失败: {str(e)}",
            source='document_preprocess',
            context={'document_id': str(document_id) if 'document_id' in locals() else None}
        )
        
        raise

def process_pdf(document, pages_dir):
    """处理PDF文档"""
    pdf_path = os.path.join(settings.MEDIA_ROOT, document.storage_path)
    
    with fitz.open(pdf_path) as pdf:
        for page_num in range(len(pdf)):
            page = pdf[page_num]
            
            # 提取文本
            text = page.get_text()
            
            # 提取文本块和坐标
            blocks = page.get_text('dict')['blocks']
            layout_data = []
            
            for block in blocks:
                if 'lines' in block:
                    for line in block['lines']:
                        for span in line['spans']:
                            layout_data.append({
                                'text': span['text'],
                                'bbox': [span['bbox'][0], span['bbox'][1], span['bbox'][2], span['bbox'][3]],
                                'size': span['size']
                            })
            
            # 保存页面图像
            pix = page.get_pixmap()
            img_bytes = pix.tobytes()
            image_filename = f"page_{page_num + 1}.png"
            image_path = os.path.join(pages_dir, image_filename)
            
            with default_storage.open(image_path, 'wb') as f:
                f.write(img_bytes)
            
            # 创建DocumentPage记录
            DocumentPage.objects.create(
                document=document,
                page_num=page_num + 1,
                text=text,
                image_path=image_path,
                layout_json=layout_data
            )

def process_image(document, pages_dir):
    """处理图像文档"""
    image_path = os.path.join(settings.MEDIA_ROOT, document.storage_path)
    
    # 延迟导入PaddleOCR
    from paddleocr import PaddleOCR
    
    # 在函数内部初始化OCR引擎
    ocr = PaddleOCR(use_angle_cls=True, lang='ch')
    
    # 使用PaddleOCR识别文本
    result = ocr.ocr(image_path, cls=True)
    
    # 提取文本和坐标
    text = ''
    layout_data = []
    
    if result and result[0]:
        for line in result[0]:
            line_text = ''.join([item[1][0] for item in line])
            text += line_text + '\n'
            
            # 获取边界框
            for item in line:
                bbox = item[0]
                text_content = item[1][0]
                confidence = item[1][1]
                
                layout_data.append({
                    'text': text_content,
                    'bbox': [bbox[0][0], bbox[0][1], bbox[2][0], bbox[2][1]],
                    'confidence': float(confidence)
                })
    
    # 复制图像到页面目录
    image_filename = "page_1.png"
    dest_path = os.path.join(pages_dir, image_filename)
    
    with open(image_path, 'rb') as f:
        with default_storage.open(dest_path, 'wb') as dest:
            dest.write(f.read())
    
    # 创建DocumentPage记录
    DocumentPage.objects.create(
        document=document,
        page_num=1,
        text=text,
        image_path=dest_path,
        layout_json=layout_data
    )

def process_word(document, pages_dir):
    """处理Word文档（占位实现）"""
    # TODO: 实现Word文档处理逻辑
    # 可以使用python-docx库
    DocumentPage.objects.create(
        document=document,
        page_num=1,
        text="Word文档处理待实现",
        image_path="",
        layout_json=[]
    )

@shared_task
def process_document_async(document_id):
    """
    异步处理文档的任务
    供views.py调用的接口函数
    """
    return preprocess_document.delay(document_id)