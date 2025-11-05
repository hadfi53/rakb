# 🔐 Compte Administrateur RAKB

## ✅ Compte Créé avec Succès

Le compte administrateur a été créé dans votre base Supabase.

## 📧 Identifiants de Connexion

```
📧 Email    : rakb@rakb.ma
🔑 Password : Rakb@2025
```

## ✅ Statut du Compte

- ✅ **User ID**: `8f872567-e919-446f-9478-29cadc1c8808`
- ✅ **Email confirmé**: Oui
- ✅ **Role (metadata)**: `admin`
- ✅ **Role (profile)**: `admin`
- ✅ **User Role**: `admin`
- ✅ **verified_tenant**: `true`
- ✅ **verified_host**: `true`
- ✅ **is_verified**: `true`
- ✅ **is_active**: `true`
- ✅ **First Name**: `Admin`
- ✅ **Last Name**: `RAKB`

## 🚀 Utilisation

### 1. Se Connecter
1. Allez sur `/auth/login` ou `/login`
2. Entrez:
   - Email: `rakb@rakb.ma`
   - Password: `Rakb@2025`
3. Cliquez sur "Se connecter"

### 2. Accéder aux Pages Admin

Une fois connecté, vous pouvez accéder à:

- ✅ `/admin/users` - Gérer les utilisateurs
- ✅ `/admin/documents` - Gérer les documents de vérification
- ✅ `/admin/vehicles` - Gérer les véhicules
- ✅ `/admin/emails` - Gérer les emails

## 🔍 Vérification dans Supabase

Pour vérifier le compte dans Supabase Dashboard:

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'role' as role_metadata,
  p.role as profile_role,
  p.user_role,
  p.verified_tenant,
  p.verified_host,
  p.is_verified,
  p.is_active,
  p.first_name,
  p.last_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'rakb@rakb.ma';
```

## 📝 Notes importantes

- Le compte est créé et configuré comme administrateur
- L'email est confirmé automatiquement
- Le compte a tous les droits (tenant et host vérifiés)
- Vous pouvez maintenant gérer les utilisateurs, documents, et véhicules depuis les pages admin

---

**Compte créé le:** 2025-11-05  
**User ID:** `8f872567-e919-446f-9478-29cadc1c8808`

