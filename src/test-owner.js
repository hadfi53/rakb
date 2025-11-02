import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = 'https://kaegngmkmeuenndcqdsx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWduZ21rbWV1ZW5uZGNxZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTc1MjUsImV4cCI6MjA1MzU5MzUyNX0.z7Rpj4RsAdPwitQG8NyaAdflYdedWhdKM87HgVatKLI';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserToOwner() {
  try {
    // Se connecter avec l'utilisateur existant
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hhadfi53@gmail.com',
      password: 'Bmx4ever'
    });

    if (authError) throw authError;

    console.log('Utilisateur connecté:', user);

    // Mettre à jour le profil en tant que propriétaire
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'owner'
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Mettre à jour les métadonnées de l'utilisateur
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        role: 'owner'
      }
    });

    if (updateError) throw updateError;

    console.log('Utilisateur mis à jour en tant que propriétaire');

    return user.id;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
  }
}

updateUserToOwner(); 