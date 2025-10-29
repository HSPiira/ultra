from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.medical_catalog.api.serializers import HospitalItemPriceSerializer
from apps.medical_catalog.models import HospitalItemPrice
from apps.medical_catalog.services import HospitalItemPriceService


class HospitalItemPriceViewSet(viewsets.ModelViewSet):
    serializer_class = HospitalItemPriceSerializer
    queryset = HospitalItemPrice.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["status", "hospital", "available"]
    search_fields = []
    ordering_fields = ["created_at", "updated_at", "amount"]

    def create(self, request, *args, **kwargs):
        try:
            instance = HospitalItemPriceService.create(data=request.data, user=request.user)
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Invalid data', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        try:
            instance = HospitalItemPriceService.update(
                price_id=kwargs["pk"], data=request.data, user=request.user
            )
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({'error': 'Validation failed', 'details': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Invalid data', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        HospitalItemPriceService.deactivate(price_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
