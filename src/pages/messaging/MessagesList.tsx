import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getThreads, subscribeToUserThreads, type MessageThread } from "@/lib/backend/messaging";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const MessagesListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      console.log('[MessagesList] No user ID available');
      return;
    }

    const loadThreads = async () => {
      setLoading(true);
      try {
        console.log('[MessagesList] Loading threads for user:', user.id);
        console.log('[MessagesList] User object:', { id: user.id, email: user.email });
        const { threads: userThreads, error: threadsError } = await getThreads(user.id);
        
        if (threadsError) {
          console.error("Error loading threads:", threadsError);
          toast.error("Erreur lors du chargement des conversations");
          return;
        }

        console.log(`Loaded ${userThreads?.length || 0} threads`);
        
        // Trier par date de dernière mise à jour
        const sortedThreads = (userThreads || []).sort((a, b) => {
          const dateA = a.last_message_at || a.updated_at || a.created_at;
          const dateB = b.last_message_at || b.updated_at || b.created_at;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        
        console.log('Sorted threads:', sortedThreads);
        setThreads(sortedThreads);
      } catch (error) {
        console.error("Error loading threads:", error);
        toast.error("Erreur lors du chargement des conversations");
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [user?.id]);

  // Abonnement real-time pour les mises à jour des threads
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToUserThreads(user.id, (updatedThread: MessageThread) => {
      setThreads((prev) => {
        const existingIndex = prev.findIndex((t) => t.id === updatedThread.id);
        if (existingIndex >= 0) {
          // Mettre à jour le thread existant
          const updated = [...prev];
          updated[existingIndex] = updatedThread;
          // Trier par date de dernière mise à jour
          return updated.sort((a, b) => {
            const dateA = a.last_message_at || a.updated_at;
            const dateB = b.last_message_at || b.updated_at;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
        } else {
          // Ajouter le nouveau thread
          const updated = [...prev, updatedThread];
          return updated.sort((a, b) => {
            const dateA = a.last_message_at || a.updated_at;
            const dateB = b.last_message_at || b.updated_at;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Vos conversations avec les agences et locataires</p>
          </div>
          <Button variant="outline" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
        </div>

        {threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucune conversation pour le moment</p>
              <p className="text-sm text-gray-500">
                Les conversations apparaîtront ici après une réservation
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/messages/${thread.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        {thread.booking_id && (
                          <span className="text-sm text-gray-500">
                            Réservation #{thread.booking_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {thread.last_message && (
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {thread.last_message.content}
                        </p>
                      )}
                      {thread.other_participant && (
                        <p className="text-xs text-gray-500 mt-1">
                          {thread.other_participant.first_name || ""}{" "}
                          {thread.other_participant.last_name || ""}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {thread.last_message
                          ? format(new Date(thread.last_message.created_at), "PPP à HH:mm", { locale: fr })
                          : format(new Date(thread.created_at), "PPP", { locale: fr })}
                      </p>
                    </div>
                    {thread.unread_count > 0 && (
                      <Badge variant="destructive" className="ml-4">
                        {thread.unread_count}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesListPage;

