import { supabase } from '@/lib/supabase';
import React from 'react';
import ExternalEmailService from './external-email-service';

// Types pour les emails
export interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  html_content: string;
  text_content?: string;
  status: 'pending' | 'processing' | 'sent' | 'error';
  related_id?: string;
  related_type?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
}

// Service pour envoyer les emails
export class EmailService {
  // Vérifier si les tables d'email existent
  static async checkTablesExist(): Promise<boolean> {
    try {
      // Tenter de récupérer un enregistrement de la table email_queue
      // Silently handle missing tables - don't throw errors
      const { data, error } = await supabase
        .from('email_queue')
        .select('id')
        .limit(1);
      
      if (error) {
        // Table doesn't exist (42P01) or RLS/permission issue
        if (error.code === '42P01' || error.code === 'PGRST301') {
          // Only log once, don't spam console
          return false;
        }
        // Other errors might mean table exists but has no data
        return true;
      }
      
      return true;
    } catch (error) {
      // Silently return false if check fails
      return false;
    }
  }

  // Méthode pour traiter la file d'attente d'emails
  static async processEmailQueue(maxEmails: number = 10): Promise<number> {
    try {
      // Vérifier si les tables existent
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        // Silently return, don't log every time
        return 0;
      }

      // Récupérer les emails en attente
      const { data: pendingEmails, error: fetchError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(maxEmails);

      if (fetchError) {
        // Si la table n'existe pas, retourner silencieusement
        if (fetchError.code === '42P01' || fetchError.code === 'PGRST301' || fetchError.code === 'PGRST200' || fetchError.message?.includes('relation') || fetchError.message?.includes('does not exist')) {
          // Suppress console errors for missing tables - they'll be created via migration
          if (import.meta.env.DEV) {
            console.warn('⚠️ Email queue table does not exist. Run migration: supabase/migrations/20240523_create_email_tables.sql');
          }
          return 0;
        }
        // Only log other errors in dev mode
        if (import.meta.env.DEV) {
        console.error('Erreur lors de la récupération des emails en attente:', fetchError);
        }
        return 0;
      }

      if (!pendingEmails || pendingEmails.length === 0) {
        return 0;
      }

      let processedCount = 0;

      // Traiter chaque email
      for (const email of pendingEmails) {
        try {
          // Mettre à jour le statut de l'email
          await supabase
            .from('email_queue')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', email.id);

          // Envoyer l'email via le service externe
          const success = await ExternalEmailService.sendEmail({
            to: email.recipient_email,
            subject: email.subject,
            html: email.html_content,
            text: email.text_content
          });

          if (success) {
            // Mettre à jour le statut de l'email
            await supabase
              .from('email_queue')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', email.id);

            // Enregistrer dans les logs
            await supabase.from('email_logs').insert({
              recipient_email: email.recipient_email,
              email_type: email.related_type || 'general',
              related_id: email.related_id,
              status: 'sent'
            });

            processedCount++;
          } else {
            // Mettre à jour le statut de l'email
            await supabase
              .from('email_queue')
              .update({ 
                status: 'error', 
                updated_at: new Date().toISOString()
              })
              .eq('id', email.id);

            // Enregistrer dans les logs
            await supabase.from('email_logs').insert({
              recipient_email: email.recipient_email,
              email_type: email.related_type || 'general',
              related_id: email.related_id,
              status: 'error',
              error_message: 'Échec de l\'envoi via le service externe'
            });
          }
        } catch (error) {
          console.error(`Erreur lors du traitement de l'email ${email.id}:`, error);
          
          // Mettre à jour le statut de l'email
          await supabase
            .from('email_queue')
            .update({ 
              status: 'error', 
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);

          // Enregistrer dans les logs
          await supabase.from('email_logs').insert({
            recipient_email: email.recipient_email,
            email_type: email.related_type || 'general',
            related_id: email.related_id,
            status: 'error',
            error_message: error instanceof Error ? error.message : String(error)
          });
        }
      }

      console.log(`${processedCount} emails traités avec succès`);
      return processedCount;
    } catch (error) {
      console.error('Exception lors du traitement des emails:', error);
      return 0;
    }
  }

  // Méthode pour envoyer un email directement (pour les cas urgents)
  static async sendDirectEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<boolean> {
    try {
      // Vérifier si les tables existent
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.log('Les tables d\'email n\'existent pas. L\'envoi d\'email est désactivé.');
        return false;
      }

      // Vérifier que l'adresse email est valide
      if (!ExternalEmailService.isValidEmail(to)) {
        console.error(`Adresse email invalide: ${to}`);
        return false;
      }
      
      // Envoyer l'email via le service externe
      const success = await ExternalEmailService.sendEmail({
        to,
        subject,
        html: htmlContent,
        text: textContent
      });
      
      // Enregistrer l'email dans les logs
      await supabase.from('email_logs').insert({
        recipient_email: to,
        email_type: 'direct_send',
        status: success ? 'sent' : 'error',
        error_message: success ? null : 'Échec de l\'envoi via le service externe'
      });
      
      return success;
    } catch (error) {
      console.error('Erreur lors de l\'envoi direct d\'email:', error);
      
      try {
        // Enregistrer l'erreur dans les logs
        await supabase.from('email_logs').insert({
          recipient_email: to,
          email_type: 'direct_send',
          status: 'error',
          error_message: error instanceof Error ? error.message : String(error)
        });
      } catch (logError) {
        console.error('Erreur lors de l\'enregistrement du log d\'email:', logError);
      }
      
      return false;
    }
  }

  // Méthode pour mettre en file d'attente un email personnalisé
  static async queueCustomEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string,
    relatedId?: string,
    relatedType?: string
  ): Promise<boolean> {
    try {
      // Vérifier si les tables existent
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.log('Les tables d\'email n\'existent pas. La mise en file d\'attente d\'email est désactivée.');
        return false;
      }

      const { error } = await supabase.from('email_queue').insert({
        recipient_email: to,
        subject,
        html_content: htmlContent,
        text_content: textContent,
        related_id: relatedId,
        related_type: relatedType,
        status: 'pending'
      });

      if (error) {
        console.error('Erreur lors de la mise en file d\'attente de l\'email:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception lors de la mise en file d\'attente de l\'email:', error);
      return false;
    }
  }

  // Méthode pour obtenir les logs d'emails (utile pour le débogage)
  static async getEmailLogs(limit: number = 50): Promise<any[]> {
    try {
      // Vérifier si les tables existent
      const tablesExist = await this.checkTablesExist();
      if (!tablesExist) {
        console.log('Les tables d\'email n\'existent pas. La récupération des logs d\'email est désactivée.');
        return [];
      }

      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erreur lors de la récupération des logs d\'emails:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception lors de la récupération des logs d\'emails:', error);
      return [];
    }
  }
}

// Hook pour initialiser le traitement périodique des emails
export function useEmailProcessor() {
  // Référence pour stocker l'ID de l'intervalle
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Fonction pour traiter les emails en attente
  const processEmails = async () => {
    try {
      const processed = await EmailService.processEmailQueue();
      if (processed > 0) {
        console.log(`${processed} emails traités`);
      }
    } catch (error) {
      console.error('Erreur lors du traitement des emails:', error);
    }
  };

  // Fonction pour démarrer le traitement périodique
  const startProcessing = () => {
    // Éviter de créer plusieurs intervalles
    if (intervalRef.current) return;
    
    // Traiter les emails immédiatement au démarrage
    processEmails();
    
    // Configurer l'intervalle pour traiter les emails périodiquement
    intervalRef.current = setInterval(processEmails, 5 * 60 * 1000); // 5 minutes
    console.log('Traitement périodique des emails démarré');
  };
  
  // Fonction pour arrêter le traitement périodique
  const stopProcessing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Traitement périodique des emails arrêté');
    }
  };
  
  // Nettoyer l'intervalle lors du démontage du composant
  React.useEffect(() => {
    return () => {
      stopProcessing();
    };
  }, []);
  
  // Retourner les fonctions pour démarrer et arrêter le traitement
  return {
    startProcessing,
    stopProcessing,
    processNow: processEmails
  };
}

export default EmailService; 