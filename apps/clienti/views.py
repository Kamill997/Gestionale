from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.prenotazioni.services import sblocca_cliente

from .models import Cliente
from .serializers import ClienteSerializer

STAFF_ROLES = ('Amministratore', 'Operatore')


class ClienteViewSet(viewsets.ModelViewSet):
    """Anagrafica clienti: dati potenzialmente sensibili (note_preferenze
    puo' contenere dati sanitari, vedi docs/esempio-settore-parrucchiere.md
    "Nota" sul GDPR). Staff (Amministratore/Operatore) vede tutti i clienti;
    un utente con solo ruolo Cliente vede esclusivamente il proprio record.
    """

    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['nome', 'email', 'telefono']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.roles.filter(nome__in=STAFF_ROLES).exists():
            return Cliente.objects.all()
        return Cliente.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def sblocca(self, request, pk=None):
        """docs/08-pagamenti.md: "va previsto uno sblocco manuale da parte
        dell'amministratore" - esplicitamente Amministratore, non
        Operatore generico."""
        user = request.user
        if not (user.is_superuser or user.roles.filter(nome='Amministratore').exists()):
            return Response(
                {'detail': "Riservato all'Amministratore."}, status=status.HTTP_403_FORBIDDEN
            )
        cliente = self.get_object()
        sblocca_cliente(cliente, autore=user)
        return Response(ClienteSerializer(cliente, context={'request': request}).data)
