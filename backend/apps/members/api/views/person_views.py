from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.members.api.serializers import BulkPersonRowSerializer, PersonSerializer
from apps.members.models import Person
from apps.members.selectors.person_selector import person_list
from apps.members.services.person_service import PersonService


class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    queryset = Person.objects.all()

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["company", "scheme", "status", "relationship", "parent"]
    search_fields = ["name", "card_number", "national_id", "email", "phone_number"]
    ordering_fields = ["created_at", "updated_at", "name"]

    def get_queryset(self):
        query = self.request.query_params.get("search", "").strip()
        filters_dict = {
            "company": self.request.query_params.get("company"),
            "scheme": self.request.query_params.get("scheme"),
            "status": self.request.query_params.get("status"),
            "relationship": self.request.query_params.get("relationship"),
            "parent": self.request.query_params.get("parent"),
            "query": query,
        }
        return person_list(filters=filters_dict)

    def create(self, request, *args, **kwargs):
        person = PersonService.person_create(
            person_data=request.data, user=request.user
        )
        serializer = self.get_serializer(person)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        person = PersonService.person_update(
            person_id=kwargs["pk"], update_data=request.data, user=request.user
        )
        serializer = self.get_serializer(person)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        PersonService.person_deactivate(person_id=kwargs["pk"], user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def bulk_import(self, request):
        company = request.data.get("company")
        scheme = request.data.get("scheme")
        dry_run = bool(request.data.get("dry_run", False))
        rows = request.data.get("rows") or []

        # Validate rows shape quickly
        row_serializer = BulkPersonRowSerializer(data=rows, many=True)
        row_serializer.is_valid(raise_exception=True)

        report = PersonService.persons_bulk_import(
            company_id=company,
            scheme_id=scheme,
            rows=row_serializer.validated_data,
            user=request.user,
            dry_run=dry_run,
        )
        return Response(report, status=status.HTTP_200_OK)
