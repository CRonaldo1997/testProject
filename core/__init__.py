from __future__ import absolute_import, unicode_literals

# 确保Celery应用在Django启动时被加载
from .celery import app as celery_app

__all__ = ('celery_app',)