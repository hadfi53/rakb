# 🖼️ Guide de correction des images Supabase Storage

## ✅ Corrections effectuées

### 1. Fonction `getVehicleImageUrl` améliorée
- ✅ **Conversion automatique** : Convertit les URLs signées (`/sign/`) en URLs publiques (`/public/`)
- ✅ **Normalisation des URLs** : Toutes les URLs Supabase sont normalisées pour utiliser `/storage/v1/object/public/`
- ✅ **Gestion des chemins** : Supporte les différents formats de chemins (UUID, images/, etc.)
- ✅ **Fallback robuste** : Retourne toujours `/placeholder.svg` si l'image n'est pas disponible

### 2. Système de diagnostic intégré
- ✅ **Diagnostics au démarrage** : Vérifie l'accessibilité du bucket en mode développement
- ✅ **Logs détaillés** : Affiche des messages clairs dans la console avec emojis (🖼️, ✅, ⚠️, ❌)
- ✅ **Test d'accessibilité** : Teste chaque image chargée et affiche les erreurs
- ✅ **Recommandations** : Fournit des instructions claires en cas de problème

### 3. Composants mis à jour
- ✅ Tous les composants utilisent maintenant `getVehicleImageUrl()`
- ✅ Gestion d'erreur avec `onError` sur les balises `<img>`
- ✅ Fallback vers placeholder si l'image ne charge pas

## 🔍 Comment vérifier que le bucket est public

### Option 1 : Via Supabase Dashboard (Recommandé)

1. **Allez sur** https://supabase.com/dashboard
2. **Sélectionnez votre projet** RAKB
3. **Allez dans** `Storage` dans le menu de gauche
4. **Cliquez sur** `Buckets`
5. **Trouvez le bucket** `vehicles` dans la liste
6. **Cliquez sur** le bucket `vehicles`
7. **Allez dans l'onglet** `Settings` (ou `Configuration`)
8. **Activez** l'option `Public bucket` (ou "Bucket public")
9. **Sauvegardez** les modifications

### Option 2 : Via les logs de la console

Quand vous démarrez l'application en mode développement :

1. **Ouvrez la console du navigateur** (F12)
2. **Cherchez les messages** qui commencent par :
   - `🔍 Diagnostic: Vérification de l'accessibilité du bucket "vehicles"...`
   - `✅ Bucket "vehicles" est accessible publiquement` → **OK, le bucket est public**
   - `⚠️ Bucket "vehicles" pourrait être privé` → **Le bucket n'est PAS public**

### Option 3 : Tester manuellement une URL

1. **Trouvez une URL d'image** dans la console (message `🖼️ Generated image URL:`)
2. **Copiez l'URL** (format: `https://kcujctyosmjlofppntfb.supabase.co/storage/v1/object/public/vehicles/...`)
3. **Collez-la dans un nouvel onglet**
4. **Si l'image s'affiche** → Le bucket est public ✅
5. **Si vous voyez une erreur 404/403** → Le bucket est privé ❌

## 📝 Format d'URL attendu

### ✅ URL publique (correcte)
```
https://kcujctyosmjlofppntfb.supabase.co/storage/v1/object/public/vehicles/images/image.jpg
```

### ❌ URL signée (sera convertie automatiquement)
```
https://kcujctyosmjlofppntfb.supabase.co/storage/v1/object/sign/vehicles/images/image.jpg?token=...
```

## 🐛 Résolution de problèmes

### Problème : Les images ne s'affichent toujours pas

1. **Vérifiez la console** pour les messages d'erreur
2. **Vérifiez que le bucket est public** (voir Option 1 ci-dessus)
3. **Vérifiez les politiques RLS** :
   - Allez dans Storage > Policies
   - Assurez-vous qu'il y a une politique qui permet la lecture publique
4. **Vérifiez le chemin dans la base de données** :
   - Le chemin doit être correct (ex: `images/image.jpg` ou `uuid/uuid/image.jpg`)
   - Pas de chemins invalides comme `"bookings"` ou valeurs null

### Problème : Erreurs CORS

Si vous voyez des erreurs CORS, vérifiez :
- ✅ Que le bucket est bien public
- ✅ Que les politiques RLS permettent l'accès
- ✅ Que l'URL Supabase est correcte dans `.env`

## 🔧 Variables d'environnement

Assurez-vous que votre fichier `.env` contient :
```env
VITE_SUPABASE_URL=https://kcujctyosmjlofppntfb.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

## 📊 Logs de diagnostic

En mode développement, vous verrez dans la console :

```
🔍 ========== DIAGNOSTICS IMAGES SUPABASE ==========
🔍 Diagnostic: Vérification de l'accessibilité du bucket "vehicles"...
📍 URL de test: https://kcujctyosmjlofppntfb.supabase.co/storage/v1/object/public/vehicles/images/test-vehicle.jpg
✅ Bucket "vehicles" est accessible publiquement
📊 Résultat: { bucketAccessible: true, ... }
✅ Le bucket "vehicles" est correctement configuré
🔍 ================================================
```

Ou en cas de problème :
```
⚠️ Bucket "vehicles" pourrait être privé (status: 403)
💡 Recommendation: Allez dans Supabase Dashboard > Storage > Buckets > "vehicles" > Settings > Activez "Public bucket"
❌ Le bucket "vehicles" n'est PAS accessible publiquement
```

Pour chaque image chargée :
```
🖼️ Generated image URL: { original: "images/car.jpg", path: "images/car.jpg", publicUrl: "...", bucket: "vehicles" }
✅ Image loaded successfully: https://...
```

Ou en cas d'erreur :
```
⚠️ Image failed to load: https://...
💡 Action requise: Allez dans Supabase Dashboard > Storage > Buckets > "vehicles" > Settings > Activez "Public bucket"
```

## ✅ Checklist de vérification

Avant de déclarer que tout fonctionne :

- [ ] Le bucket `vehicles` est marqué comme "Public" dans Supabase Dashboard
- [ ] Les diagnostics au démarrage affichent `✅ Bucket "vehicles" est accessible publiquement`
- [ ] Les images s'affichent correctement dans la liste des véhicules
- [ ] Les images s'affichent dans les détails d'un véhicule
- [ ] Les images s'affichent dans les réservations
- [ ] Les logs de la console ne montrent pas d'erreurs `⚠️ Image failed to load`
- [ ] Les URLs générées utilisent `/storage/v1/object/public/` (pas `/sign/`)

## 📞 Support

Si après toutes ces étapes les images ne s'affichent toujours pas :
1. Capturez les logs de la console
2. Vérifiez une URL d'image directement dans le navigateur
3. Vérifiez les politiques RLS dans Supabase Dashboard
4. Contactez l'équipe de développement avec ces informations

