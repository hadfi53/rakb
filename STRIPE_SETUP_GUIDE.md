# 🔧 Guide de Configuration Stripe

## ⚠️ Problème: Payment Intent "Incomplete" sans Info Client

### Symptômes
- ✅ Payment Intent créé avec montant
- ❌ Statut: "incomplete"
- ❌ Aucune information client dans Stripe

### Solutions Appliquées

### ✅ 1. Création de Customer Stripe
La fonction `create-payment-intent` crée maintenant automatiquement un customer Stripe si un email est fourni:
- Cherche un customer existant avec cet email
- Sinon, crée un nouveau customer
- Lie le Payment Intent au customer

### ✅ 2. Métadonnées Améliorées
Les Payment Intents incluent maintenant:
- `booking_id` - ID du véhicule
- `user_id` - ID utilisateur
- `host_id` - ID propriétaire
- `start_date` / `end_date` - Dates de réservation
- `total_amount` - Montant total

### ✅ 3. Confirmation du Paiement
La fonction `capture-payment`:
1. Crée un Payment Method avec les données de carte
2. Met à jour le Payment Intent avec le Payment Method
3. Confirme le Payment Intent
4. Vérifie que le statut est "succeeded"

## 🚨 Action Requise dans Stripe Dashboard

### Pour Activer les Tests avec Numéros de Carte Bruts

**⚠️ IMPORTANT:** Stripe bloque par défaut l'envoi direct de numéros de carte pour la sécurité.

Pour activer les tests (développement uniquement):

1. Allez dans **Stripe Dashboard**
2. **Settings** → **API** → **Payment Methods**
3. Trouvez **"Enable access to raw card data APIs"**
4. Activez cette option
5. ⚠️ **Note:** Cette option est uniquement pour les tests. En production, utilisez **Stripe Elements**.

### Alternative: Utiliser Stripe Elements (Recommandé)

Pour la production, utilisez Stripe Elements qui:
- ✅ Collecte les données de carte de manière sécurisée
- ✅ Ne nécessite pas d'activer "raw card data APIs"
- ✅ Est conforme PCI-DSS
- ✅ Fonctionne directement

## 📋 Vérifications

### Dans Stripe Dashboard

Après un paiement, vous devriez voir:

1. **Payment Intent:**
   - ✅ Statut: `succeeded`
   - ✅ Customer: Lien vers le customer
   - ✅ Métadonnées: booking_id, user_id, etc.

2. **Customer:**
   - ✅ Email du client
   - ✅ Nom (si fourni)
   - ✅ Historique des paiements

### Dans les Logs Supabase

Allez dans **Supabase Dashboard** → **Edge Functions** → **capture-payment** → **Logs**

Vous verrez:
- `Payment Intent status:` - Le statut initial
- `Payment Intent customer:` - L'ID du customer (si créé)
- `Payment method created:` - L'ID du payment method
- `Payment Intent updated, status:` - Après mise à jour
- `Payment Intent confirmed, status:` - Après confirmation (doit être "succeeded")

## 🔍 Dépannage

### Si le Payment Intent reste "incomplete"

1. **Vérifiez les logs Supabase:**
   - Edge Functions → capture-payment → Logs
   - Cherchez les erreurs de confirmation

2. **Vérifiez Stripe Dashboard:**
   - Payment Intents → Votre Payment Intent
   - Regardez "Last payment error" pour les détails

3. **Erreur commune: "raw card data"**
   - Activez "Enable access to raw card data APIs" dans Stripe
   - Ou utilisez Stripe Elements

### Si Pas d'Info Client

1. **Vérifiez que l'email est envoyé:**
   - Console du navigateur → `"Calling capture-payment with:"`
   - Vérifiez que `userInfo.email` est présent

2. **Vérifiez les logs:**
   - Edge Functions → create-payment-intent → Logs
   - Vérifiez les erreurs de création de customer

## ✅ Prochaines Étapes

1. **Activez "raw card data APIs" dans Stripe** (pour les tests)
2. **Testez un nouveau paiement**
3. **Vérifiez dans Stripe Dashboard:**
   - Customer créé
   - Payment Intent avec statut "succeeded"
   - Métadonnées présentes

---

**Version Edge Functions:**
- `create-payment-intent`: v2 (avec customer)
- `capture-payment`: v3 (avec logs améliorés)

**Date:** $(date)

