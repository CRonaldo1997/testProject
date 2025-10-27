from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class PromptTemplate(models.Model):
    """Prompt模板模型"""
    name = models.CharField(max_length=100, help_text="模板名称")
    system_prompt = models.TextField(help_text="系统提示词")
    field_prompts = models.JSONField(help_text="字段提示词映射")  # {"company_name": "提取公司名", ...}
    default_prompt = models.TextField(help_text="默认提示词")
    llm_model = models.CharField(max_length=100, default="gpt-4-turbo", help_text="使用的LLM模型")
    version = models.IntegerField(default=1, help_text="模板版本")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_prompts')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, help_text="是否激活")
    
    def __str__(self):
        return f"{self.name} (v{self.version})"
    
    class Meta:
        unique_together = ['name', 'version']
        ordering = ['-created_at']

class PromptTestResult(models.Model):
    """Prompt测试结果模型"""
    prompt_template = models.ForeignKey(PromptTemplate, on_delete=models.SET_NULL, null=True, related_name='test_results')
    field_key = models.CharField(max_length=100, help_text="测试的字段")
    sample_text = models.TextField(help_text="测试样本文本")
    extracted_value = models.TextField(null=True, blank=True, help_text="抽取的值")
    confidence = models.FloatField(default=0.0, help_text="置信度")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='prompt_test_results')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.prompt_template.name} - {self.field_key} - 测试于 {self.created_at}"
