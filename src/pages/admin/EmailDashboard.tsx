import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EmailService } from '@/services/email-service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText } from 'lucide-react';

// Types pour les logs d'emails
interface EmailLog {
  id: string;
  recipient_email: string;
  email_type: string;
  related_id?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

// Types pour les emails en file d'attente
interface QueuedEmail {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  related_type?: string;
  created_at: string;
  sent_at?: string;
}

const EmailDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'logs'>('queue');
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);

  // Vérifier si les tables d'email existent
  useEffect(() => {
    const checkTables = async () => {
      const exist = await EmailService.checkTablesExist();
      setTablesExist(exist);
      
      if (exist) {
        loadData();
      } else {
        setIsLoading(false);
      }
    };
    
    checkTables();
  }, []);

  // Charger les données
  const loadData = async () => {
    if (!tablesExist) return;
    
    setIsLoading(true);
    try {
      // Charger les emails en file d'attente
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('id, recipient_email, subject, status, related_type, created_at, sent_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queueError) {
        console.error('Erreur lors du chargement des emails en file d\'attente:', queueError);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des emails en file d'attente",
          variant: "destructive"
        });
      } else {
        setQueuedEmails(queueData || []);
      }

      // Charger les logs d'emails
      const { data: logsData, error: logsError } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) {
        console.error('Erreur lors du chargement des logs d\'emails:', logsError);
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des logs d'emails",
          variant: "destructive"
        });
      } else {
        setEmailLogs(logsData || []);
      }
    } catch (error) {
      console.error('Exception lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Traiter les emails en file d'attente
  const processEmails = async () => {
    setIsProcessing(true);
    try {
      const processed = await EmailService.processEmailQueue(10);
      toast({
        title: "Succès",
        description: `${processed} emails traités avec succès`,
        variant: "default"
      });
      // Recharger les données
      loadData();
    } catch (error) {
      console.error('Erreur lors du traitement des emails:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement des emails",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Supprimer un email de la file d'attente
  const deleteQueuedEmail = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression de l\'email:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression de l'email",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Succès",
          description: "Email supprimé avec succès",
          variant: "default"
        });
        // Mettre à jour la liste des emails
        setQueuedEmails(queuedEmails.filter(email => email.id !== id));
      }
    } catch (error) {
      console.error('Exception lors de la suppression de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'email",
        variant: "destructive"
      });
    }
  };

  // Réessayer d'envoyer un email
  const retryEmail = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'email:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la mise à jour de l'email",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Succès",
          description: "Email remis en file d'attente avec succès",
          variant: "default"
        });
        // Mettre à jour la liste des emails
        setQueuedEmails(queuedEmails.map(email => 
          email.id === id ? { ...email, status: 'pending' } : email
        ));
      }
    } catch (error) {
      console.error('Exception lors de la mise à jour de l\'email:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'email",
        variant: "destructive"
      });
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'processing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Vérifier si l'utilisateur est administrateur
  if (!user || user.user_metadata?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
        <p>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  // Afficher un message si les tables n'existent pas
  if (tablesExist === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Tableau de bord des emails</h1>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertTitle>Configuration requise</AlertTitle>
          <AlertDescription>
            Les tables d'email n'existent pas dans la base de données. Veuillez exécuter le script SQL pour les créer.
          </AlertDescription>
        </Alert>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Instructions de configuration
          </h2>
          
          <p className="mb-4">
            Pour que le système d'email fonctionne correctement, vous devez créer les tables nécessaires dans votre base de données Supabase.
          </p>
          
          <ol className="list-decimal pl-6 mb-6 space-y-2">
            <li>Connectez-vous à votre tableau de bord Supabase</li>
            <li>Allez dans la section "SQL Editor"</li>
            <li>Créez une nouvelle requête</li>
            <li>Copiez et collez le code SQL du fichier README_EMAIL_SYSTEM.md</li>
            <li>Exécutez la requête</li>
          </ol>
          
          <p>
            Une fois les tables créées, rechargez cette page pour accéder au tableau de bord des emails.
          </p>
          
          <Button 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Recharger la page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord des emails</h1>
      
      {/* Onglets */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'queue' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          File d'attente
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'logs' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={loadData}
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : 'Rafraîchir'}
        </button>
        
        {activeTab === 'queue' && (
          <button
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            onClick={processEmails}
            disabled={isProcessing || queuedEmails.filter(e => e.status === 'pending').length === 0}
          >
            {isProcessing ? 'Traitement...' : 'Traiter les emails en attente'}
          </button>
        )}
      </div>
      
      {/* Contenu des onglets */}
      {activeTab === 'queue' ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Emails en file d'attente</h2>
          {queuedEmails.length === 0 ? (
            <p className="text-gray-500">Aucun email en file d'attente</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Destinataire</th>
                    <th className="py-2 px-4 border-b">Sujet</th>
                    <th className="py-2 px-4 border-b">Type</th>
                    <th className="py-2 px-4 border-b">Statut</th>
                    <th className="py-2 px-4 border-b">Créé le</th>
                    <th className="py-2 px-4 border-b">Envoyé le</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queuedEmails.map(email => (
                    <tr key={email.id}>
                      <td className="py-2 px-4 border-b">{email.recipient_email}</td>
                      <td className="py-2 px-4 border-b">{email.subject}</td>
                      <td className="py-2 px-4 border-b">{email.related_type || '-'}</td>
                      <td className={`py-2 px-4 border-b ${getStatusColor(email.status)}`}>
                        {email.status}
                      </td>
                      <td className="py-2 px-4 border-b">{formatDate(email.created_at)}</td>
                      <td className="py-2 px-4 border-b">{email.sent_at ? formatDate(email.sent_at) : '-'}</td>
                      <td className="py-2 px-4 border-b">
                        {email.status === 'error' && (
                          <button
                            className="text-blue-500 hover:text-blue-700 mr-2"
                            onClick={() => retryEmail(email.id)}
                          >
                            Réessayer
                          </button>
                        )}
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteQueuedEmail(email.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Logs d'emails</h2>
          {emailLogs.length === 0 ? (
            <p className="text-gray-500">Aucun log d'email</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Destinataire</th>
                    <th className="py-2 px-4 border-b">Type</th>
                    <th className="py-2 px-4 border-b">Statut</th>
                    <th className="py-2 px-4 border-b">Date</th>
                    <th className="py-2 px-4 border-b">Erreur</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map(log => (
                    <tr key={log.id}>
                      <td className="py-2 px-4 border-b">{log.recipient_email}</td>
                      <td className="py-2 px-4 border-b">{log.email_type}</td>
                      <td className={`py-2 px-4 border-b ${getStatusColor(log.status)}`}>
                        {log.status}
                      </td>
                      <td className="py-2 px-4 border-b">{formatDate(log.created_at)}</td>
                      <td className="py-2 px-4 border-b">{log.error_message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailDashboard; 