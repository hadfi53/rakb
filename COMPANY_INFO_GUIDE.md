# 📋 Guide des Informations de la Company RAKB

## 📍 Configuration Centralisée

**Tous les changements d'informations de la company doivent être faits dans :**
```
src/lib/config/company.ts
```

### Informations Configurables

1. **Nom de la company**
   - `companyInfo.name` : "RAKB"
   - `companyInfo.fullName` : "RAKB - Location de Véhicules au Maroc"

2. **Contact**
   - `companyInfo.email` : Email principal
   - `companyInfo.phone` : Numéro de téléphone (format brut)
   - `companyInfo.phoneDisplay` : Numéro formaté pour affichage
   - `companyInfo.supportEmail` : Email support
   - `companyInfo.legalEmail` : Email légal

3. **Adresse**
   - `companyInfo.address.street` : Rue
   - `companyInfo.address.city` : Ville
   - `companyInfo.address.country` : Pays
   - `companyInfo.address.full` : Adresse complète

4. **Horaires**
   - `companyInfo.businessHours.weekdays` : Horaires semaine
   - `companyInfo.businessHours.weekend` : Horaires weekend
   - `companyInfo.businessHours.emergency` : Service urgence

5. **Réseaux sociaux**
   - `companyInfo.social.facebook`
   - `companyInfo.social.twitter`
   - `companyInfo.social.instagram`
   - `companyInfo.social.linkedin`

6. **Site web**
   - `companyInfo.website`

## 🔧 Où les Informations sont Utilisées

### Pages qui utilisent la config :

1. **Footer** (`src/components/Footer.tsx`)
   - ✅ Email, téléphone, adresse
   - ✅ Liens réseaux sociaux

2. **Contact** (`src/pages/contact/Contact.tsx`)
   - ✅ Formulaire de contact
   - ✅ Email et téléphone affichés

3. **Help** (`src/pages/help/Help.tsx`)
   - ✅ Page d'aide complète avec recherche
   - ✅ Liens vers contact et urgence

4. **Emergency** (`src/pages/emergency/Emergency.tsx`)
   - ✅ Numéros d'urgence
   - ✅ Liens téléphone cliquables

5. **ReceiptPage** (`src/pages/bookings/ReceiptPage.tsx`)
   - ✅ Informations company sur les reçus

6. **InvoicePage** (`src/pages/bookings/InvoicePage.tsx`)
   - ✅ Informations company sur les factures

## ⚠️ Points d'Attention

### Fonction contact-form

Le formulaire de contact utilise une Edge Function Supabase :
- **Fichier** : `supabase/functions/contact-form/index.ts`
- **Status** : ✅ **Fonction déployée et active dans Supabase**

**Configuration nécessaire :**
1. Variables d'environnement à configurer dans Supabase Dashboard :
   - `RESEND_API_KEY` (optionnel, pour envoi email direct)
   - `CONTACT_EMAIL` (email de destination, défaut: contact@rakb.ma)

**Comment configurer :**
```bash
# Via Supabase CLI
supabase secrets set RESEND_API_KEY=votre_clé_ici
supabase secrets set CONTACT_EMAIL=admin@rakb.ma

# Ou via Supabase Dashboard : Project Settings → Edge Functions → Secrets
```

**Fonctionnalités :**
- ✅ Validation des données du formulaire
- ✅ Envoi email via Resend (si configuré)
- ✅ Enregistrement dans `email_queue` pour traitement ultérieur
- ✅ Fallback vers `contact_submissions` si `email_queue` n'existe pas
- ✅ Gestion CORS pour appels depuis le frontend

### Pages qui ont besoin d'attention

1. **About** (`src/pages/about/About.tsx`)
   - ❌ N'utilise pas encore la config (infos hardcodées dans le contenu)
   - 📝 À mettre à jour si nécessaire

2. **Blog**
   - Contenu éditorial, pas besoin de config company

## 📝 Comment Modifier les Informations

### Pour changer l'email :
```typescript
// Dans src/lib/config/company.ts
export const companyInfo = {
  email: "nouveau-email@rakb.ma",  // ← Modifier ici
  // ...
}
```

### Pour changer le téléphone :
```typescript
export const companyInfo = {
  phone: "+212 6 XX XX XX XX",        // Format brut
  phoneDisplay: "+212 6 XX XX XX XX",  // Format affiché
  // ...
}
```

### Pour changer l'adresse :
```typescript
export const companyInfo = {
  address: {
    street: "Nouvelle adresse",
    city: "Ville",
    country: "Maroc",
    full: "Adresse complète formatée"
  }
}
```

## ✅ Pages Fonctionnelles

- ✅ **Help** (`/help`) : Page d'aide complète avec recherche fonctionnelle
- ✅ **Contact** (`/contact`) : Formulaire de contact (nécessite Edge Function)
- ✅ **Emergency** (`/emergency`) : Service d'urgence avec liens téléphone
- ✅ **Footer** : Toutes les infos utilisent la config
- ✅ **ReceiptPage** : Utilise la config
- ✅ **InvoicePage** : Utilise la config

## 🚀 Actions Requises

1. **Créer/Déployer la fonction contact-form dans Supabase**
   - Fichier source : `supabase/functions/contact-form/index.ts`
   - Configurer les variables d'environnement

2. **Vérifier les numéros de téléphone**
   - Actuellement : `+212 6 00 00 00 00` (placeholder)
   - ⚠️ **À remplacer par le vrai numéro avant la mise en production**

3. **Vérifier les URLs des réseaux sociaux**
   - Actuellement : URLs placeholder
   - ⚠️ **À mettre à jour avec les vrais comptes**

4. **Vérifier l'adresse**
   - Actuellement : "123 Avenue Mohammed V, Casablanca"
   - ⚠️ **À mettre à jour avec la vraie adresse**

---

**Toutes les modifications doivent être faites dans `src/lib/config/company.ts` pour que les changements se répercutent partout dans l'application.**

