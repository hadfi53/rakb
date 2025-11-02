// Script pour vérifier si la table notifications existe
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

// Fonction pour vérifier si la table notifications existe
async function checkNotificationsTable() {
  try {
    console.log('Vérification de la table notifications...');
    
    // Vérifier si la table existe en essayant de récupérer sa structure
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error('La table notifications n\'existe pas:', error);
      } else {
        console.error('Erreur lors de la vérification de la table notifications:', error);
      }
      return;
    }
    
    console.log('La table notifications existe.');
    
    // Vérifier les colonnes de la table
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'notifications' });
    
    if (columnsError) {
      console.error('Erreur lors de la récupération des colonnes:', columnsError);
      return;
    }
    
    console.log('Colonnes de la table notifications:', columns);
    
    // Vérifier les triggers sur la table
    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_table_triggers', { table_name: 'notifications' });
    
    if (triggersError) {
      console.error('Erreur lors de la récupération des triggers:', triggersError);
      return;
    }
    
    console.log('Triggers sur la table notifications:', triggers);
  } catch (error) {
    console.error('Exception lors de la vérification de la table notifications:', error);
  }
}

// Exécuter la fonction
checkNotificationsTable(); 