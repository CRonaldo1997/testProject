from rest_framework.routers import DefaultRouter
from extractions.views import (
    FieldDefinitionViewSet,
    ExtractionResultViewSet,
    VerificationRecordViewSet
)

router = DefaultRouter()
router.register(r'field-definitions', FieldDefinitionViewSet)
router.register(r'extraction-results', ExtractionResultViewSet)
router.register(r'verification-records', VerificationRecordViewSet)

urlpatterns = router.urls