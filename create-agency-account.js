import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = 'https://kaegngmkmeuenndcqdsx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWduZ21rbWV1ZW5uZGNxZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTc1MjUsImV4cCI6MjA1MzU5MzUyNX0.z7Rpj4RsAdPwitQG8NyaAdflYdedWhdKM87HgVatKLI';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script pour créer un compte agence (owner) de test
 * 
 * Options :
 * 1. Utiliser le compte existant et le transformer en owner
 * 2. Créer un nouveau compte agence
 */

async function createAgencyAccount() {
  try {
    const option = process.argv[2] || 'new'; // 'new' ou 'existing'
    
    let userId;
    let email;
    let password;

    if (option === 'existing') {
      // Option 1: Utiliser le compte existant et le transformer en owner
      console.log('🔐 Connexion au compte existant...');
      
      email = 'hhadfi53@gmail.com';
      password = 'Bmx4ever';
      
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        console.error('❌ Erreur d\'authentification:', authError.message);
        return;
      }

      userId = user.id;
      console.log('✅ Connecté avec le compte:', email);
    } else {
      // Option 2: Créer un nouveau compte agence
      console.log('📝 Création d\'un nouveau compte agence...');
      
      email = 'agency@rakeb.test';
      password = 'Agency123!';
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: 'Agency',
            last_name: 'Test',
            role: 'owner'
          }
        }
      });

      if (signUpError) {
        // Si le compte existe déjà, essayer de se connecter
        if (signUpError.message.includes('already registered')) {
          console.log('⚠️ Le compte existe déjà, connexion...');
          const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });
          
          if (loginError) {
            console.error('❌ Erreur de connexion:', loginError.message);
            return;
          }
          
          userId = user.id;
        } else {
          console.error('❌ Erreur lors de la création:', signUpError.message);
          return;
        }
      } else {
        userId = authData.user.id;
        console.log('✅ Compte créé avec succès');
      }
    }

    // Mettre à jour le profil en tant que propriétaire/agence
    console.log('👤 Mise à jour du profil en tant que propriétaire...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'owner',
        verified_host: true, // Marquer comme vérifié pour accéder aux fonctionnalités host
        first_name: option === 'existing' ? undefined : 'Agency',
        last_name: option === 'existing' ? undefined : 'Test',
        phone: '+212612345678',
        company_name: 'RAKB Test Agency'
      })
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Erreur lors de la mise à jour du profil:', profileError.message);
      // Essayer de créer le profil s'il n'existe pas
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          role: 'owner',
          verified_host: true,
          first_name: 'Agency',
          last_name: 'Test',
          phone: '+212612345678',
          company_name: 'RAKB Test Agency'
        });

      if (insertError) {
        console.error('❌ Erreur lors de la création du profil:', insertError.message);
        return;
      }
      console.log('✅ Profil créé avec succès');
    } else {
      console.log('✅ Profil mis à jour avec succès');
    }

    // Mettre à jour les métadonnées de l'utilisateur
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        role: 'owner'
      }
    });

    if (updateError) {
      console.warn('⚠️ Erreur lors de la mise à jour des métadonnées:', updateError.message);
    }

    console.log('\n✨ Compte agence configuré avec succès !\n');
    console.log('📋 Informations de connexion :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email    : ${email}`);
    console.log(`🔑 Password : ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 Vous pouvez maintenant :');
    console.log('   - Vous connecter sur le site');
    console.log('   - Accéder au dashboard propriétaire (/dashboard/owner)');
    console.log('   - Ajouter des véhicules');
    console.log('   - Gérer les réservations\n');

    return { userId, email, password };
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le script
createAgencyAccount();

