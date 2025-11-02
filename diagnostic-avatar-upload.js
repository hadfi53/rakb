// Script de diagnostic pour l'upload d'avatar
// À coller dans la console du navigateur pendant que vous êtes connecté à l'application

async function diagnosticAvatarUpload() {
  console.log("🔍 Diagnostic de l'upload d'avatar");
  console.log("------------------------------------");
  
  // 1. Vérifier si Supabase est accessible
  const supabase = window.supabase;
  if (!supabase) {
    console.error("❌ L'instance Supabase n'est pas accessible depuis la fenêtre");
    return;
  }
  console.log("✅ Instance Supabase trouvée");
  
  // 2. Vérifier si l'utilisateur est connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("❌ Impossible de récupérer l'utilisateur connecté:", userError?.message || "Non connecté");
    return;
  }
  console.log("✅ Utilisateur connecté:", user.id);
  
  // 3. Vérifier si le bucket 'avatars' existe et si nous avons accès
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Erreur lors de la liste des buckets:", bucketsError.message);
      return;
    }
    
    const avatarBucket = buckets.find(b => b.name === 'avatars');
    if (!avatarBucket) {
      console.error("❌ Le bucket 'avatars' n'existe pas");
      return;
    }
    
    console.log("✅ Bucket 'avatars' trouvé", avatarBucket);
    
    // 4. Vérifier les permissions du bucket
    console.log("ℹ️ Tentative de listage des fichiers dans le bucket 'avatars'");
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list(user.id, {
        limit: 1,
        offset: 0,
      });
    
    if (filesError) {
      console.warn("⚠️ Impossible de lister les fichiers dans le dossier de l'utilisateur:", filesError.message);
      console.log("   Cela peut être normal si vous n'avez pas encore d'avatar ou si les permissions sont restreintes.");
    } else {
      console.log("✅ Accès au bucket 'avatars' confirmé. Fichiers trouvés:", files);
    }
    
    // 5. Tester l'upload d'un petit fichier
    console.log("ℹ️ Création d'une petite image de test...");
    
    // Créer un petit canvas pour générer une image de test
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, 100, 100);
    
    // Convertir le canvas en blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const testFile = new File([blob], "test-avatar.png", { type: 'image/png' });
    
    console.log("ℹ️ Tentative d'upload du fichier de test...");
    
    const testFilePath = `${user.id}/test-avatar-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFilePath, testFile, { upsert: true });
    
    if (uploadError) {
      console.error("❌ Échec de l'upload du fichier test:", uploadError.message);
      if (uploadError.statusCode === 403) {
        console.error("   Erreur de permission: Vérifiez les politiques RLS du bucket dans Supabase");
      } else if (uploadError.statusCode === 404) {
        console.error("   Bucket non trouvé: Le bucket 'avatars' n'existe peut-être pas");
      } else if (uploadError.statusCode === 413) {
        console.error("   Fichier trop volumineux: Le fichier dépasse la limite de taille");
      } else {
        console.error("   Code d'erreur:", uploadError.statusCode);
      }
    } else {
      console.log("✅ Upload du fichier test réussi:", uploadData);
      
      // 6. Vérifier qu'on peut récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(testFilePath);
      
      console.log("✅ URL publique générée:", publicUrl);
      
      // 7. Vérifier qu'on peut accéder à l'image
      console.log("ℹ️ Vérification de l'accès à l'URL publique...");
      
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log("✅ L'URL publique est accessible");
        } else {
          console.error("❌ L'URL publique n'est pas accessible:", response.status, response.statusText);
        }
      } catch (fetchError) {
        console.error("❌ Erreur lors de l'accès à l'URL publique:", fetchError);
      }
      
      // 8. Nettoyer le fichier de test
      try {
        const { error: removeError } = await supabase.storage
          .from('avatars')
          .remove([testFilePath]);
          
        if (removeError) {
          console.warn("⚠️ Impossible de supprimer le fichier de test:", removeError.message);
        } else {
          console.log("✅ Fichier de test supprimé avec succès");
        }
      } catch (removeError) {
        console.warn("⚠️ Exception lors de la suppression du fichier de test:", removeError);
      }
    }
    
    // 9. Vérifier la fonctionnalité de mise à jour du profil
    console.log("ℹ️ Test de la mise à jour du profil...");
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("❌ Impossible de récupérer le profil:", profileError.message);
      } else {
        console.log("✅ Profil récupéré avec succès:", profileData);
        console.log("   Avatar URL actuel:", profileData.avatar_url);
      }
    } catch (profileError) {
      console.error("❌ Exception lors de la récupération du profil:", profileError);
    }
  } catch (error) {
    console.error("❌ Exception générale pendant le diagnostic:", error);
  }
  
  console.log("------------------------------------");
  console.log("🔍 Diagnostic terminé");
  console.log("Si vous rencontrez des erreurs, vérifiez:");
  console.log("1. Les permissions du bucket 'avatars' dans la console Supabase");
  console.log("2. La taille du fichier que vous essayez d'uploader (idéalement moins de 2MB)");
  console.log("3. Le type de fichier (utilisez uniquement des formats d'image courants comme PNG ou JPEG)");
  console.log("4. Les problèmes réseau (essayez sur une autre connexion)");
}

// Lancer le diagnostic
diagnosticAvatarUpload(); 