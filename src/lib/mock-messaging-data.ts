// Mock messaging data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

export interface MessageThread {
  id: string;
  booking_id?: string;
  participant_ids: string[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

const getMockThreads = (userId: string): MessageThread[] => {
  const stored = localStorage.getItem(`mock-threads-${userId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockThreads = (userId: string, threads: MessageThread[]) => {
  localStorage.setItem(`mock-threads-${userId}`, JSON.stringify(threads));
};

const getMockMessages = (threadId: string): Message[] => {
  const stored = localStorage.getItem(`mock-messages-${threadId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockMessages = (threadId: string, messages: Message[]) => {
  localStorage.setItem(`mock-messages-${threadId}`, JSON.stringify(messages));
};

export const mockMessagingApi = {
  async getThreads(userId: string): Promise<MessageThread[]> {
    await delay(300);
    return getMockThreads(userId);
  },

  async getOrCreateThread(bookingId: string, userId1: string, userId2: string): Promise<MessageThread> {
    await delay(200);
    
    // Chercher un thread existant pour cette réservation
    const allThreads = [
      ...getMockThreads(userId1),
      ...getMockThreads(userId2)
    ];
    
    const existingThread = allThreads.find(
      t => t.booking_id === bookingId && 
      t.participant_ids.includes(userId1) && 
      t.participant_ids.includes(userId2)
    );

    if (existingThread) {
      return existingThread;
    }

    // Créer un nouveau thread
    const newThread: MessageThread = {
      id: `thread-${uuidv4()}`,
      booking_id: bookingId,
      participant_ids: [userId1, userId2],
      unread_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Ajouter le thread pour les deux participants
    const user1Threads = getMockThreads(userId1);
    const user2Threads = getMockThreads(userId2);
    
    user1Threads.push(newThread);
    user2Threads.push(newThread);
    
    saveMockThreads(userId1, user1Threads);
    saveMockThreads(userId2, user2Threads);

    return newThread;
  },

  async getMessages(threadId: string): Promise<Message[]> {
    await delay(200);
    return getMockMessages(threadId);
  },

  async sendMessage(
    threadId: string,
    senderId: string,
    recipientId: string,
    content: string
  ): Promise<Message> {
    await delay(300);
    
    const newMessage: Message = {
      id: `msg-${uuidv4()}`,
      thread_id: threadId,
      sender_id: senderId,
      recipient_id: recipientId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    const messages = getMockMessages(threadId);
    messages.push(newMessage);
    saveMockMessages(threadId, messages);

    // Mettre à jour le thread
    const allThreads = [
      ...getMockThreads(senderId),
      ...getMockThreads(recipientId)
    ];
    
    const thread = allThreads.find(t => t.id === threadId);
    if (thread) {
      thread.last_message = newMessage;
      thread.updated_at = new Date().toISOString();
      thread.unread_count = thread.participant_ids.filter(id => id !== senderId).length;
      
      // Mettre à jour pour les deux participants
      const user1Threads = getMockThreads(senderId);
      const user2Threads = getMockThreads(recipientId);
      
      const updateThread = (threads: MessageThread[]) => {
        const index = threads.findIndex(t => t.id === threadId);
        if (index >= 0) {
          threads[index] = thread;
        }
      };
      
      updateThread(user1Threads);
      updateThread(user2Threads);
      
      saveMockThreads(senderId, user1Threads);
      saveMockThreads(recipientId, user2Threads);
    }

    return newMessage;
  },

  async markAsRead(threadId: string, userId: string): Promise<void> {
    await delay(100);
    const threads = getMockThreads(userId);
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.unread_count = 0;
      thread.updated_at = new Date().toISOString();
      saveMockThreads(userId, threads);

      // Marquer tous les messages comme lus
      const messages = getMockMessages(threadId);
      messages.forEach(msg => {
        if (msg.recipient_id === userId) {
          msg.is_read = true;
        }
      });
      saveMockMessages(threadId, messages);
    }
  },
};

