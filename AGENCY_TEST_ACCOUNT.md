# Compte Agence de Test - RAKB Platform

## 🔐 Identifiants de Test

### Option 1 : Compte existant (déjà configuré comme owner)
```
📧 Email    : hhadfi53@gmail.com
🔑 Password : Bmx4ever
```

### Option 2 : Nouveau compte agence (à créer avec le script)
```
📧 Email    : agency@rakeb.test
🔑 Password : Agency123!
```

## 🚀 Créer un compte agence

### Méthode 1 : Via le script automatique

```bash
# Créer un nouveau compte agence
node create-agency-account.js new

# OU transformer le compte existant en agence
node create-agency-account.js existing
```

### Méthode 2 : Via l'interface web

1. **S'inscrire comme propriétaire**
   - Aller sur `/auth/register`
   - Sélectionner le rôle "Propriétaire/Agence"
   - Remplir le formulaire d'inscription

2. **Devenir propriétaire depuis un compte existant**
   - Se connecter avec votre compte
   - Aller sur `/owner/become-owner`
   - Suivre le processus de vérification

## ✅ Vérifier que le compte est bien configuré

Après connexion, vous devriez pouvoir :
- ✅ Accéder à `/dashboard/owner`
- ✅ Voir le menu "Dashboard Agence" dans la navigation
- ✅ Ajouter des véhicules via `/dashboard/owner/vehicles`
- ✅ Gérer les réservations via `/dashboard/owner/bookings`

## 🔧 Si le compte n'a pas les droits owner

Si vous êtes connecté mais n'avez pas accès au dashboard owner, exécutez :

```bash
node create-agency-account.js existing
```

Cela transformera votre compte en propriétaire.

## 📝 Notes importantes

- Le compte `hhadfi53@gmail.com` est déjà configuré comme owner selon les scripts de test
- Si vous créez un nouveau compte, assurez-vous que l'email n'existe pas déjà
- Le flag `verified_host: true` est nécessaire pour accéder aux fonctionnalités host

## 🐛 Dépannage

Si vous rencontrez des problèmes :

1. **Vérifier le rôle dans Supabase**
   ```sql
   SELECT id, email, role, verified_host 
   FROM profiles 
   WHERE email = 'votre-email@example.com';
   ```

2. **Mettre à jour manuellement le rôle**
   ```sql
   UPDATE profiles 
   SET role = 'owner', verified_host = true 
   WHERE email = 'votre-email@example.com';
   ```

3. **Vérifier les métadonnées utilisateur**
   - Dans Supabase Dashboard > Authentication > Users
   - Vérifier que `user_metadata.role = 'owner'`
