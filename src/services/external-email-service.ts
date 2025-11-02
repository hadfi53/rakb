/**
 * Service d'email externe simulé
 * Dans une application réelle, ce service serait remplacé par un service d'email réel
 * comme SendGrid, Mailjet, etc.
 */

// Interface pour les options d'email
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

// Service d'email externe simulé
export class ExternalEmailService {
  private static defaultFrom = 'noreply@rakeb.ma';
  private static defaultReplyTo = 'support@rakeb.ma';
  
  /**
   * Envoie un email via le service externe
   * @param options Options de l'email
   * @returns Promise<boolean> Indique si l'email a été envoyé avec succès
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Compléter les options avec les valeurs par défaut
      const completeOptions = {
        ...options,
        from: options.from || this.defaultFrom,
        replyTo: options.replyTo || this.defaultReplyTo
      };
      
      // Simuler l'envoi d'un email
      console.log('Simulation d\'envoi d\'email:', {
        to: completeOptions.to,
        from: completeOptions.from,
        subject: completeOptions.subject,
        // Tronquer le contenu HTML pour le log
        html: completeOptions.html.substring(0, 100) + '...',
        text: completeOptions.text ? completeOptions.text.substring(0, 100) + '...' : undefined
      });
      
      // Simuler un délai d'envoi (entre 500ms et 1500ms)
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Simuler une réussite dans 95% des cas
      const isSuccess = Math.random() > 0.05;
      
      if (!isSuccess) {
        throw new Error('Échec simulé de l\'envoi d\'email');
      }
      
      console.log('Email envoyé avec succès à', completeOptions.to);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }
  
  /**
   * Vérifie si l'adresse email est valide
   * @param email Adresse email à vérifier
   * @returns boolean Indique si l'adresse email est valide
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default ExternalEmailService; 