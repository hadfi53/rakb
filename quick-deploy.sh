#!/bin/bash

# Script de déploiement rapide sans réinstallation des dépendances

echo "🚀 Démarrage du déploiement rapide..."

# Arrêter le serveur de développement s'il est en cours d'exécution
echo "🛑 Arrêt des processus en cours..."
pkill -f "npm run dev" || true
pkill -f "node" || true

# Nettoyer le cache
echo "🧹 Nettoyage du cache..."
rm -rf node_modules/.cache
rm -rf dist

# Reconstruire l'application
echo "🔨 Reconstruction de l'application..."
npm run build

# Démarrer l'application
echo "✅ Démarrage de l'application..."
npm run dev

echo "🎉 Déploiement rapide terminé !" 