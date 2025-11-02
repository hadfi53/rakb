# ✅ Corrections CSP Stripe et Edge Functions

## 🔧 Problèmes Résolus

### 1. ✅ Content Security Policy (CSP)
**Problème:** Les ressources Stripe (`r.stripe.com`, blobs) étaient bloquées par la CSP.

**Solution:** Ajouté `https://r.stripe.com` à tous les directives CSP:
- ✅ `script-src` - Pour les scripts Stripe
- ✅ `style-src` - Pour les styles Stripe
- ✅ `img-src` - Pour les images Stripe
- ✅ `connect-src` - Pour les requêtes réseau Stripe
- ✅ `frame-src` - Pour les iframes Stripe
- ✅ `child-src` - Pour les child frames Stripe

**Fichiers modifiés:**
- ✅ `index.html` - CSP pour développement
- ✅ `netlify.toml` - CSP pour production Netlify
- ✅ `vercel.json` - CSP pour production Vercel

### 2. ✅ Edge Function `capture-payment`
**Problème:** Erreur 400 lors de la création de booking.

**Solutions appliquées:**
- ✅ Meilleure gestion d'erreurs avec logs détaillés
- ✅ Support des deux schémas de base de données (`car_id` vs `vehicle_id`)
- ✅ Validation améliorée des données reçues
- ✅ Messages d'erreur plus explicites

**Fonction redéployée:** Version 2 active

## 📝 Améliorations

### Logs de Debug Améliorés
Dans `src/lib/payment/stripe.ts`, vous verrez maintenant:
- ✅ Les données envoyées à `capture-payment`
- ✅ Les erreurs détaillées de l'Edge Function
- ✅ Les messages d'erreur complets

### Gestion des Schémas
La fonction `capture-payment` essaie maintenant:
1. D'abord avec `car_id`, `user_id`, `host_id`
2. Si ça échoue, essaie avec `vehicle_id`, `renter_id`, `owner_id`

## 🚀 Test

1. **Rechargez complètement la page** (Ctrl+Shift+R ou Cmd+Shift+R)
2. **Essayez un paiement**
3. **Regardez la console** pour les logs détaillés

### Si l'erreur persiste

1. **Vérifiez les logs dans la console:**
   - Vous devriez voir `"Calling capture-payment with:"` avec les données
   - Si erreur, vous verrez les détails complets

2. **Vérifiez les logs de l'Edge Function:**
   - Supabase Dashboard → Edge Functions → `capture-payment` → Logs
   - Regardez les erreurs détaillées

3. **Vérifiez STRIPE_SECRET_KEY:**
   - Supabase Dashboard → Settings → Edge Functions → Secrets
   - Assurez-vous que `STRIPE_SECRET_KEY` est configuré

## ✅ Prochaines Étapes

Après ces corrections:
1. ✅ Les erreurs CSP Stripe devraient disparaître
2. ✅ L'Edge Function devrait fonctionner (avec logs améliorés)
3. ✅ Les erreurs seront plus explicites pour debug

Si vous avez encore des erreurs, les nouveaux logs vous diront exactement ce qui ne va pas!

---

**Date:** $(date)
**Edge Function version:** 2
**CSP:** Mise à jour dans tous les fichiers de config
