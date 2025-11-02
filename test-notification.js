// Script pour tester la création d'une notification
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Récupérer les informations de connexion Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies');
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour créer une notification de test
async function createTestNotification() {
  try {
    // Récupérer l'ID de l'utilisateur connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return;
    }
    
    if (!user) {
      console.error('Aucun utilisateur connecté');
      return;
    }
    
    console.log('Création d\'une notification de test pour l\'utilisateur:', user.id);
    
    // Créer une notification de test
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'system',
        title: 'Test de notification',
        message: 'Ceci est une notification de test pour vérifier que le système fonctionne correctement.',
        is_read: false
      })
      .select();
    
    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return;
    }
    
    console.log('Notification créée avec succès:', data);
  } catch (error) {
    console.error('Exception lors de la création de la notification:', error);
  }
}

// Exécuter la fonction
createTestNotification(); 