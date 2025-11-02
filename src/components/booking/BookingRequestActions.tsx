import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Booking } from '@/types';
import { useBooking } from '@/hooks/use-booking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, DollarSign, MapPin, Shield, User, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDate, formatPrice } from '@/lib/utils';

interface BookingRequestActionsProps {
  booking: Booking;
  onStatusChange: () => void;
}

export const BookingRequestActions = ({ booking, onStatusChange }: BookingRequestActionsProps) => {
  const { loading, acceptBooking, declineBooking } = useBooking();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectionStep, setRejectionStep] = useState<'reason' | 'confirm'>('reason');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  // Vérifie si l'action est encore possible
  const canTakeAction = booking.status === 'pending';
  
  // Formater les dates
  const formattedStartDate = format(new Date(booking.startDate), 'PPP', { locale: fr });
  const formattedEndDate = format(new Date(booking.endDate), 'PPP', { locale: fr });
  
  // Fonction pour accepter la réservation
  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptBooking(booking.id);
      toast({
        title: 'Réservation acceptée',
        description: 'Vous avez accepté cette demande de réservation.',
      });
      onStatusChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'acceptation de la réservation.',
        variant: 'destructive',
      });
      console.error('Accept booking error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Fonction pour refuser la réservation
  const handleDecline = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message requis',
        description: 'Veuillez indiquer un motif de refus pour le locataire.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await declineBooking(booking.id, message);
      toast({
        title: 'Réservation refusée',
        description: 'Vous avez refusé cette demande de réservation.',
      });
      onStatusChange();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du refus de la réservation.',
        variant: 'destructive',
      });
      console.error('Decline booking error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Statut de la demande traduit
  const getStatusBadge = () => {
    switch (booking.status) {
      case 'pending':
        return <Badge variant="warning">En attente</Badge>;
      case 'accepted':
        return <Badge variant="success">Acceptée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge>{booking.status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle demande de réservation</CardTitle>
          <CardDescription>
            {booking.renterName} souhaite louer votre véhicule {booking.vehicleName} du {formatDate(booking.startDate)} au {formatDate(booking.endDate)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations sur le locataire */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-medium mb-2">Informations sur le locataire</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Nom:</span> {booking.renterName}</p>
              <p><span className="font-medium">Email:</span> {booking.renterEmail}</p>
              {booking.renterPhone && (
                <p><span className="font-medium">Téléphone:</span> {booking.renterPhone}</p>
              )}
            </div>
          </div>
          
          {/* Détails de la réservation */}
          <div>
            <h3 className="font-medium mb-2">Détails de la réservation</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Dates:</span>
              <span>
                Du {formatDate(booking.startDate)} au {formatDate(booking.endDate)}
              </span>
              
              <span>Durée:</span>
              <span>{booking.durationDays} jour{booking.durationDays > 1 ? 's' : ''}</span>
              
              <span>Prix journalier:</span>
              <span>{formatPrice(Number(booking.dailyRate))}</span>
              
              <span className="font-medium pt-2">Total:</span>
              <span className="font-medium pt-2">{formatPrice(Number(booking.totalAmount))}</span>
            </div>
          </div>
          
          {/* Message en cas de refus */}
          <div className="space-y-2">
            <h3 className="font-medium">Message en cas de refus (obligatoire)</h3>
            <Textarea
              placeholder="Merci pour votre demande. Malheureusement..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Avertissement */}
          <div className="flex items-start space-x-2 text-sm text-muted-foreground border border-muted p-3 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              Une fois la réservation acceptée, le locataire recevra vos coordonnées et pourra 
              vous contacter pour organiser la prise en charge du véhicule.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3 justify-end border-t pt-4">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Refuser
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accepter
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}; 