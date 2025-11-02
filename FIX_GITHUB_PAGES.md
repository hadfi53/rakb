# 🔧 Pourquoi ça ne marche pas et comment le réparer

## ❌ Le Problème

**Ancien site (HTML/CSS):**
- Fichiers statiques (`index.html`, `style.css`)
- GitHub Pages peut les servir directement ✅
- Fonctionnait sans problème

**Nouveau site (React/Vite):**
- Code source qui doit être **compilé** avant d'être servi
- GitHub Pages ne compile PAS automatiquement ❌
- Il faut utiliser `npm run build` pour créer le dossier `dist/`

## ✅ La Solution: Cloudflare Pages

Cloudflare Pages peut:
- ✅ Connecter votre repo GitHub
- ✅ Compiler automatiquement (`npm run build`) à chaque push
- ✅ Servir le dossier `dist/` compilé
- ✅ Utiliser votre domaine `rakb.ma`

---

## 🚀 Étapes Rapides (5 minutes)

### Étape 1: Aller sur Cloudflare Pages
1. Allez sur: https://dash.cloudflare.com
2. Cliquez **Pages** (menu gauche)
3. Cliquez **Create a project**

### Étape 2: Connecter GitHub
1. Cliquez **Connect to Git**
2. Sélectionnez **GitHub**
3. Autorisez Cloudflare si demandé
4. Sélectionnez le repo: **hadfi53/rakb**
5. Cliquez **Begin setup**

### Étape 3: Configuration du Build
- **Project name:** `rakeb-website`
- **Production branch:** `main`
- **Framework preset:** `Vite` (ou "None" puis entrer manuellement)
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### Étape 4: Variables d'Environnement (TRÈS IMPORTANT!)

Ajoutez ces variables AVANT le premier déploiement:

```
VITE_SUPABASE_URL = https://kcujctyosmjlofppntfb.supabase.co
VITE_SUPABASE_ANON_KEY = [votre_clé_anon]
VITE_STRIPE_PUBLISHABLE_KEY = pk_live_... (ou pk_test_...)
VITE_APP_URL = https://rakb.ma
VITE_APP_NAME = RAKB
```

**Important:** Cochez les 3 environnements: Production, Preview, Browser Preview

### Étape 5: Déployer
1. Cliquez **Save and Deploy**
2. Attendez 2-5 minutes (première fois peut prendre plus longtemps)

### Étape 6: Ajouter le Domaine
1. Après le déploiement → onglet **Custom domains**
2. Cliquez **Set up a custom domain**
3. Entrez: `rakb.ma`
4. Cliquez **Continue**

### Étape 7: Mettre à jour le DNS dans Cloudflare
1. Allez dans Cloudflare Dashboard → votre domaine → **DNS** → **Records**
2. Trouvez/modifiez le record pour `rakb.ma`:
   - **Type:** `CNAME`
   - **Name:** `@` (ou laissez vide)
   - **Target:** `[votre-projet].pages.dev` (Cloudflare vous le montrera)
   - **Proxy:** ✅ Proxied (nuage orange)
3. Cliquez **Save**

### Étape 8: Attendre le SSL
- Cloudflare générera automatiquement le certificat SSL
- Prend 5-15 minutes
- Vérifiez dans **Custom domains**

### Étape 9: Tester!
Visitez: https://rakb.ma

---

## 🎯 Ce qui va se passer maintenant:

1. **Déploiement automatique:** Chaque fois que vous poussez du code sur `main`, Cloudflare:
   - Récupère le code
   - Exécute `npm install`
   - Exécute `npm run build`
   - Déploie le dossier `dist/`

2. **Plus besoin de compiler manuellement!** Cloudflare le fait automatiquement.

3. **Votre site sera toujours à jour** dès que vous poussez du code.

---

## ⚠️ Si vous voulez garder GitHub Pages (Option Alternative)

Si vous préférez vraiment utiliser GitHub Pages, vous devez:

1. **Compiler localement:**
   ```bash
   npm run build
   ```

2. **Pousser le dossier `dist/` sur une branche `gh-pages`:**
   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

3. **Configurer GitHub Pages** pour utiliser la branche `gh-pages`

**MAIS:** Cette méthode est plus compliquée et moins pratique. Cloudflare Pages est beaucoup mieux pour les apps React! ✅

---

## 📝 Checklist Rapide

- [ ] Cloudflare Pages créé
- [ ] Repo GitHub connecté (`hadfi53/rakb`)
- [ ] Build configuré (Vite, npm run build, dist)
- [ ] Variables d'environnement ajoutées
- [ ] Premier déploiement réussi
- [ ] Domaine `rakb.ma` ajouté
- [ ] DNS mis à jour (CNAME)
- [ ] SSL actif
- [ ] Site accessible sur https://rakb.ma

---

## 🆘 Si ça ne marche toujours pas

1. **Vérifiez les logs de build:**
   - Cloudflare Dashboard → Votre projet → **Deployments**
   - Cliquez sur le déploiement
   - Regardez les **Build logs** pour voir les erreurs

2. **Vérifiez les variables d'environnement:**
   - Toutes les variables doivent être ajoutées
   - Utilisées pour: Production, Preview, Browser Preview

3. **Vérifiez le DNS:**
   - Le record CNAME doit pointer vers `[projet].pages.dev`
   - Proxy doit être activé (nuage orange)

4. **Videz le cache:**
   - Cloudflare Dashboard → Votre domaine → **Caching** → **Purge Everything**

---

**Besoin d'aide?** Dites-moi à quelle étape vous êtes bloqué!

