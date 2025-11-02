import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = 'https://kaegngmkmeuenndcqdsx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWduZ21rbWV1ZW5uZGNxZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTc1MjUsImV4cCI6MjA1MzU5MzUyNX0.z7Rpj4RsAdPwitQG8NyaAdflYdedWhdKM87HgVatKLI';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestRenter() {
  try {
    // Créer un nouvel utilisateur locataire
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'renter@example.com',
      password: 'testrenter123',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'Renter',
          role: 'renter'
        }
      }
    });

    if (signUpError) throw signUpError;

    console.log('Utilisateur locataire créé:', authData);

    // Mettre à jour le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Test',
        last_name: 'Renter',
        role: 'renter',
        email: 'renter@example.com'
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    console.log('Profil locataire mis à jour avec succès');

    return authData.user.id;
  } catch (error) {
    console.error('Erreur lors de la création du locataire:', error);
  }
}

createTestRenter(); 