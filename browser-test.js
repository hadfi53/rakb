// Copier et coller ce script dans la console du navigateur pour tester le système de notifications

// Fonction pour créer une notification de test directement via l'API Supabase
async function testNotificationSystem() {
  try {
    // Récupérer l'instance Supabase depuis l'application
    const supabase = window.supabase;
    
    if (!supabase) {
      console.error('Impossible de trouver l\'instance Supabase dans window.supabase');
      
      // Essayer de trouver l'instance Supabase dans le code source
      const supabaseFromSrc = await fetch('/src/lib/supabase.js')
        .then(response => response.text())
        .then(text => {
          // Évaluer le code pour obtenir l'instance supabase
          const module = { exports: {} };
          eval(text);
          return module.exports.supabase;
        })
        .catch(() => null);
      
      if (!supabaseFromSrc) {
        console.error('Impossible de trouver l\'instance Supabase. Utilisation des valeurs par défaut.');
        return;
      }
    }
    
    // Vérifier si l'utilisateur est connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Aucun utilisateur connecté:', authError);
      return;
    }
    
    console.log('Utilisateur connecté:', user.id);
    
    // 1. Vérifier si la table notifications existe
    console.log('1. Vérification de la table notifications...');
    const { error: tableError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Erreur avec la table notifications:', tableError);
      if (tableError.code === '42P01') {
        console.error('La table notifications n\'existe pas. Veuillez exécuter le script SQL pour la créer.');
      }
      return;
    }
    
    console.log('✅ La table notifications existe.');
    
    // 2. Créer une notification de test
    console.log('2. Création d\'une notification de test...');
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'system',
        title: 'Test de notification',
        message: 'Ceci est une notification de test créée le ' + new Date().toLocaleString(),
        is_read: false
      })
      .select();
    
    if (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      return;
    }
    
    console.log('✅ Notification créée avec succès:', notifData);
    
    // 3. Vérifier si la notification apparaît dans la liste
    console.log('3. Vérification de la liste des notifications...');
    const { data: notifList, error: listError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (listError) {
      console.error('Erreur lors de la récupération des notifications:', listError);
      return;
    }
    
    console.log('✅ Liste des 5 dernières notifications:', notifList);
    
    // 4. Vérifier les hooks React
    console.log('4. Vérification des hooks React...');
    console.log('Pour vérifier si les hooks fonctionnent, veuillez:');
    console.log('1. Aller sur la page des notifications');
    console.log('2. Vérifier si la notification de test apparaît');
    console.log('3. Actualiser la page pour voir si les notifications sont chargées correctement');
    
    alert('Test terminé! Vérifiez la console pour les résultats et allez sur la page des notifications pour voir si la notification de test apparaît.');
  } catch (error) {
    console.error('Exception lors du test du système de notifications:', error);
  }
}

// Exécuter la fonction
testNotificationSystem(); 