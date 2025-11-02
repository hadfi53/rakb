// Script pour exposer l'instance Supabase dans la fenêtre
import { supabase } from './supabase';

// Exposer l'instance Supabase dans la fenêtre pour faciliter les tests
window.supabase = supabase;

// Fonction utilitaire pour créer une notification de test
window.createTestNotification = async () => {
  try {
    // Récupérer l'utilisateur actuel
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Aucun utilisateur connecté:', authError);
      return;
    }
    
    // Créer une notification de test
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'system',
        title: 'Notification de test',
        message: 'Ceci est une notification de test créée le ' + new Date().toLocaleString(),
        is_read: false
      });
    
    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return;
    }
    
    console.log('Notification créée avec succès:', data);
    alert('Notification créée avec succès! Allez sur la page des notifications pour la voir.');
  } catch (error) {
    console.error('Exception lors de la création de la notification:', error);
  }
};

export default supabase; 