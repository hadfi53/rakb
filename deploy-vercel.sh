#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Préparation du déploiement sur Vercel...${NC}"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null
then
    echo -e "${YELLOW}Installation de Vercel CLI...${NC}"
    npm install -g vercel
fi

# Vérifier si l'utilisateur est connecté à Vercel
echo -e "${YELLOW}Vérification de la connexion à Vercel...${NC}"
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Connexion à Vercel requise...${NC}"
    vercel login
fi

# Nettoyer le build précédent
echo -e "${YELLOW}Nettoyage des builds précédents...${NC}"
rm -rf dist
rm -rf node_modules/.vite

# Installer les dépendances
echo -e "${YELLOW}Installation des dépendances...${NC}"
npm install

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo -e "${RED}Erreur: Fichier .env manquant${NC}"
    echo -e "${YELLOW}Création d'un fichier .env à partir de .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Veuillez éditer le fichier .env avec vos propres valeurs avant de continuer.${NC}"
    exit 1
fi

# Vérifier si vercel.json existe
if [ ! -f vercel.json ]; then
    echo -e "${RED}Erreur: Fichier vercel.json manquant${NC}"
    exit 1
fi

# Demander si c'est un déploiement de production
echo -e "${YELLOW}Voulez-vous déployer en production? (y/n)${NC}"
read -r deploy_prod

# Déployer sur Vercel
echo -e "${YELLOW}Déploiement sur Vercel...${NC}"
if [ "$deploy_prod" = "y" ] || [ "$deploy_prod" = "Y" ]; then
    vercel --prod
else
    vercel
fi

echo -e "${GREEN}Déploiement terminé!${NC}" 