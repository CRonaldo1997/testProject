from celery import shared_task
from celery.utils.log import get_task_logger
from django.db import transaction
import json
import re
from datetime import datetime

from extractions.models import ExtractionResult, FieldDefinition
from documents.models import Document, DocumentPage
from prompts.models import PromptTemplate
from audit.models import AuditLog, SystemLog

logger = get_task_logger(__name__)

@shared_task
def extract_fields(document_id, prompt_template_id=None):
    """
    抽取字段任务
    1. 获取文档和字段定义
    2. 组合Prompt
    3. 调用模型进行抽取
    4. 保存抽取结果
    """
    try:
        document = Document.objects.get(id=document_id)
        logger.info(f"开始抽取文档字段: {document.filename}")
        
        # 更新文档状态
        document.status = 'extracting'
        document.save()
        
        # 获取Prompt模板
        if prompt_template_id:
            prompt_template = PromptTemplate.objects.get(id=prompt_template_id)
        else:
            # 使用默认激活的模板
            prompt_template = PromptTemplate.objects.filter(is_active=True).order_by('-created_at').first()
            if not prompt_template:
                raise ValueError("未找到可用的Prompt模板")
        
        # 获取所有字段定义
        field_definitions = FieldDefinition.objects.filter().order_by('ui_order')
        
        # 获取文档所有页面文本
        document_pages = DocumentPage.objects.filter(document=document).order_by('page_num')
        
        # 抽取结果
        results = []
        
        for field_def in field_definitions:
            try:
                # 组合Prompt
                prompt = compose_prompt(field_def, prompt_template, document_pages)
                
                # 调用模型进行抽取（这里使用模拟实现）
                extraction_result = call_extraction_model(prompt, field_def, document_pages)
                
                # 保存抽取结果
                with transaction.atomic():
                    result = ExtractionResult.objects.create(
                        document=document,
                        field_def=field_def,
                        value_raw=extraction_result['value'],
                        normalized_value=normalize_value(extraction_result['value'], field_def),
                        confidence=extraction_result['confidence'],
                        page_num=extraction_result.get('page_num'),
                        bbox=extraction_result.get('bbox'),
                        model_name=prompt_template.llm_model,
                        model_version="1.0",
                        prompt_version=prompt_template.version
                    )
                    results.append(result)
                
                # 记录审计日志
                AuditLog.objects.create(
                    action=AuditLog.ACTION_EXTRACT,
                    entity_type='ExtractionResult',
                    entity_id=str(result.id),
                    details={
                        'document_id': str(document.id),
                        'field_key': field_def.key,
                        'value': extraction_result['value'],
                        'confidence': extraction_result['confidence']
                    },
                    prompt_text=prompt,
                    model_response=json.dumps(extraction_result)
                )
                
            except Exception as e:
                logger.error(f"字段 {field_def.key} 抽取失败: {str(e)}")
                SystemLog.objects.create(
                    level=SystemLog.LEVEL_ERROR,
                    message=f"字段抽取失败: {field_def.key}",
                    source='field_extraction',
                    context={'document_id': str(document.id), 'field_key': field_def.key, 'error': str(e)}
                )
        
        # 更新文档状态
        document.status = 'extracted'
        document.save()
        
        logger.info(f"文档字段抽取完成: {document.filename}, 抽取字段数: {len(results)}")
        
        return {
            'status': 'success',
            'document_id': str(document.id),
            'extracted_fields': len(results)
        }
        
    except Exception as e:
        logger.error(f"字段抽取任务失败: {str(e)}")
        
        # 更新文档状态
        if 'document' in locals():
            document.status = 'failed'
            document.save()
        
        SystemLog.objects.create(
            level=SystemLog.LEVEL_ERROR,
            message=f"字段抽取任务失败: {str(e)}",
            source='field_extraction',
            context={'document_id': str(document_id) if 'document_id' in locals() else None}
        )
        
        raise

def compose_prompt(field_def, prompt_template, document_pages):
    """组合抽取Prompt"""
    # 如果字段有自定义Prompt，优先使用
    if field_def.custom_prompt:
        return field_def.custom_prompt
    
    # 获取字段对应的Prompt
    field_prompt = prompt_template.field_prompts.get(field_def.key, '')
    
    # 组合上下文（合并前几页文本，限制长度）
    context = ''
    max_context_length = 2000
    
    for page in document_pages[:3]:  # 只使用前3页
        context += f"\n==== 第{page.page_num}页 ====\n"
        context += page.text
        if len(context) > max_context_length:
            context = context[:max_context_length]
            break
    
    # 构建完整Prompt
    prompt = f"""
{prompt_template.system_prompt}

任务：请从下面的上下文中提取字段 [{field_def.label}]。
{field_prompt}

字段信息：
- 字段类型：{field_def.data_type}
- 必填：{'是' if field_def.required else '否'}
- 合法枚举值：{', '.join(field_def.enum_values) if field_def.enum_values else '无'}

上下文：
{context}

请以JSON格式返回结果，包含value（提取的值）和confidence（置信度0-1之间）。
如果找不到，请返回value为空字符串，confidence为0。
"""
    
    return prompt

def call_extraction_model(prompt, field_def, document_pages):
    """
    调用抽取模型（这里使用模拟实现）
    在实际应用中，这里应该调用LangExtract/ContextGem等模型服务
    """
    # 模拟LLM调用的实现
    # 实际应用中需要替换为真实的API调用
    
    # 简单的基于规则的模拟抽取
    # 这只是为了演示，实际应用中应该调用真实的LLM服务
    
    # 合并所有页面文本用于搜索
    all_text = '\n'.join([page.text for page in document_pages])
    
    # 根据字段类型和关键词进行简单匹配
    value = ""
    confidence = 0.5
    page_num = 1
    bbox = None
    
    # 模拟一些常见字段的抽取规则
    if field_def.key == 'company_name':
        # 查找公司名称关键词
        patterns = ['保险公司', '保险股份有限公司', '保险集团']
        for pattern in patterns:
            if pattern in all_text:
                # 简单提取公司名称（实际需要更复杂的逻辑）
                import re
                match = re.search(r'([\u4e00-\u9fa5]+)' + re.escape(pattern), all_text)
                if match:
                    value = match.group(1) + pattern
                    confidence = 0.85
                    break
    
    elif field_def.key == 'policy_number':
        # 查找保单号
        match = re.search(r'保单号[：:](\w+)', all_text)
        if match:
            value = match.group(1)
            confidence = 0.9
    
    elif field_def.key == 'insured_name':
        # 查找被保险人姓名
        match = re.search(r'被保险人[：:]([\u4e00-\u9fa5]+)', all_text)
        if match:
            value = match.group(1)
            confidence = 0.8
    
    elif field_def.data_type == 'date':
        # 查找日期格式
        match = re.search(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})', all_text)
        if match:
            value = match.group(1)
            confidence = 0.95
    
    elif field_def.data_type == 'amount':
        # 查找金额
        match = re.search(r'(\d+(?:\.\d+)?)元', all_text)
        if match:
            value = match.group(1)
            confidence = 0.9
    
    # 如果没有匹配到，尝试从field_prompt中提取关键词进行搜索
    if not value and hasattr(field_def, 'custom_prompt') and field_def.custom_prompt:
        # 简单的关键词搜索
        keywords = ['姓名', '日期', '金额', '号码', '公司']
        for keyword in keywords:
            if keyword in field_def.custom_prompt and keyword in all_text:
                # 提取关键词附近的文本
                idx = all_text.find(keyword)
                value = all_text[max(0, idx-20):idx+50].strip()
                confidence = 0.6
                break
    
    # 如果还是没有找到，返回空值
    if not value:
        value = ""
        confidence = 0.0
    
    return {
        'value': value,
        'confidence': confidence,
        'page_num': page_num,
        'bbox': bbox
    }

def normalize_value(value, field_def):
    """标准化字段值"""
    if not value:
        return value
    
    # 根据字段类型进行标准化
    if field_def.data_type == 'date':
        # 尝试标准化日期格式
        try:
            # 处理常见的日期格式
            for fmt in ['%Y-%m-%d', '%Y/%m/%d', '%Y年%m月%d日']:
                try:
                    date_obj = datetime.strptime(value, fmt)
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        except Exception:
            pass
    
    elif field_def.data_type == 'amount':
        # 提取数字金额
        try:
            # 移除货币符号和单位
            amount_str = re.sub(r'[^\d.]', '', value)
            return str(float(amount_str))
        except Exception:
            pass
    
    elif field_def.data_type == 'enum' and field_def.enum_values:
        # 匹配枚举值（模糊匹配）
        value_lower = value.lower()
        for enum_val in field_def.enum_values:
            if enum_val.lower() in value_lower or value_lower in enum_val.lower():
                return enum_val
    
    # 默认返回原始值
    return value