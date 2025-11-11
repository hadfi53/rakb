# 🔐 Compte de Test - Locataire Vérifié

## ✅ Compte Créé avec Succès

Un compte de test pour louer des voitures a été créé dans votre base Supabase.

## 📧 Identifiants de Connexion

```
📧 Email    : test-renter@rakb.test
🔑 Password : [SET IN SUPABASE DASHBOARD - DO NOT COMMIT]
```

## ✅ Statut du Compte

- ✅ **verified_tenant**: `true` - Peut louer des voitures
- ✅ **verified_host**: `false` - Ne peut pas publier de véhicules
- ✅ **is_verified**: `true` - Compte vérifié
- ✅ **is_active**: `true` - Compte actif
- ✅ **role**: `locataire` - Rôle locataire

## 🚀 Utilisation

### 1. Se Connecter
1. Allez sur `/auth/login` ou `/login`
2. Entrez:
   - Email: `test-renter@rakb.test`
   - Password: [Set in Supabase Dashboard]
3. Cliquez sur "Se connecter"

### 2. Tester le Flux de Location

Une fois connecté, vous pouvez:

1. **Rechercher une voiture**
   - Allez sur la page d'accueil ou `/search`
   - Entrez une localisation (ex: "Rabat", "Casablanca")
   - Sélectionnez des dates
   - Cliquez sur "Rechercher"

2. **Réserver une voiture**
   - Cliquez sur une voiture
   - Cliquez sur "Réserver"
   - Remplissez les détails de réservation
   - Procédez au paiement (test avec Stripe)

3. **Voir vos réservations**
   - Allez sur `/dashboard/renter/bookings`
   - Vous verrez toutes vos réservations

## 🔍 Vérification dans Supabase

Pour vérifier le compte dans Supabase Dashboard:

```sql
SELECT 
  p.id,
  u.email,
  p.first_name,
  p.last_name,
  p.role,
  p.verified_tenant,
  p.verified_host,
  p.is_verified,
  p.is_active
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'test-renter@rakb.test';
```

## 🛠️ Si le Compte Ne Fonctionne Pas

### Problème: Impossible de se connecter

1. **Vérifier que l'email est confirmé:**
   ```sql
   SELECT email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'test-renter@rakb.test';
   ```

2. **Si email_confirmed_at est NULL, mettre à jour:**
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW()
   WHERE email = 'test-renter@rakb.test';
   ```

### Problème: verified_tenant est false

```sql
UPDATE public.profiles
SET verified_tenant = true,
    is_verified = true,
    is_active = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'test-renter@rakb.test'
);
```

## 📝 Notes

- Ce compte est uniquement pour les tests
- Le compte peut louer des voitures mais ne peut pas publier de véhicules
- Pour devenir host, utilisez le flux "Become a Host" dans l'application

## 🎯 Prochaines Étapes de Test

1. ✅ Connectez-vous avec le compte de test
2. ✅ Recherchez une voiture disponible
3. ✅ Créez une réservation
4. ✅ Testez le processus de paiement
5. ✅ Vérifiez les notifications
6. ✅ Vérifiez le dashboard locataire

---

**Compte créé le:** $(date)
**User ID:** `3b446270-0252-409f-909a-869bd1e6cfa8`

