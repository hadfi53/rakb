#!/bin/bash

# Afficher un message d'information
echo "Mise à jour de la base de données Supabase..."

# Exécuter le script SQL pour corriger les politiques
echo "Exécution du script SQL pour corriger les politiques..."
npx supabase db push --db-url postgresql://postgres:postgres@localhost:54322/postgres

# Redémarrer le serveur Supabase
echo "Redémarrage du serveur Supabase..."
npx supabase stop
npx supabase start

echo "Mise à jour terminée. Vous pouvez maintenant accéder aux détails des véhicules." 