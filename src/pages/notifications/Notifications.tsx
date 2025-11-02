import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bell, Car, Calendar, MessageSquare, Star, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useNotifications, FormattedNotification } from '@/hooks/use-notifications';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const { 
    notifications, 
    loading, 
    error, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    fetchNotifications 
  } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  // Recharger les notifications quand on navigue vers cette page
  useEffect(() => {
    if (user && location.pathname === '/notifications' && !loading) {
      // Ne recharger que si on vient d'arriver sur la page (pas au premier montage)
      const hasLoaded = notifications.length > 0 || error !== null;
      if (hasLoaded) {
        fetchNotifications();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const getIcon = (type: FormattedNotification['type'], subtype?: string) => {
    // D'abord vérifier le sous-type pour des icônes plus spécifiques
    if (subtype) {
      switch (subtype) {
        case 'booking_confirmed':
          return <CheckCircle className="h-5 w-5" />;
        case 'booking_rejected':
          return <XCircle className="h-5 w-5" />;
        case 'booking_cancelled':
          return <AlertTriangle className="h-5 w-5" />;
        case 'booking_request':
          return <Calendar className="h-5 w-5" />;
      }
    }
    
    // Sinon, utiliser le type général
    switch (type) {
      case 'booking':
        return <Car className="h-5 w-5" />;
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'system':
        return <Bell className="h-5 w-5" />;
      case 'review':
        return <Star className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: FormattedNotification['type'], subtype?: string) => {
    // D'abord vérifier le sous-type pour des couleurs plus spécifiques
    if (subtype) {
      switch (subtype) {
        case 'booking_confirmed':
          return 'bg-green-500/10 text-green-500';
        case 'booking_rejected':
          return 'bg-red-500/10 text-red-500';
        case 'booking_cancelled':
          return 'bg-amber-500/10 text-amber-500';
        case 'booking_request':
          return 'bg-purple-500/10 text-purple-500';
      }
    }
    
    // Sinon, utiliser le type général
    switch (type) {
      case 'booking':
        return 'bg-blue-500/10 text-blue-500';
      case 'message':
        return 'bg-green-500/10 text-green-500';
      case 'system':
        return 'bg-orange-500/10 text-orange-500';
      case 'review':
        return 'bg-yellow-500/10 text-yellow-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notif.read;
    // Vérifier le type ET le subtype pour une meilleure correspondance
    return notif.type === activeTab || notif.subtype === activeTab;
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos notifications et restez informé
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-sm">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 gap-4 mb-8">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Tout</span>
          </TabsTrigger>
          <TabsTrigger value="booking" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Réservations</span>
          </TabsTrigger>
          <TabsTrigger value="message" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Avis</span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Non lus</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            // Afficher des squelettes pendant le chargement
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            // Afficher un message d'erreur
            <Card>
              <CardContent className="py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Erreur de chargement
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Impossible de charger vos notifications. Veuillez réessayer.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={handleRefresh}
                >
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            // Afficher un message si aucune notification
            <Card>
              <CardContent className="py-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Aucune notification
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vous n'avez pas de notification pour le moment
                </p>
              </CardContent>
            </Card>
          ) : (
            // Afficher les notifications
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-colors ${!notification.read ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getTypeColor(notification.type, notification.subtype)}`}>
                        {getIcon(notification.type, notification.subtype)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-medium">
                              {notification.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(notification.date)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          {notification.actionLink && (
                            <Button
                              variant="link"
                              className="h-auto p-0 text-sm"
                              onClick={() => {
                                if (!notification.read) {
                                  handleMarkAsRead(notification.id);
                                }
                                navigate(notification.actionLink!);
                              }}
                            >
                              {notification.actionText || 'Voir les détails'}
                            </Button>
                          )}
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Marquer comme lu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications; 