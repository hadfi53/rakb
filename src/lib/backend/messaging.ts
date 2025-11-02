import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  chat_id?: string; // Utilisé pour chats/messages
  thread_id?: string; // Utilisé pour booking_conversation_threads/booking_messages
  sender_id: string;
  receiver_id?: string; // Pour chats/messages
  recipient_id?: string; // Computed
  content: string;
  created_at: string;
  read_at?: string | null;
  is_read?: boolean;
}

export interface MessageThread {
  id: string;
  chat_id?: string; // Pour chats
  booking_id?: string | null; // Pour booking_conversation_threads
  user1_id?: string; // Pour chats
  user2_id?: string; // Pour chats
  tenant_id?: string; // Pour booking_conversation_threads
  host_id?: string; // Pour booking_conversation_threads
  last_message_at?: string | null;
  created_at: string;
  updated_at?: string;
  // Computed fields
  participant_ids?: string[];
  last_message?: Message | null;
  unread_count?: number;
  other_participant?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

/**
 * Récupère tous les threads de conversation pour un utilisateur
 * Supporte à la fois chats/messages et booking_conversation_threads/booking_messages
 */
export const getThreads = async (userId: string): Promise<{ threads: MessageThread[]; error: any }> => {
  try {
    const allThreads: MessageThread[] = [];

    // 1. Récupérer les chats (système existant)
    // Utiliser deux requêtes séparées car .or() peut être problématique
    const { data: chatsData1, error: chatsError1 } = await supabase
      .from('chats')
      .select('*')
      .eq('user1_id', userId);

    const { data: chatsData2, error: chatsError2 } = await supabase
      .from('chats')
      .select('*')
      .eq('user2_id', userId);

    if (chatsError1) {
      console.error('Error fetching chats (user1_id):', chatsError1);
    }
    if (chatsError2) {
      console.error('Error fetching chats (user2_id):', chatsError2);
    }

    console.log(`[Messaging] User ID: ${userId}`);
    console.log(`[Messaging] Found ${chatsData1?.length || 0} chats as user1, ${chatsData2?.length || 0} chats as user2`);
    if (chatsError1) {
      console.error('[Messaging] Error fetching chats (user1_id):', chatsError1);
    }
    if (chatsError2) {
      console.error('[Messaging] Error fetching chats (user2_id):', chatsError2);
    }

    // Combiner les résultats et supprimer les doublons
    const allChats = [
      ...(chatsData1 || []),
      ...(chatsData2 || []).filter(chat => !chatsData1?.some(c => c.id === chat.id))
    ];

    const chatsData = allChats.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (chatsData && chatsData.length > 0) {
      for (const chat of chatsData) {
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;

        // Récupérer le profil de l'autre participant
        let otherParticipant = null;
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          otherParticipant = profileData;
        } catch (error) {
          console.error('Error fetching other participant:', error);
        }

        // Récupérer le dernier message
        let lastMessage: Message | null = null;
        let lastMessageAt: string | null = null;
        try {
          const { data: messageData } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (messageData) {
            lastMessage = {
              id: messageData.id,
              chat_id: messageData.chat_id,
              sender_id: messageData.sender_id,
              receiver_id: messageData.receiver_id,
              recipient_id: messageData.receiver_id,
              content: messageData.content,
              created_at: messageData.created_at,
              is_read: false, // Pas de read_at dans la table messages
            };
            lastMessageAt = messageData.created_at;
          }
        } catch (error) {
          // Pas de message dans ce chat
        }

        // Compter les messages non lus (pour l'instant, on ne peut pas déterminer car pas de read_at)
        // On va compter tous les messages où l'utilisateur est le receiver
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('receiver_id', userId);

        allThreads.push({
          id: chat.id,
          chat_id: chat.id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          created_at: chat.created_at,
          updated_at: lastMessageAt || chat.created_at,
          last_message_at: lastMessageAt,
          participant_ids: [chat.user1_id, chat.user2_id],
          last_message: lastMessage,
          unread_count: unreadCount || 0,
          other_participant: otherParticipant,
        });
      }
    }

    // 2. Récupérer les booking_conversation_threads (nouveau système)
    // Utiliser deux requêtes séparées
    const { data: bookingThreadsData1 } = await supabase
      .from('booking_conversation_threads')
      .select('*')
      .eq('tenant_id', userId);

    const { data: bookingThreadsData2 } = await supabase
      .from('booking_conversation_threads')
      .select('*')
      .eq('host_id', userId);

    // Combiner les résultats et supprimer les doublons
    const allBookingThreads = [
      ...(bookingThreadsData1 || []),
      ...(bookingThreadsData2 || []).filter(
        thread => !bookingThreadsData1?.some(t => t.id === thread.id)
      )
    ];

    const bookingThreadsData = allBookingThreads.sort((a, b) => {
      const dateA = a.last_message_at || a.updated_at || a.created_at;
      const dateB = b.last_message_at || b.updated_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    if (bookingThreadsData && bookingThreadsData.length > 0) {
      for (const thread of bookingThreadsData) {
        const otherParticipantId = thread.tenant_id === userId ? thread.host_id : thread.tenant_id;

        // Récupérer le profil de l'autre participant
        let otherParticipant = null;
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('id', otherParticipantId)
            .single();

          otherParticipant = profileData;
        } catch (error) {
          console.error('Error fetching other participant:', error);
        }

        // Récupérer le dernier message
        let lastMessage: Message | null = null;
        try {
          const { data: messageData } = await supabase
            .from('booking_messages')
            .select('*')
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (messageData) {
            lastMessage = {
              id: messageData.id,
              thread_id: messageData.thread_id,
              sender_id: messageData.sender_id,
              content: messageData.content,
              created_at: messageData.created_at,
              read_at: messageData.read_at,
              is_read: !!messageData.read_at,
              recipient_id: messageData.sender_id === thread.tenant_id ? thread.host_id : thread.tenant_id,
              chat_id: undefined,
            };
          }
        } catch (error) {
          console.error('Error fetching last message:', error);
        }

        // Compter les messages non lus
        const { count: unreadCount } = await supabase
          .from('booking_messages')
          .select('id', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .is('read_at', null)
          .neq('sender_id', userId);

        allThreads.push({
          id: thread.id,
          booking_id: thread.booking_id,
          tenant_id: thread.tenant_id,
          host_id: thread.host_id,
          created_at: thread.created_at,
          updated_at: thread.updated_at,
          last_message_at: thread.last_message_at,
          participant_ids: [thread.tenant_id, thread.host_id],
          last_message: lastMessage,
          unread_count: unreadCount || 0,
          other_participant: otherParticipant,
        });
      }
    }

    // Trier tous les threads par date de dernier message
    allThreads.sort((a, b) => {
      const dateA = a.last_message_at || a.updated_at || a.created_at;
      const dateB = b.last_message_at || b.updated_at || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    console.log(`[Messaging] Total threads found: ${allThreads.length}`);
    console.log(`[Messaging] Threads breakdown: ${allThreads.filter(t => t.chat_id).length} chats, ${allThreads.filter(t => t.booking_id).length} booking threads`);

    return { threads: allThreads, error: null };
  } catch (error) {
    console.error('Unexpected error in getThreads:', error);
    return {
      threads: [],
      error: error instanceof Error ? error : { message: 'Une erreur inattendue est survenue' },
    };
  }
};

/**
 * Récupère ou crée un thread de conversation pour une réservation
 */
export const getOrCreateThread = async (
  bookingId: string,
  tenantId: string,
  hostId: string
): Promise<{ thread: MessageThread | null; error: any }> => {
  try {
    // Chercher un thread existant
    const { data: existingThread, error: searchError } = await supabase
      .from('booking_conversation_threads')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingThread && !searchError) {
      const thread: MessageThread = {
        ...existingThread,
        participant_ids: [existingThread.tenant_id, existingThread.host_id],
      };
      return { thread, error: null };
    }

    // Créer un nouveau thread
    const { data: newThreadData, error: insertError } = await supabase
      .from('booking_conversation_threads')
      .insert({
        booking_id: bookingId,
        tenant_id: tenantId,
        host_id: hostId,
      })
      .select()
      .single();

    if (insertError || !newThreadData) {
      console.error('Error creating thread:', insertError);
      return {
        thread: null,
        error: insertError || { message: 'Impossible de créer le thread' },
      };
    }

    const thread: MessageThread = {
      ...newThreadData,
      participant_ids: [newThreadData.tenant_id, newThreadData.host_id],
    };

    return { thread, error: null };
  } catch (error) {
    console.error('Unexpected error in getOrCreateThread:', error);
    return {
      thread: null,
      error: error instanceof Error ? error : { message: 'Une erreur inattendue est survenue' },
    };
  }
};

/**
 * Récupère tous les messages d'un thread
 * Supporte à la fois chats/messages et booking_conversation_threads/booking_messages
 */
export const getMessages = async (threadId: string): Promise<{ messages: Message[]; error: any }> => {
  try {
    console.log(`[getMessages] Fetching messages for threadId: ${threadId}`);
    
    // D'abord, vérifier si c'est un chat (chats/messages)
    // Utiliser maybeSingle() pour ne pas générer d'erreur si non trouvé
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', threadId)
      .maybeSingle();

    // Si chatError est PGRST116, c'est juste qu'aucun chat n'a été trouvé, ce qui est normal
    if (chatError && chatError.code !== 'PGRST116') {
      console.error('[getMessages] Error checking for chat:', chatError);
    }

    if (chatData && !chatError) {
      console.log(`[getMessages] Found chat, fetching messages for chat_id: ${threadId}`);
      
      // C'est un chat, utiliser la table messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[getMessages] Error fetching messages:', messagesError);
        return { messages: [], error: messagesError };
      }

      console.log(`[getMessages] Found ${messagesData?.length || 0} messages in chat`);

      const messages: Message[] =
        messagesData?.map((msg) => ({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          recipient_id: msg.receiver_id,
          content: msg.content,
          created_at: msg.created_at,
          is_read: false,
        })) || [];

      return { messages, error: null };
    }

    // Sinon, c'est peut-être un booking_conversation_thread
    console.log(`[getMessages] Not a chat, checking booking_conversation_threads for: ${threadId}`);
    
    const { data: threadData, error: threadError } = await supabase
      .from('booking_conversation_threads')
      .select('tenant_id, host_id')
      .eq('id', threadId)
      .maybeSingle();

    if (threadError && threadError.code !== 'PGRST116') {
      console.error('[getMessages] Error checking booking thread:', threadError);
    }

    if (threadData && !threadError) {
      console.log(`[getMessages] Found booking thread, fetching messages for thread_id: ${threadId}`);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('booking_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[getMessages] Error fetching booking messages:', messagesError);
        return { messages: [], error: messagesError };
      }

      console.log(`[getMessages] Found ${messagesData?.length || 0} messages in booking thread`);

      const messages: Message[] =
        messagesData?.map((msg) => ({
          id: msg.id,
          thread_id: msg.thread_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          read_at: msg.read_at,
          is_read: !!msg.read_at,
          recipient_id:
            msg.sender_id === threadData.tenant_id ? threadData.host_id : threadData.tenant_id,
          chat_id: undefined,
        })) || [];

      return { messages, error: null };
    }

    // Si ni chat ni booking thread n'a été trouvé
    console.warn(`[getMessages] No thread found with id: ${threadId}`);
    return { messages: [], error: { message: 'Thread introuvable' } };
  } catch (error) {
    console.error('Unexpected error in getMessages:', error);
    return {
      messages: [],
      error: error instanceof Error ? error : { message: 'Une erreur inattendue est survenue' },
    };
  }
};

/**
 * Envoie un nouveau message dans un thread
 * Supporte à la fois chats/messages et booking_conversation_threads/booking_messages
 */
export const sendMessage = async (
  threadId: string,
  senderId: string,
  recipientId: string,
  content: string
): Promise<{ message: Message | null; error: any }> => {
  try {
    if (!content.trim()) {
      return { message: null, error: { message: 'Le message ne peut pas être vide' } };
    }

    // Vérifier si c'est un chat
    const { data: chatData } = await supabase
      .from('chats')
      .select('*')
      .eq('id', threadId)
      .single();

    if (chatData) {
      // Envoyer dans la table messages
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: threadId,
          sender_id: senderId,
          receiver_id: recipientId,
          content: content.trim(),
        })
        .select()
        .single();

      if (messageError || !messageData) {
        console.error('Error creating message:', messageError);
        return {
          message: null,
          error: messageError || { message: 'Erreur lors de l\'envoi du message' },
        };
      }

      const message: Message = {
        id: messageData.id,
        chat_id: messageData.chat_id,
        sender_id: messageData.sender_id,
        receiver_id: messageData.receiver_id,
        recipient_id: messageData.receiver_id,
        content: messageData.content,
        created_at: messageData.created_at,
        is_read: false,
      };

      return { message, error: null };
    }

    // Sinon, c'est un booking_conversation_thread
    const { data: threadData, error: threadError } = await supabase
      .from('booking_conversation_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !threadData) {
      return {
        message: null,
        error: threadError || { message: 'Thread introuvable' },
      };
    }

    // Vérifier que le sender est bien tenant ou host
    if (threadData.tenant_id !== senderId && threadData.host_id !== senderId) {
      return {
        message: null,
        error: { message: 'Vous n\'êtes pas autorisé à envoyer un message dans ce thread' },
      };
    }

    // Créer le message
    const { data: messageData, error: messageError } = await supabase
      .from('booking_messages')
      .insert({
        thread_id: threadId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select()
      .single();

    if (messageError || !messageData) {
      console.error('Error creating message:', messageError);
      return {
        message: null,
        error: messageError || { message: 'Erreur lors de l\'envoi du message' },
      };
    }

    // Mettre à jour last_message_at dans le thread
    await supabase
      .from('booking_conversation_threads')
      .update({
        last_message_at: messageData.created_at,
        updated_at: messageData.created_at,
      })
      .eq('id', threadId);

    const message: Message = {
      id: messageData.id,
      thread_id: messageData.thread_id,
      sender_id: messageData.sender_id,
      content: messageData.content,
      created_at: messageData.created_at,
      read_at: messageData.read_at,
      is_read: !!messageData.read_at,
      recipient_id: recipientId,
      chat_id: undefined,
    };

    return { message, error: null };
  } catch (error) {
    console.error('Unexpected error in sendMessage:', error);
    return {
      message: null,
      error: error instanceof Error ? error : { message: 'Une erreur inattendue est survenue' },
    };
  }
};

/**
 * Marque tous les messages non lus d'un thread comme lus
 */
export const markAsRead = async (
  threadId: string,
  userId: string
): Promise<{ success: boolean; error: any }> => {
  try {
    // Vérifier si c'est un chat (pas de read_at dans messages)
    const { data: chatData } = await supabase
      .from('chats')
      .select('*')
      .eq('id', threadId)
      .single();

    if (chatData) {
      // Pour les chats, on ne peut pas marquer comme lu car pas de read_at
      // On retourne success pour ne pas bloquer
      return { success: true, error: null };
    }

    // Pour booking_conversation_threads
    const { data: threadData, error: threadError } = await supabase
      .from('booking_conversation_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadError || !threadData) {
      return { success: false, error: threadError || { message: 'Thread introuvable' } };
    }

    if (threadData.tenant_id !== userId && threadData.host_id !== userId) {
      return {
        success: false,
        error: { message: 'Vous n\'êtes pas autorisé à modifier ce thread' },
      };
    }

    // Marquer tous les messages non lus comme lus
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('booking_messages')
      .update({
        read_at: now,
      })
      .eq('thread_id', threadId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return { success: false, error: updateError };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error in markAsRead:', error);
    return {
      success: false,
      error: error instanceof Error ? error : { message: 'Une erreur inattendue est survenue' },
    };
  }
};

/**
 * Abonne à un thread pour recevoir les nouveaux messages en temps réel
 */
export const subscribeToThread = (
  threadId: string,
  callback: (message: Message) => void
) => {
  const channel = supabase
    .channel(`thread:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${threadId}`,
      },
      async (payload) => {
        const newMessage = payload.new as any;
        callback({
          id: newMessage.id,
          chat_id: newMessage.chat_id,
          sender_id: newMessage.sender_id,
          receiver_id: newMessage.receiver_id,
          recipient_id: newMessage.receiver_id,
          content: newMessage.content,
          created_at: newMessage.created_at,
          is_read: false,
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      async (payload) => {
        const newMessage = payload.new as any;
        
        // Récupérer le thread pour déterminer le recipient_id
        const { data: threadData } = await supabase
          .from('booking_conversation_threads')
          .select('tenant_id, host_id')
          .eq('id', threadId)
          .single();

        if (threadData) {
          callback({
            id: newMessage.id,
            thread_id: newMessage.thread_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            read_at: newMessage.read_at,
            is_read: !!newMessage.read_at,
            recipient_id:
              newMessage.sender_id === threadData.tenant_id
                ? threadData.host_id
                : threadData.tenant_id,
            chat_id: undefined,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Abonne aux threads d'un utilisateur pour recevoir les mises à jour
 */
export const subscribeToUserThreads = (
  userId: string,
  callback: (thread: MessageThread) => void
) => {
  const channel = supabase
    .channel(`user-threads:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        const newMessage = payload.new as any;
        // Recharger les threads pour cet utilisateur
        const { threads } = await getThreads(userId);
        const affectedThread = threads.find((t) => 
          (t.chat_id === newMessage.chat_id) || 
          (t.user1_id === userId || t.user2_id === userId)
        );
        if (affectedThread) {
          callback(affectedThread);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'booking_conversation_threads',
        filter: `tenant_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const { threads } = await getThreads(userId);
          const updatedThread = threads.find((t) => t.id === payload.new.id);
          if (updatedThread) {
            callback(updatedThread);
          }
        } catch (error) {
          console.error('Error fetching updated thread:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'booking_conversation_threads',
        filter: `host_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const { threads } = await getThreads(userId);
          const updatedThread = threads.find((t) => t.id === payload.new.id);
          if (updatedThread) {
            callback(updatedThread);
          }
        } catch (error) {
          console.error('Error fetching updated thread:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_conversation_threads',
        filter: `tenant_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const { threads } = await getThreads(userId);
          const newThread = threads.find((t) => t.id === payload.new.id);
          if (newThread) {
            callback(newThread);
          }
        } catch (error) {
          console.error('Error fetching new thread:', error);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_conversation_threads',
        filter: `host_id=eq.${userId}`,
      },
      async (payload) => {
        try {
          const { threads } = await getThreads(userId);
          const newThread = threads.find((t) => t.id === payload.new.id);
          if (newThread) {
            callback(newThread);
          }
        } catch (error) {
          console.error('Error fetching new thread:', error);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
