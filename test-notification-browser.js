// Copier et coller ce script dans la console du navigateur pour créer une notification de test

// Fonction pour créer une notification de test
async function createTestNotification() {
  try {
    // Récupérer l'instance Supabase depuis l'application
    const supabase = window.supabase || (window.app && window.app.supabase);
    
    if (!supabase) {
      console.error('Impossible de trouver l\'instance Supabase. Assurez-vous d\'être connecté à l\'application.');
      return;
    }
    
    // Récupérer l'utilisateur actuel
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
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      return;
    }
    
    console.log('Notification créée avec succès:', data);
    alert('Notification créée avec succès! Vérifiez la page des notifications.');
  } catch (error) {
    console.error('Exception lors de la création de la notification:', error);
  }
}

// Exécuter la fonction
createTestNotification(); 