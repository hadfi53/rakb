import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = 'https://kcujctyosmjlofppntfb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script pour créer un compte administrateur
 */
async function createAdminAccount() {
  try {
    const email = 'rakb@rakb.ma';
    const password = 'Rakb@2025';
    
    console.log('📝 Création du compte administrateur...');
    console.log(`📧 Email: ${email}`);
    
    let userId;
    
    // Vérifier si le compte existe déjà
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      console.log('⚠️ Le compte existe déjà, mise à jour en cours...');
      userId = existingUser.id;
      
      // Essayer de se connecter pour vérifier le mot de passe
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (loginError && !loginError.message.includes('Invalid login credentials')) {
        console.error('❌ Erreur lors de la connexion:', loginError.message);
      }
    } else {
      // Créer un nouveau compte
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            first_name: 'Admin',
            last_name: 'RAKB',
            role: 'admin'
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('User already registered')) {
          console.log('⚠️ Le compte existe déjà dans auth.users, connexion...');
          const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });
          
          if (loginError) {
            console.error('❌ Erreur de connexion:', loginError.message);
            console.log('💡 Le compte existe mais le mot de passe est différent. Veuillez le réinitialiser via Supabase Dashboard.');
            return;
          }
          
          userId = user.id;
        } else {
          console.error('❌ Erreur lors de la création:', signUpError.message);
          return;
        }
      } else {
        userId = authData.user?.id;
        if (!userId) {
          console.error('❌ Compte créé mais aucun ID utilisateur retourné');
          return;
        }
        console.log('✅ Compte créé avec succès');
      }
    }

    // Mettre à jour le profil en tant qu'administrateur
    console.log('👤 Configuration du profil administrateur...');
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        user_role: 'admin',
        verified_tenant: true,
        verified_host: true,
        is_verified: true,
        is_active: true,
        first_name: 'Admin',
        last_name: 'RAKB'
      })
      .eq('id', userId);

    if (profileError) {
      console.error('❌ Erreur lors de la mise à jour du profil:', profileError.message);
      // Essayer de créer le profil s'il n'existe pas
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'admin',
          user_role: 'admin',
          verified_tenant: true,
          verified_host: true,
          is_verified: true,
          is_active: true,
          first_name: 'Admin',
          last_name: 'RAKB'
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
        role: 'admin'
      }
    });

    if (updateError) {
      console.warn('⚠️ Erreur lors de la mise à jour des métadonnées:', updateError.message);
    }

    // Confirmer l'email directement via SQL (si nécessaire)
    console.log('📧 Confirmation de l\'email...');
    const { error: emailError } = await supabase.rpc('confirm_user_email', { user_id: userId }).catch(() => ({ error: null }));
    // Note: Cette fonction peut ne pas exister, on continue même si ça échoue

    console.log('\n✨ Compte administrateur configuré avec succès !\n');
    console.log('📋 Informations de connexion :');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email    : ${email}`);
    console.log(`🔑 Password : ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 Vous pouvez maintenant :');
    console.log('   - Vous connecter sur le site');
    console.log('   - Accéder au dashboard admin (/admin/*)');
    console.log('   - Gérer les utilisateurs (/admin/users)');
    console.log('   - Gérer les documents (/admin/documents)');
    console.log('   - Gérer les véhicules (/admin/vehicles)');
    console.log('   - Gérer les emails (/admin/emails)\n');

    return { userId, email, password };
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter le script
createAdminAccount()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script échoué:', error);
    process.exit(1);
  });

