// Script pour créer la table notifications
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Charger les variables d'environnement
dotenv.config();

// Récupérer les informations de connexion Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Utiliser la clé de service pour les opérations admin

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_SERVICE_ROLE_KEY doivent être définies');
  process.exit(1);
}

// Créer le client Supabase avec la clé de service
const supabase = createClient(supabaseUrl, supabaseKey);

async function createNotificationsTable() {
  try {
    console.log('Création de la table notifications...');
    
    // Créer la table notifications
    const { error: createError } = await supabase.from('notifications').insert({
      id: '00000000-0000-0000-0000-000000000000',
      user_id: '00000000-0000-0000-0000-000000000000',
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to create the table',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).select();
    
    if (createError) {
      // Si l'erreur est que la table n'existe pas, nous allons la créer
      if (createError.code === '42P01') {
        console.log('La table n\'existe pas, création en cours...');
        
        // Définition de la structure de la table
        const createTableQuery = `
          CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT false,
            related_id UUID,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          
          -- Indexes for better performance
          CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
          CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
          CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
          CREATE INDEX idx_notifications_type ON public.notifications(type);
          
          -- Enable Row Level Security
          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
          
          -- Policies for Row Level Security
          CREATE POLICY "Users can view their own notifications" 
            ON public.notifications FOR SELECT 
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own notifications" 
            ON public.notifications FOR UPDATE 
            USING (auth.uid() = user_id);
          
          -- Trigger for updating updated_at timestamp
          CREATE OR REPLACE FUNCTION public.handle_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON public.notifications
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
          
          -- Grant permissions
          GRANT ALL ON public.notifications TO authenticated;
        `;
        
        // Exécuter la requête SQL via l'API REST
        const { error: sqlError } = await supabase.rpc('pgrest_exec', { query: createTableQuery });
        
        if (sqlError) {
          console.error('Erreur lors de la création de la table via SQL:', sqlError);
          return;
        }
        
        console.log('Table notifications créée avec succès via SQL');
      } else {
        console.error('Erreur lors de la création de la table notifications:', createError);
      }
      return;
    }
    
    console.log('Table notifications existe déjà ou a été créée avec succès');
  } catch (error) {
    console.error('Exception lors de la création de la table notifications:', error);
  }
}

createNotificationsTable(); 