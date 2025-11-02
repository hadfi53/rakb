import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/hooks/use-booking';
import { BookingDetails } from '@/components/booking/BookingDetails';
import { BookingRequestActions } from '@/components/booking/BookingRequestActions';
import { VehicleChecklistForm } from '@/components/booking/VehicleChecklist';
import { Booking, VehicleChecklist } from '@/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBookingById, booking, loading, savePickupChecklist, saveReturnChecklist } = useBooking();
  
  const [userRole, setUserRole] = useState<'renter' | 'owner' | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [checklistType, setChecklistType] = useState<'pickup' | 'return'>('pickup');
  
  // Récupérer les détails de la réservation
  useEffect(() => {
    if (id) {
      getBookingById(id);
    }
  }, [id, getBookingById]);
  
  // Déterminer le rôle de l'utilisateur dans cette réservation
  useEffect(() => {
    if (booking && user) {
      if (booking.renterId === user.id) {
        setUserRole('renter');
      } else if (booking.ownerId === user.id) {
        setUserRole('owner');
      }
    }
  }, [booking, user]);
  
  // Gestion du changement de statut
  const handleStatusChange = () => {
    // Rafraîchir les données après un changement de statut
    if (id) {
      getBookingById(id);
    }
  };
  
  // Ouvrir la checklist
  const handleAction = (action: string) => {
    if (action === 'vehicle_pickup') {
      setChecklistType('pickup');
      setChecklistOpen(true);
    } else if (action === 'vehicle_return') {
      setChecklistType('return');
      setChecklistOpen(true);
    } else if (action === 'view_pickup_checklist') {
      setChecklistType('pickup');
      setChecklistOpen(true);
    } else if (action === 'view_return_checklist') {
      setChecklistType('return');
      setChecklistOpen(true);
    }
  };
  
  // Sauvegarder la checklist
  const handleSaveChecklist = async (checklist: VehicleChecklist, photos: string[]) => {
    if (!booking || !id) return;
    
    if (checklistType === 'pickup') {
      await savePickupChecklist(id, checklist, photos);
    } else {
      await saveReturnChecklist(id, checklist, photos);
    }
    
    setChecklistOpen(false);
    getBookingById(id);
  };
  
  // Contenu principal en fonction du statut de la réservation
  const renderMainContent = () => {
    if (!booking || !userRole) return null;
    
    // Si c'est une demande en attente de confirmation du propriétaire
    if (booking.status === 'pending' && userRole === 'owner') {
      return (
        <BookingRequestActions 
          booking={booking} 
          onStatusChange={handleStatusChange}
        />
      );
    }
    
    // Pour tous les autres statuts
    return (
      <BookingDetails 
        booking={booking}
        userRole={userRole}
        onAction={handleAction}
      />
    );
  };
  
  // Le contenu de la checklist dans la dialog
  const renderChecklistContent = () => {
    if (!booking) return null;
    
    const isReadOnly = (checklistType === 'pickup' && booking.status !== 'confirmed') || 
                      (checklistType === 'return' && booking.status !== 'in_progress');
    
    const initialData = checklistType === 'pickup' 
      ? booking.pickupChecklist 
      : booking.returnChecklist;
    
    return (
      <VehicleChecklistForm
        bookingId={booking.id}
        vehicleId={booking.vehicleId}
        initialData={initialData}
        isReadOnly={isReadOnly}
        onSave={!isReadOnly ? handleSaveChecklist : undefined}
        onCancel={() => setChecklistOpen(false)}
      />
    );
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {loading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            booking ? `Réservation #${booking.id.substring(0, 8)}` : 'Réservation non trouvée'
          )}
        </h1>
        <div className="w-24"></div> {/* Spacer pour centrer le titre */}
      </div>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : booking ? (
        renderMainContent()
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium">Réservation non trouvée</h2>
          <p className="text-muted-foreground mt-2">
            Cette réservation n'existe pas ou vous n'avez pas les permissions nécessaires pour y accéder.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4"
          >
            Retour au tableau de bord
          </Button>
        </div>
      )}
      
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-4xl">
          {renderChecklistContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage; 