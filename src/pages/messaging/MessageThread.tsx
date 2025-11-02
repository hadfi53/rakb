import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMessages,
  sendMessage,
  markAsRead,
  subscribeToThread,
  type Message,
  type MessageThread,
} from "@/lib/backend/messaging";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const MessageThreadPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger le thread et les messages
  useEffect(() => {
    if (!threadId || !user?.id) return;

    const loadThread = async () => {
      setLoading(true);
      try {
        console.log(`[MessageThread] Loading thread ${threadId} for user ${user.id}`);
        
        // Récupérer les messages du thread
        const { messages: threadMessages, error: messagesError } = await getMessages(threadId);
        
        console.log(`[MessageThread] Retrieved ${threadMessages?.length || 0} messages`);
        console.log(`[MessageThread] Messages error:`, messagesError);
        
        if (messagesError) {
          console.error("[MessageThread] Error loading messages:", messagesError);
          toast.error("Erreur lors du chargement des messages");
          // Ne pas naviguer immédiatement, peut-être que c'est juste un warning
          if (messagesError.message && !messagesError.message.includes('introuvable')) {
            navigate("/messages");
            return;
          }
        }

        setMessages(threadMessages || []);

        // Récupérer les informations du thread depuis la base
        // On utilise getThreads pour obtenir le thread complet
        const { threads, error: threadsError } = await import("@/lib/backend/messaging").then(
          (module) => module.getThreads(user.id)
        );

        if (!threadsError && threads) {
          const foundThread = threads.find((t) => t.id === threadId);
          if (foundThread) {
            setThread(foundThread);
            // Marquer comme lu
            await markAsRead(threadId, user.id);
          } else {
            toast.error("Conversation introuvable");
            navigate("/messages");
            return;
          }
        } else {
          console.error("Error loading thread:", threadsError);
          toast.error("Erreur lors du chargement de la conversation");
          navigate("/messages");
          return;
        }
      } catch (error) {
        console.error("Error loading thread:", error);
        toast.error("Erreur lors du chargement de la conversation");
        navigate("/messages");
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [threadId, user?.id, navigate]);

  // Abonnement real-time pour les nouveaux messages
  useEffect(() => {
    if (!threadId || !user?.id) return;

    const unsubscribe = subscribeToThread(threadId, (newMessage: Message) => {
      setMessages((prev) => {
        // Éviter les doublons
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Si le message est pour l'utilisateur actuel, le marquer comme lu
      if (newMessage.recipient_id === user.id) {
        markAsRead(threadId, user.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [threadId, user?.id]);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !thread || !user?.id) return;

    // Déterminer le recipient
    let recipientId: string | undefined;
    
    if (thread.tenant_id && thread.host_id) {
      // Booking conversation thread
      recipientId = thread.tenant_id === user.id ? thread.host_id : thread.tenant_id;
    } else if (thread.user1_id && thread.user2_id) {
      // Chat thread
      recipientId = thread.user1_id === user.id ? thread.user2_id : thread.user1_id;
    }

    if (!recipientId) {
      toast.error("Destinataire introuvable");
      return;
    }

    setSending(true);
    try {
      const { message: sentMessage, error: sendError } = await sendMessage(
        thread.id,
        user.id,
        recipientId,
        newMessage
      );

      if (sendError || !sentMessage) {
        console.error("Error sending message:", sendError);
        toast.error(sendError?.message || "Erreur lors de l'envoi du message");
        return;
      }

      // Le message sera ajouté via le real-time subscription
      // Mais on l'ajoute immédiatement pour un meilleur UX
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === sentMessage.id)) {
          return prev;
        }
        return [...prev, sentMessage];
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Conversation introuvable</p>
          <Button onClick={() => navigate("/dashboard/renter")}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <CardTitle className="text-2xl">Conversation</CardTitle>
          {thread.booking_id && (
            <p className="text-sm text-gray-600 mt-1">
              Réservation #{thread.booking_id.slice(0, 8)}
            </p>
          )}
          {thread.other_participant && (
            <p className="text-sm text-gray-600 mt-1">
              Avec {thread.other_participant.first_name || ""}{" "}
              {thread.other_participant.last_name || ""}
            </p>
          )}
        </div>

        {/* Messages */}
        <Card className="mb-4" style={{ height: "600px" }}>
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>Aucun message pour le moment</p>
                  <p className="text-sm mt-2">Envoyez le premier message !</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                          }`}
                        >
                          {format(new Date(message.created_at), "HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex gap-2 border-t pt-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Tapez votre message..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessageThreadPage;

