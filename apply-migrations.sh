#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Application des migrations Supabase...${NC}"

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null
then
    echo -e "${YELLOW}Installation de Supabase CLI...${NC}"
    npm install -g supabase
fi

# Vérifier si l'utilisateur est connecté à Supabase
echo -e "${YELLOW}Vérification de la connexion à Supabase...${NC}"
supabase status &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Connexion à Supabase requise...${NC}"
    supabase login
fi

# Demander l'ID du projet Supabase
echo -e "${YELLOW}Entrez l'ID de votre projet Supabase:${NC}"
read -r project_id

# Appliquer les migrations
echo -e "${YELLOW}Application des migrations...${NC}"
supabase db push --project-id $project_id

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migrations appliquées avec succès!${NC}"
else
    echo -e "${RED}Erreur lors de l'application des migrations.${NC}"
    exit 1
fi

echo -e "${GREEN}Terminé!${NC}" 