// Script pour ajouter la colonne notes à la table bookings
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addNotesColumn() {
  try {
    console.log('Ajout de la colonne notes à la table bookings...');
    
    const { error } = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;'
    });
    
    if (error) {
      console.error('Erreur lors de l\'ajout de la colonne notes:', error);
      return;
    }
    
    console.log('Colonne notes ajoutée avec succès à la table bookings');
  } catch (error) {
    console.error('Exception lors de l\'ajout de la colonne notes:', error);
  }
}

addNotesColumn(); 