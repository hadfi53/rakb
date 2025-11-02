import React, { useEffect, useState } from 'react';
import { useEmailProcessor, EmailService } from '@/services/email-service';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

/**
 * Composant invisible qui initialise le traitement des emails
 * Ce composant doit être rendu une seule fois dans l'application
 * et uniquement pour les utilisateurs authentifiés
 */
const EmailProcessor = () => {
  const { user } = useAuth();
  const processor = useEmailProcessor();
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  
  // Vérifier si les tables d'email existent
  useEffect(() => {
    const checkTables = async () => {
      if (user?.user_metadata?.role === 'admin') {
        try {
          const exist = await EmailService.checkTablesExist();
          setTablesExist(exist);
          setShowAlert(!exist);
        } catch (error) {
          console.error('Erreur lors de la vérification des tables d\'email:', error);
          setTablesExist(false);
          setShowAlert(false); // Ne pas montrer l'alerte en cas d'erreur pour éviter de perturber l'utilisateur
        }
      }
    };
    
    checkTables();
  }, [user]);
  
  // Utiliser useEffect pour appliquer la logique conditionnelle
  useEffect(() => {
    // N'initialiser le processeur d'emails que si l'utilisateur est connecté
    if (user) {
      try {
        processor.startProcessing();
      } catch (error) {
        console.error('Erreur lors du démarrage du traitement des emails:', error);
      }
    }
    
    // Nettoyer lors du démontage
    return () => {
      if (user) {
        try {
          processor.stopProcessing();
        } catch (error) {
          console.error('Erreur lors de l\'arrêt du traitement des emails:', error);
        }
      }
    };
  }, [user, processor]);
  
  if (showAlert && user?.user_metadata?.role === 'admin') {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration requise</AlertTitle>
          <AlertDescription>
            Les tables d'email n'existent pas dans la base de données. Veuillez consulter le fichier README_EMAIL_SYSTEM.md pour les instructions de configuration.
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={() => setShowAlert(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      </div>
    );
  }
  
  // Ce composant ne rend rien visuellement en temps normal
  return null;
};

export default EmailProcessor; 