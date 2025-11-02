#!/bin/bash

# Script pour corriger le problème d'upload d'avatar
# En remplaçant la fonction uploadAvatar dans le fichier src/hooks/use-profile.ts

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Script de correction pour l'upload d'avatar${NC}"
echo -e "${YELLOW}---------------------------------------${NC}"

# Vérifier que le fichier source existe
if [ ! -f "src/hooks/use-profile.ts" ]; then
  echo -e "${RED}Erreur: Le fichier src/hooks/use-profile.ts n'existe pas${NC}"
  exit 1
fi

# Créer une sauvegarde du fichier original
echo -e "${YELLOW}Création d'une sauvegarde du fichier original...${NC}"
cp src/hooks/use-profile.ts src/hooks/use-profile.ts.bak
if [ $? -ne 0 ]; then
  echo -e "${RED}Erreur lors de la création de la sauvegarde${NC}"
  exit 1
fi
echo -e "${GREEN}Sauvegarde créée: src/hooks/use-profile.ts.bak${NC}"

# Remplacer la fonction uploadAvatar dans le fichier
echo -e "${YELLOW}Modification de la fonction uploadAvatar...${NC}"

# Utiliser sed pour remplacer la fonction uploadAvatar
sed -i '' '/const uploadAvatar = async (file: File) => {/,/};/c\
  const uploadAvatar = async (file: File) => {\
    console.log("Début de l'\''upload de l'\''avatar", file);\
    \
    try {\
      // Vérifier que l'\''utilisateur est connecté\
      if (!user) {\
        console.error("Aucun utilisateur connecté");\
        toast({\
          variant: "destructive",\
          title: "Erreur",\
          description: "Vous devez être connecté pour mettre à jour votre photo de profil"\
        });\
        return null;\
      }\
      \
      // Vérification de la taille du fichier (limite à 2MB)\
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB\
      if (file.size > MAX_FILE_SIZE) {\
        console.error("Fichier trop volumineux:", file.size, "bytes");\
        toast({\
          variant: "destructive",\
          title: "Fichier trop volumineux",\
          description: "La taille maximale autorisée est de 2MB"\
        });\
        return null;\
      }\
      \
      // Vérification du type de fichier\
      if (!file.type.startsWith('\''image/'\'')) {\
        console.error("Type de fichier non supporté:", file.type);\
        toast({\
          variant: "destructive",\
          title: "Type de fichier non supporté",\
          description: "Veuillez choisir une image (JPG, PNG, etc.)"\
        });\
        return null;\
      }\
      \
      setUploading(true);\
      \
      // Extension de fichier et nom de fichier unique\
      const fileExt = file.name.split('\''.'\').pop()?.toLowerCase() || '\''jpg'\'';\
      const timestamp = Date.now();\
      const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;\
      \
      console.log("Uploading to path:", filePath);\
      \
      // Upload du fichier avec retries\
      const MAX_RETRIES = 3;\
      let attempt = 0;\
      let uploadError = null;\
      let uploadData = null;\
      \
      while (attempt < MAX_RETRIES) {\
        try {\
          console.log(`Tentative d'\''upload ${attempt + 1}/${MAX_RETRIES}`);\
          \
          const uploadResult = await supabase.storage\
            .from('\''avatars'\'')\
            .upload(filePath, file, { \
              upsert: true,\
              cacheControl: '\''3600'\'',\
              contentType: file.type\
            });\
          \
          uploadData = uploadResult.data;\
          uploadError = uploadResult.error;\
          \
          if (!uploadError) {\
            break; // Sortir de la boucle si l'\''upload est réussi\
          }\
          \
          console.warn(`Erreur à la tentative ${attempt + 1}:`, uploadError.message);\
          attempt++;\
          \
          // Attendre avant la prochaine tentative\
          if (attempt < MAX_RETRIES) {\
            await new Promise(resolve => setTimeout(resolve, 1000));\
          }\
        } catch (e) {\
          console.error("Exception lors de l'\''upload:", e);\
          uploadError = e;\
          attempt++;\
          \
          if (attempt < MAX_RETRIES) {\
            await new Promise(resolve => setTimeout(resolve, 1000));\
          }\
        }\
      }\
      \
      if (uploadError) {\
        throw uploadError;\
      }\
      \
      console.log("Upload réussi, récupération de l'\''URL publique");\
      \
      // Récupérer l'\''URL publique\
      const { data: { publicUrl } } = supabase.storage\
        .from('\''avatars'\'')\
        .getPublicUrl(filePath);\
      \
      console.log("URL publique générée:", publicUrl);\
      \
      // Tester que l'\''URL est accessible\
      try {\
        const response = await fetch(publicUrl, { method: '\''HEAD'\'' });\
        if (!response.ok) {\
          console.warn("L'\''URL publique n'\''est pas immédiatement accessible:", response.status);\
        } else {\
          console.log("URL publique vérifiée et accessible");\
        }\
      } catch (fetchError) {\
        console.warn("Impossible de vérifier l'\''accessibilité de l'\''URL:", fetchError);\
        // On continue car ce n'\''est pas bloquant\
      }\
      \
      // Mise à jour du profil avec la nouvelle URL\
      console.log("Mise à jour du profil avec la nouvelle URL d'\''avatar");\
      const profileUpdateResult = await updateProfile({ avatar_url: publicUrl });\
      \
      if (!profileUpdateResult) {\
        console.error("Échec de la mise à jour du profil avec la nouvelle URL d'\''avatar");\
        toast({\
          variant: "destructive",\
          title: "Erreur",\
          description: "L'\''image a été téléchargée mais le profil n'\''a pas pu être mis à jour"\
        });\
        return null;\
      }\
      \
      console.log("Upload et mise à jour du profil terminés avec succès");\
      toast({\
        title: "Succès",\
        description: "Votre photo de profil a été mise à jour"\
      });\
      \
      return publicUrl;\
    } catch (error) {\
      console.error('\''Error uploading avatar:'\'', error);\
      toast({\
        variant: "destructive",\
        title: "Erreur",\
        description: "Impossible de mettre à jour votre photo de profil"\
      });\
      return null;\
    } finally {\
      setUploading(false);\
    }\
  };' src/hooks/use-profile.ts

if [ $? -ne 0 ]; then
  echo -e "${RED}Erreur lors de la modification du fichier${NC}"
  echo -e "${YELLOW}Restauration de la sauvegarde...${NC}"
  mv src/hooks/use-profile.ts.bak src/hooks/use-profile.ts
  exit 1
fi

echo -e "${GREEN}Fonction uploadAvatar mise à jour avec succès${NC}"

# Appliquer les changements
echo -e "${YELLOW}Compilation du projet pour vérifier les erreurs...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}La compilation a échoué. Restauration de la sauvegarde...${NC}"
  mv src/hooks/use-profile.ts.bak src/hooks/use-profile.ts
  exit 1
fi

echo -e "${GREEN}✅ Mise à jour terminée avec succès!${NC}"
echo -e "${YELLOW}La fonction d'upload d'avatar a été améliorée avec:${NC}"
echo -e "  - Vérification de la taille du fichier (max 2MB)"
echo -e "  - Vérification du type de fichier (images uniquement)"
echo -e "  - Système de tentatives multiples en cas d'échec"
echo -e "  - Meilleure gestion des erreurs"
echo -e "  - Journalisation détaillée dans la console"
echo -e ""
echo -e "${YELLOW}Instructions pour tester:${NC}"
echo -e "1. Lancez l'application avec 'npm run dev'"
echo -e "2. Connectez-vous à votre compte"
echo -e "3. Allez sur la page de profil"
echo -e "4. Testez l'upload d'avatar"
echo -e ""
echo -e "Si vous rencontrez toujours des problèmes:"
echo -e "1. Vérifiez les messages d'erreur dans la console du navigateur"
echo -e "2. Exécutez le script de diagnostic (diagnostic-avatar-upload.js) dans la console du navigateur"
echo -e "3. Vérifiez les permissions du bucket 'avatars' dans Supabase" 