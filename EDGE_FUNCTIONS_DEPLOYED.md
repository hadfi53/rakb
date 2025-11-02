# ✅ Edge Functions Déployées

## Fonctions Déployées avec Succès

### 1. `create-payment-intent`
- **Statut:** ✅ Déployée et ACTIVE
- **Version:** 1
- **Description:** Crée un Payment Intent Stripe pour initier un paiement
- **Endpoint:** `https://kcujctyosmjlofppntfb.supabase.co/functions/v1/create-payment-intent`

### 2. `capture-payment`
- **Statut:** ✅ Déployée et ACTIVE
- **Description:** Capture et confirme un paiement Stripe, puis crée la réservation
- **Endpoint:** `https://kcujctyosmjlofppntfb.supabase.co/functions/v1/capture-payment`

## 🔧 Configuration Requise

### Variables d'Environnement

Les Edge Functions nécessitent les variables d'environnement suivantes dans Supabase:

1. **STRIPE_SECRET_KEY**
   - Clé secrète Stripe (commence par `sk_test_` ou `sk_live_`)
   - À configurer dans: Supabase Dashboard → Settings → Edge Functions → Secrets

2. **SUPABASE_URL** (automatique)
   - URL de votre projet Supabase
   - Définie automatiquement par Supabase

3. **SUPABASE_SERVICE_ROLE_KEY** (automatique)
   - Clé service role pour accès administrateur
   - Définie automatiquement par Supabase

## 📝 Configuration des Secrets

### Via Supabase Dashboard

1. Allez dans **Supabase Dashboard**
2. Votre projet → **Settings** → **Edge Functions**
3. Section **Secrets**
4. Ajoutez:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Votre clé secrète Stripe (ex: `sk_test_...`)

### Via CLI

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
```

## ✅ Vérification

Pour vérifier que les fonctions sont bien déployées:

```bash
supabase functions list
```

Ou via l'API MCP:
```javascript
mcp_supabase_list_edge_functions({ project_id: "kcujctyosmjlofppntfb" })
```

## 🐛 Dépannage

### Erreur: "Stripe secret key not configured"

**Solution:** Ajoutez la variable d'environnement `STRIPE_SECRET_KEY` dans Supabase Dashboard.

### Erreur: 404 Not Found

**Vérifier:**
1. ✅ La fonction est bien déployée (voir liste ci-dessus)
2. ✅ L'URL est correcte: `https://kcujctyosmjlofppntfb.supabase.co/functions/v1/create-payment-intent`
3. ✅ CORS est configuré (les fonctions incluent les headers CORS)

### Erreur: CORS

Les fonctions incluent déjà les headers CORS:
```javascript
"Access-Control-Allow-Origin": "*"
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
```

Si vous avez encore des erreurs CORS:
1. Vérifiez que la requête inclut les headers nécessaires
2. Vérifiez la requête preflight (OPTIONS)

## 🔄 Redéploiement

Si vous devez redéployer une fonction:

```bash
# Redéployer create-payment-intent
supabase functions deploy create-payment-intent

# Redéployer capture-payment
supabase functions deploy capture-payment
```

## 📚 Documentation

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)

---

**Date de déploiement:** $(date)
**Project ID:** `kcujctyosmjlofppntfb`

