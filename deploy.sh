#!/bin/bash

# Script de déploiement pour appliquer tous les changements

echo "🚀 Démarrage du déploiement..."

# Arrêter le serveur de développement s'il est en cours d'exécution
echo "🛑 Arrêt des processus en cours..."
pkill -f "npm run dev" || true
pkill -f "node" || true

# Nettoyer le cache
echo "🧹 Nettoyage du cache..."
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist

# Réinstaller les dépendances
echo "📦 Réinstallation des dépendances..."
npm install

# Reconstruire l'application
echo "🔨 Reconstruction de l'application..."
npm run build

# Démarrer l'application
echo "✅ Démarrage de l'application..."
npm run dev

echo "🎉 Déploiement terminé !"
