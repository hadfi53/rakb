import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Booking, 
  BookingStatus,
  PaymentStatus
} from '@/types';
import { useBooking } from '@/hooks/use-booking';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  Car, 
  Shield, 
  Camera,
  CheckCircle,
  XCircle,
  Star,
  AlertCircle,
  FileText,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatPrice } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/lib/supabase/supabase-provider";

interface BookingDetailsProps {
  booking: Booking;
  userRole: 'renter' | 'owner';
  onAction?: (action: string) => void;
}

export const BookingDetails = ({ booking, userRole, onAction }: BookingDetailsProps) => {
  const { loading, shareContactDetails, confirmBookingPayment, cancelBooking } = useBooking();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [rating, setRating] = useState(booking.rating || 0);
  const { toast } = useToast();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const resolvedBookingId = (booking as any)?.id || (booking as any)?.booking_id;
  
  // Formater les dates
  const formattedStartDate = format(new Date(booking.startDate), 'PPP', { locale: fr });
  const formattedEndDate = format(new Date(booking.endDate), 'PPP', { locale: fr });
  
  // Durée totale en jours
  const durationDays = differenceInDays(new Date(booking.endDate), new Date(booking.startDate)) + 1;
  
  // Détermine la couleur du badge en fonction du statut
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">En attente</Badge>;
      case 'confirmed':
        return <Badge variant="info">Confirmée</Badge>;
      case 'in_progress':
        return <Badge variant="success">En cours</Badge>;
      case 'completed':
        return <Badge variant="purple">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Détermine la couleur du badge pour le statut de paiement
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'preauthorized':
        return <Badge variant="warning">Préautorisé</Badge>;
      case 'charged':
        return <Badge variant="success">Payé</Badge>;
      case 'refunded':
        return <Badge variant="info">Remboursé</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      case 'partial_refund':
        return <Badge variant="info">Remboursement partiel</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Traduction des statuts pour affichage
  const getStatusText = (status: BookingStatus) => {
    const statusMap: Record<BookingStatus, string> = {
      'pending': 'En attente de confirmation',
      'confirmed': 'Réservation confirmée',
      'in_progress': 'Location en cours',
      'completed': 'Location terminée',
      'cancelled': 'Réservation annulée',
      'rejected': 'Demande refusée',
      'expired': 'Réservation expirée'
    };
    
    return statusMap[status] || status;
  };
  
  // Actions possibles en fonction du statut et du rôle
  const getPrimaryAction = () => {
    if (userRole === 'renter') {
      if (booking.status === 'pending') {
        return {
          label: 'Confirmer et payer',
          action: 'confirm_payment',
          disabled: loading
        };
      } else if (booking.status === 'confirmed') {
        return {
          label: 'Retrait du véhicule',
          action: 'vehicle_pickup',
          disabled: false
        };
      } else if (booking.status === 'in_progress') {
        return {
          label: 'Retour du véhicule',
          action: 'vehicle_return',
          disabled: false
        };
      }
    } else if (userRole === 'owner') {
      if (booking.status === 'confirmed') {
        return {
          label: 'Retrait du véhicule',
          action: 'vehicle_pickup',
          disabled: false
        };
      } else if (booking.status === 'in_progress') {
        return {
          label: 'Retour du véhicule',
          action: 'vehicle_return',
          disabled: false
        };
      }
    }
    
    return null;
  };
  
  // Gestion des actions
  const handleAction = async (action: string) => {
    switch (action) {
      case 'confirm_payment':
        await confirmBookingPayment(booking.id);
        break;
      case 'share_contact':
        await shareContactDetails(booking.id);
        break;
      case 'vehicle_pickup':
      case 'vehicle_return':
        if (onAction) {
          onAction(action);
        }
        break;
    }
  };
  
  // Déterminer la personne avec qui l'utilisateur interagit
  const counterpart = userRole === 'renter' ? booking.owner : booking.renter;
  
  // Déterminer les actions disponibles selon le statut et le rôle
  const renderActions = () => {
    if (userRole === 'renter') {
      switch (booking.status) {
        case 'pending':
          return (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          );
        case 'confirmed':
          return (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button 
                className="flex-1"
                onClick={() => onAction?.('start_rental')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Commencer
              </Button>
            </div>
          );
        case 'in_progress':
          return (
            <Button 
              className="w-full"
              onClick={() => onAction?.('complete_rental')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Terminer
            </Button>
          );
        case 'completed':
          return (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onAction?.('view_pickup_checklist')}
              >
                État initial
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onAction?.('view_return_checklist')}
              >
                État final
              </Button>
            </div>
          );
        default:
          return null;
      }
    } else { // Owner
      switch (booking.status) {
        case 'confirmed':
          return (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              {booking.pickupChecklist && (
                <Button 
                  className="flex-1"
                  onClick={() => onAction?.('start_rental')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Débuter la location
                </Button>
              )}
            </div>
          );
        case 'in_progress':
          return booking.returnChecklist && (
            <Button 
              className="w-full"
              onClick={() => onAction?.('complete_rental')}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Terminer la location
            </Button>
          );
        case 'completed':
          return (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onAction?.('view_pickup_checklist')}
              >
                État initial
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onAction?.('view_return_checklist')}
              >
                État final
              </Button>
            </div>
          );
        default:
          return null;
      }
    }
  };
  
  // État des lieux effectués
  const renderChecklistStatus = () => {
    return (
      <div className="flex flex-col space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">État des lieux initial:</span>
          {booking.pickupChecklist ? (
            <div className={cn("flex items-center", "text-green-600")}>
              <CheckCircle className="mr-1 h-3 w-3" />
              <span>Complété</span>
            </div>
          ) : (
            <div className={cn("flex items-center", "text-gray-500")}>
              <AlertCircle className="mr-1 h-3 w-3" />
              <span>Non effectué</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">État des lieux final:</span>
          {booking.returnChecklist ? (
            <div className={cn("flex items-center", "text-green-600")}>
              <CheckCircle className="mr-1 h-3 w-3" />
              <span>Complété</span>
            </div>
          ) : (
            <div className={cn("flex items-center", "text-gray-500")}>
              <AlertCircle className="mr-1 h-3 w-3" />
              <span>Non effectué</span>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Coordonnées de l'autre partie
  const renderContactInfo = () => {
    // N'afficher les coordonnées que si la réservation est confirmée ou en cours
    if (!['confirmed', 'in_progress', 'completed'].includes(booking.status)) {
      return null;
    }

    const contactName = userRole === 'renter' 
      ? (booking.ownerName || 'Propriétaire') 
      : (booking.renterName || 'Locataire');
    const contactEmail = userRole === 'renter' ? booking.ownerEmail : booking.renterEmail;
    const contactPhone = userRole === 'renter' ? booking.ownerPhone : booking.renterPhone;
    const contactAvatarUrl = userRole === 'renter' 
      ? (booking.ownerAvatarUrl || (booking as any).owner?.avatarUrl) 
      : (booking.renterAvatarUrl || (booking as any).renter?.avatarUrl);

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={contactAvatarUrl} alt={contactName} />
              <AvatarFallback>
                {contactName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{contactName || 'Non renseigné'}</span>
              </div>
            </div>
          </div>
          {contactEmail && (
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
              <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">
                {contactEmail}
              </a>
            </div>
          )}
          {contactPhone && (
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
              <a href={`tel:${contactPhone}`} className="text-primary hover:underline">
                {contactPhone}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Gérer le changement de note
  const handleRatingChange = async (value: number) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ rating: value })
        .eq('id', booking.id);

      if (error) throw error;

      setRating(value);
      toast({
        title: "Note mise à jour",
        description: "Merci d'avoir noté cette location !",
      });
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la note. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Ajouter le composant Rating après les coordonnées de contact
  const renderRating = () => {
    // N'afficher que pour le locataire et uniquement si la réservation est terminée
    if (userRole !== 'renter' || booking.status !== 'completed') {
      return null;
    }

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Noter votre expérience
          </CardTitle>
          <CardDescription>
            Comment s'est passée votre location ?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Rating
            value={rating}
            onChange={handleRatingChange}
            readonly={false}
            className="justify-center"
          />
        </CardContent>
      </Card>
    );
  };
  
  const handleCancel = async () => {
    try {
      await cancelBooking(booking.id);
      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée avec succès.",
      });
      setShowCancelDialog(false);
      if (onAction) {
        onAction('cancel');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la réservation. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Détails de la réservation</CardTitle>
          {getStatusBadge(booking.status)}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Détails du véhicule */}
          <div className="flex items-start gap-4">
            <div className="bg-muted rounded-md p-2">
              <Car className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {booking.vehicleName || 'Véhicule non spécifié'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {[booking.vehicleBrand, booking.vehicleModel, booking.vehicleYear]
                  .filter(Boolean)
                  .join(' ') || 'Informations non disponibles'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Dates et tarifs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Période de location</span>
              </div>
              <p>Du {formatDate(booking.startDate)} au {formatDate(booking.endDate)}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Lieu de prise en charge</span>
              </div>
              <p>{booking.pickupLocation || 'Non spécifié'}</p>
            </div>
          </div>

          <Separator />

          {/* Résumé des tarifs */}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Tarifs</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span>Prix journalier:</span>
              <span className="text-right">{formatPrice(Number(booking.dailyRate))}</span>
              
              <span>Nombre de jours:</span>
              <span className="text-right">{booking.durationDays} jours</span>
              
              <span>Sous-total:</span>
              <span className="text-right">{formatPrice(Number(booking.dailyRate) * Number(booking.durationDays))}</span>
              
              {booking.serviceFee > 0 && (
                <>
                  <span>Frais de service:</span>
                  <span className="text-right">{formatPrice(Number(booking.serviceFee))}</span>
                </>
              )}
              
              <span className="font-semibold pt-2">Total:</span>
              <span className="text-right font-semibold pt-2">{formatPrice(Number(booking.totalAmount))}</span>
              
              <span className="text-xs text-muted-foreground pt-2">Dépôt de garantie:</span>
              <span className="text-right text-xs text-muted-foreground pt-2">{formatPrice(Number(booking.depositAmount))}</span>
            </div>
          </div>

          {/* État de la checklist si applicable */}
          {['confirmed', 'in_progress', 'completed'].includes(booking.status) && renderChecklistStatus()}

          {/* Documents Section */}
          {(booking.paymentStatus === 'charged' || booking.paymentStatus === 'completed' || booking.status === 'confirmed') && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Documents</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => {
                      if (!resolvedBookingId) {
                        toast({ variant: "destructive", title: "ID manquant", description: "Impossible d'ouvrir la facture: identifiant indisponible." });
                        return;
                      }
                      navigate(`/bookings/${encodeURIComponent(resolvedBookingId)}/invoice`);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Facture
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => {
                      if (!resolvedBookingId) {
                        toast({ variant: "destructive", title: "ID manquant", description: "Impossible d'ouvrir le reçu: identifiant indisponible." });
                        return;
                      }
                      navigate(`/bookings/${encodeURIComponent(resolvedBookingId)}/receipt`);
                    }}
                  >
                    <Receipt className="h-4 w-4" />
                    Reçu
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    onClick={() => {
                      if (!resolvedBookingId) {
                        toast({ variant: "destructive", title: "ID manquant", description: "Impossible d'ouvrir le contrat: identifiant indisponible." });
                        return;
                      }
                      navigate(`/bookings/${encodeURIComponent(resolvedBookingId)}/contract`);
                    }}
                  >
                    <FileText className="h-4 w-4" />
                    Contrat
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {renderActions()}
        </CardFooter>
      </Card>

      {/* Informations de contact */}
      {renderContactInfo()}
      {renderRating()}

      {/* Dialog de confirmation d'annulation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'annulation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette réservation ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading ? "Annulation..." : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 