import { useState, useEffect } from "react";
import { OwnerBooking } from "@/hooks/use-owner-bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Car, 
  User, 
  DollarSign,
  Clock, 
  AlertCircle, 
  MessageSquare, 
  RotateCcw 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin } from "lucide-react";
import { BookingList } from "./BookingList";

interface BookingRequestsManagerProps {
  pendingBookings: OwnerBooking[];
  confirmedBookings: OwnerBooking[];
  completedBookings: OwnerBooking[];
  cancelledBookings: OwnerBooking[];
  onAcceptBooking: (booking: OwnerBooking) => Promise<void>;
  onRejectBooking: (booking: OwnerBooking, reason: string) => Promise<void>;
  loading: boolean;
  onRefresh: () => void;
  onCountChange?: (count: number) => void;
}

export const BookingRequestsManager = ({
  pendingBookings,
  confirmedBookings,
  completedBookings,
  cancelledBookings,
  onAcceptBooking,
  onRejectBooking,
  loading,
  onRefresh,
  onCountChange
}: BookingRequestsManagerProps) => {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState<OwnerBooking | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Log unique au montage du composant
  useEffect(() => {
    console.log('BookingRequestsManager - Composant monté');
  }, []); // Dépendances vides = exécution unique au montage

  useEffect(() => {
    if (onCountChange) {
      onCountChange(pendingBookings.length);
    }
  }, [pendingBookings.length, onCountChange]);

  const handleAcceptBooking = async (booking: OwnerBooking) => {
    try {
      setSelectedBooking(booking);
      setIsSubmitting(true);
      await onAcceptBooking(booking);
      toast({
        title: "Réservation acceptée",
        description: "La réservation est confirmée"
      });
      setSelectedBooking(null);
      return true;
    } catch (error: any) {
      console.error('Erreur lors de l\'acceptation de la réservation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'acceptation de la réservation",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBooking = (booking: OwnerBooking) => {
    setSelectedBooking(booking);
    setShowRejectDialog(true);
  };

  const confirmRejectBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setIsProcessing(true);
      await onRejectBooking(selectedBooking, rejectReason);
      toast.success("Réservation refusée avec succès");
      setShowRejectDialog(false);
      setRejectReason("");
      // Rafraîchir les données immédiatement
      onRefresh();
    } catch (error) {
      console.error("Erreur lors du refus de la réservation:", error);
      toast.error("Erreur lors du refus de la réservation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des réservations:", error);
      toast.error("Erreur lors du rafraîchissement des réservations");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
    }).format(price);
  };

  const renderBookingCard = (booking: OwnerBooking) => {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const durationDays = booking.durationDays || differenceInDays(endDate, startDate) + 1;
    
    return (
      <Card key={booking.id} className="mb-4 overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
        style={{ 
          borderLeftColor: booking.status === 'pending' ? '#f59e0b' : 
                           booking.status === 'confirmed' ? '#10b981' : 
                           booking.status === 'in_progress' ? '#3b82f6' : 
                           booking.status === 'completed' ? '#6b7280' : 
                           '#ef4444' 
        }}
      >
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Image du véhicule */}
            <div className="w-full md:w-1/4 h-48 md:h-auto bg-gray-100 relative">
              {booking.vehicle?.images[0] ? (
                <img 
                  src={booking.vehicle.images[0]} 
                  alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Car className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {booking.status === 'pending' && (
                  <Badge variant="warning">En attente</Badge>
                )}
                {booking.status === 'confirmed' && (
                  <Badge variant="success">Confirmée</Badge>
                )}
                {booking.status === 'in_progress' && (
                  <Badge variant="default">En cours</Badge>
                )}
                {booking.status === 'completed' && (
                  <Badge variant="secondary">Terminée</Badge>
                )}
                {booking.status === 'cancelled' && (
                  <Badge variant="destructive">Annulée</Badge>
                )}
                {booking.status === 'rejected' && (
                  <Badge variant="destructive">Refusée</Badge>
                )}
                
                {booking.status === 'pending' && (
                  <Badge variant="outline">
                    Action requise
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Détails de la réservation */}
            <div className="p-6 flex-1">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {booking.vehicle?.make} {booking.vehicle?.model} {booking.vehicle?.year}
                  </h3>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className="text-2xl font-bold text-primary">{formatPrice(booking.totalAmount)}</p>
                  <p className="text-sm text-gray-500">pour {durationDays} jour{durationDays > 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start">
                  <User className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Locataire</p>
                    <div className="flex items-center mt-1">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={booking.renter?.avatarUrl} />
                        <AvatarFallback>
                          {booking.renter ? getInitials(booking.renter.firstName, booking.renter.lastName) : 'UN'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{booking.renter?.firstName} {booking.renter?.lastName}</p>
                        {booking.renter?.email && (
                          <p className="text-xs text-gray-500">{booking.renter.email}</p>
                        )}
                        {booking.renter?.phone && (
                          <p className="text-xs text-gray-500">{booking.renter.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Période de location</p>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <p className="text-sm">Début: <span className="font-medium">{formatDate(booking.startDate)}</span></p>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <p className="text-sm">Fin: <span className="font-medium">{formatDate(booking.endDate)}</span></p>
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <p className="text-sm">Durée: <span className="font-medium">{durationDays} jour{durationDays > 1 ? 's' : ''}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Clock className="w-4 h-4 mr-1" />
                <span>Demande reçue le {format(new Date(booking.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}</span>
              </div>
              
              {booking.status === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Action requise</p>
                      <p className="text-sm text-yellow-700">Cette demande de réservation est en attente de votre approbation.</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      className="border-red-500 text-red-500 hover:bg-red-50"
                      onClick={() => handleRejectBooking(booking)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Refuser
                    </Button>
                    <Button 
                      variant="default"
                      onClick={() => handleAcceptBooking(booking)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accepter
                    </Button>
                  </div>
                </div>
              )}
              
              {booking.status === 'confirmed' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Réservation confirmée</p>
                      <p className="text-sm text-green-700">Vous avez accepté cette réservation. Le locataire a été informé.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {booking.status === 'rejected' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Réservation refusée</p>
                      <p className="text-sm text-red-700">Vous avez refusé cette réservation. Le locataire a été informé.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {booking.status === 'cancelled' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Réservation annulée</p>
                      <p className="text-sm text-red-700">Cette réservation a été annulée par le locataire.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSkeletons = () => (
    <>
      {[1, 2].map((i) => (
        <Card key={i} className="mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/4 h-48 md:h-auto">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="p-6 flex-1">
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="flex items-center mt-1">
                      <Skeleton className="h-8 w-8 rounded-full mr-2" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                <Skeleton className="h-4 w-56 mb-4" />
                <div className="flex justify-end space-x-2 mt-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );

  if (loading) {
    return renderSkeletons();
  }

  if (pendingBookings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucune demande de réservation en attente
      </div>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Demandes de réservation</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            <span className="ml-2">Actualiser</span>
          </Button>
        </div>
        <CardDescription>
          Gérez les demandes de réservation pour vos véhicules
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingBookings.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Vous avez {pendingBookings.length} demande{pendingBookings.length > 1 ? 's' : ''} en attente</p>
                <p className="text-sm text-blue-700">
                  Veuillez accepter ou refuser ces demandes pour informer les locataires. 
                  Les demandes non traitées expirent automatiquement après 24 heures.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="pending" id="pending-tab">
              En attente
              {pendingBookings.length > 0 && (
                <Badge variant="secondary">{pendingBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmées
              {confirmedBookings.length > 0 && (
                <Badge variant="secondary">{confirmedBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminées
              {completedBookings.length > 0 && (
                <Badge variant="secondary">{completedBookings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Annulées
              {cancelledBookings.length > 0 && (
                <Badge variant="secondary">{cancelledBookings.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">Aucune demande en attente</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Vous n'avez pas de demandes de réservation en attente pour le moment. 
                  Lorsque des locataires feront des demandes, elles apparaîtront ici.
                </p>
              </div>
            ) : (
              <BookingList
                bookings={pendingBookings}
                type="pending"
                onAcceptBooking={onAcceptBooking}
                onRejectBooking={onRejectBooking}
                loading={loading}
                onRefresh={onRefresh}
              />
            )}
          </TabsContent>
          
          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">Aucune réservation confirmée</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Vous n'avez pas de réservations confirmées pour le moment. 
                  Les réservations que vous acceptez apparaîtront ici.
                </p>
              </div>
            ) : (
              <BookingList
                bookings={confirmedBookings}
                type="confirmed"
                loading={loading}
                onRefresh={onRefresh}
              />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <CheckCircle className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">Aucune réservation terminée</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Vous n'avez pas encore de réservations terminées. 
                  Les réservations passées apparaîtront ici une fois terminées.
                </p>
              </div>
            ) : (
              <BookingList
                bookings={completedBookings}
                type="completed"
                loading={loading}
                onRefresh={onRefresh}
              />
            )}
          </TabsContent>
          
          <TabsContent value="cancelled" className="space-y-4">
            {cancelledBookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <XCircle className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">Aucune réservation annulée</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Vous n'avez pas de réservations annulées ou refusées pour le moment.
                </p>
              </div>
            ) : (
              <BookingList
                bookings={cancelledBookings}
                type="cancelled"
                loading={loading}
                onRefresh={onRefresh}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog de confirmation pour accepter une réservation */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accepter la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir accepter cette réservation ? Le locataire sera notifié immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedBooking && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Car className="w-5 h-5 mr-2 text-gray-500" />
                <span className="font-medium">{selectedBooking.vehicle?.make} {selectedBooking.vehicle?.model}</span>
              </div>
              
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-gray-500" />
                <span>{selectedBooking.renter?.firstName} {selectedBooking.renter?.lastName}</span>
              </div>
              
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                <span>Du {formatDate(selectedBooking.startDate)} au {formatDate(selectedBooking.endDate)}</span>
              </div>
              
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-gray-500" />
                <span className="font-medium">{selectedBooking.totalAmount} Dh</span>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              handleAcceptBooking(selectedBooking!).catch(error => {
                console.error('Error in AlertDialog:', error);
              });
            }}>
              Accepter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation pour le refus */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir refuser cette réservation ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedBooking && (
            <div className="py-4">
              <div className="flex items-center mb-4">
                <Car className="w-5 h-5 mr-2 text-gray-500" />
                <span className="font-medium">{selectedBooking.vehicle?.make} {selectedBooking.vehicle?.model}</span>
              </div>
              
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-gray-500" />
                <span>{selectedBooking.renter?.firstName} {selectedBooking.renter?.lastName}</span>
              </div>
              
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                <span>Du {formatDate(selectedBooking.startDate)} au {formatDate(selectedBooking.endDate)}</span>
              </div>
              
              <div className="mt-4">
                <label htmlFor="reason" className="block text-sm font-medium mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Raison du refus
                </label>
                <Textarea
                  id="reason"
                  placeholder="Expliquez pourquoi vous refusez cette réservation..."
                  value={rejectReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejectBooking}>Refuser</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 