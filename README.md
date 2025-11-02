# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c0bc50f8-3661-4b54-b6c5-54d5cbb53e2a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c0bc50f8-3661-4b54-b6c5-54d5cbb53e2a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c0bc50f8-3661-4b54-b6c5-54d5cbb53e2a) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# Rakeb - Plateforme de Location de Véhicules

## Déploiement sur Vercel

### Prérequis
- Un compte [Vercel](https://vercel.com)
- Un compte [GitHub](https://github.com) (recommandé pour l'intégration continue)
- Node.js v20.9.0 ou supérieur

### Étapes de déploiement

1. **Préparer le projet pour le déploiement**
   - Assurez-vous que le fichier `vercel.json` est présent à la racine du projet
   - Vérifiez que les variables d'environnement sont correctement configurées

2. **Déployer via l'interface Vercel**
   - Connectez-vous à votre compte Vercel
   - Cliquez sur "New Project"
   - Importez votre dépôt GitHub ou téléchargez directement les fichiers du projet
   - Configurez les variables d'environnement suivantes dans l'interface Vercel :
     - `VITE_SUPABASE_URL` : URL de votre projet Supabase
     - `VITE_SUPABASE_ANON_KEY` : Clé anonyme de votre projet Supabase
     - `REACT_APP_MAPBOX_TOKEN` : Votre token Mapbox

3. **Déployer via la CLI Vercel**
   - Installez la CLI Vercel : `npm i -g vercel`
   - Exécutez `vercel login` et suivez les instructions
   - À la racine du projet, exécutez `vercel` pour un déploiement de prévisualisation
   - Pour un déploiement en production, exécutez `vercel --prod`

### Configuration des variables d'environnement

Les variables d'environnement suivantes sont nécessaires au bon fonctionnement de l'application :

```
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme_supabase
REACT_APP_MAPBOX_TOKEN=votre_token_mapbox
```

### Résolution des problèmes courants

- **Erreur 404 sur les routes** : Vérifiez que le fichier `vercel.json` est correctement configuré avec les redirections SPA.
- **Problèmes de build** : Assurez-vous d'utiliser une version de Node.js compatible (v20.9.0+).
- **Variables d'environnement manquantes** : Vérifiez que toutes les variables d'environnement sont configurées dans l'interface Vercel.

### Maintenance

Pour mettre à jour l'application déployée :
- Si vous utilisez GitHub, chaque push sur la branche principale déclenchera automatiquement un nouveau déploiement.
- Si vous utilisez la CLI, exécutez à nouveau `vercel --prod` après vos modifications.
