// Script simple à copier-coller dans la console du navigateur

(async function() {
  try {
    // Récupérer l'instance Supabase
    const supabase = window.supabase;
    
    if (!supabase) {
      alert("Erreur: Impossible de trouver l'instance Supabase. Assurez-vous d'être connecté à l'application.");
      return;
    }
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Erreur: Aucun utilisateur connecté. Veuillez vous connecter.");
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
      alert("Erreur lors de la création de la notification: " + error.message);
      console.error(error);
      return;
    }
    
    alert("Notification créée avec succès! Allez sur la page des notifications pour la voir.");
  } catch (error) {
    alert("Erreur: " + error.message);
    console.error(error);
  }
})(); 