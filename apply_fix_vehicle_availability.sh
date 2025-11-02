#!/bin/bash

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Application de la correction de disponibilité des véhicules...${NC}"

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${RED}L'outil 'jq' n'est pas installé, il est nécessaire pour traiter le JSON.${NC}"
    echo -e "${YELLOW}Veuillez l'installer:${NC}"
    echo -e "macOS: brew install jq"
    echo -e "Ubuntu/Debian: sudo apt-get install jq"
    echo -e "${YELLOW}Ou utilisez l'option d'application manuelle ci-dessous.${NC}"
    
    echo -e "${YELLOW}Voulez-vous continuer avec l'application manuelle? (y/n):${NC}"
    read -r continue_manual
    
    if [ "$continue_manual" != "y" ] && [ "$continue_manual" != "Y" ]; then
        exit 1
    fi
    
    # Afficher les instructions pour l'application manuelle
    echo -e "${YELLOW}Veuillez appliquer la migration manuellement via l'interface SQL de Supabase:${NC}"
    echo -e "${YELLOW}1. Connectez-vous à votre compte Supabase (https://app.supabase.io)${NC}"
    echo -e "${YELLOW}2. Sélectionnez votre projet${NC}"
    echo -e "${YELLOW}3. Allez dans l'onglet 'SQL Editor' (Éditeur SQL)${NC}"
    echo -e "${YELLOW}4. Créez une nouvelle requête${NC}"
    echo -e "${YELLOW}5. Copiez et collez le contenu du fichier supabase/migrations/fix_vehicle_availability.sql${NC}"
    echo -e "${YELLOW}6. Exécutez la requête${NC}"
    exit 0
fi

# Vérifier si le fichier de migration existe
if [ ! -f "supabase/migrations/fix_vehicle_availability.sql" ]; then
    echo -e "${RED}Erreur: Le fichier de migration n'existe pas à l'emplacement attendu.${NC}"
    echo -e "${YELLOW}Assurez-vous que le fichier 'supabase/migrations/fix_vehicle_availability.sql' existe.${NC}"
    exit 1
fi

# Demander la méthode d'application
echo -e "${YELLOW}Comment souhaitez-vous appliquer la migration?${NC}"
echo -e "1) Via l'API REST Supabase (nécessite URL et clé API)"
echo -e "2) Application manuelle via l'interface SQL de Supabase"
read -p "Votre choix (1/2): " application_method

if [ "$application_method" = "1" ]; then
    # Méthode API REST
    
    # Demander les informations de connexion à Supabase
    echo -e "${YELLOW}Entrez l'URL de votre projet Supabase (ex: https://xyz.supabase.co):${NC}"
    read -r supabase_url

    echo -e "${YELLOW}Entrez la clé d'API de service de votre projet Supabase:${NC}"
    read -rs supabase_key
    echo

    # Vérifier les informations de base
    if [ -z "$supabase_url" ] || [ -z "$supabase_key" ]; then
        echo -e "${RED}L'URL ou la clé d'API ne peut pas être vide.${NC}"
        exit 1
    fi

    # Appliquer la migration via l'API REST
    echo -e "${YELLOW}Application de la migration...${NC}"

    # Lire le contenu du fichier SQL
    sql_content=$(cat supabase/migrations/fix_vehicle_availability.sql)

    # Encodage du contenu SQL pour curl
    encoded_sql=$(echo "$sql_content" | jq -s -R .)

    # Exécuter la requête via l'API REST
    response=$(curl -X POST \
      "${supabase_url}/rest/v1/rpc/pg_query" \
      -H "apikey: ${supabase_key}" \
      -H "Authorization: Bearer ${supabase_key}" \
      -H "Content-Type: application/json" \
      -d "{\"query\": $encoded_sql}" \
      --fail \
      --silent \
      --show-error)

    curl_exit_code=$?
    
    if [ $curl_exit_code -eq 0 ]; then
        echo -e "${GREEN}Migration appliquée avec succès!${NC}"
    else
        echo -e "${RED}Erreur lors de l'application de la migration via l'API REST.${NC}"
        echo -e "${RED}Erreur: $response${NC}"
        
        # Proposer l'application manuelle comme alternative
        echo
        echo -e "${YELLOW}Alternative: Veuillez appliquer la migration manuellement via l'interface SQL de Supabase:${NC}"
        echo -e "${YELLOW}1. Connectez-vous à votre compte Supabase (https://app.supabase.io)${NC}"
        echo -e "${YELLOW}2. Sélectionnez votre projet${NC}"
        echo -e "${YELLOW}3. Allez dans l'onglet 'SQL Editor' (Éditeur SQL)${NC}"
        echo -e "${YELLOW}4. Créez une nouvelle requête${NC}"
        echo -e "${YELLOW}5. Copiez et collez le contenu du fichier supabase/migrations/fix_vehicle_availability.sql${NC}"
        echo -e "${YELLOW}6. Exécutez la requête${NC}"
        exit 1
    fi
else
    # Application manuelle
    echo -e "${YELLOW}Veuillez appliquer la migration manuellement via l'interface SQL de Supabase:${NC}"
    echo -e "${YELLOW}1. Connectez-vous à votre compte Supabase (https://app.supabase.io)${NC}"
    echo -e "${YELLOW}2. Sélectionnez votre projet${NC}"
    echo -e "${YELLOW}3. Allez dans l'onglet 'SQL Editor' (Éditeur SQL)${NC}"
    echo -e "${YELLOW}4. Créez une nouvelle requête${NC}"
    
    # Afficher le contenu du fichier SQL
    echo -e "${YELLOW}5. Copiez et collez le contenu suivant:${NC}"
    echo
    echo -e "${GREEN}-------------------------DÉBUT DU SQL-------------------------${NC}"
    cat supabase/migrations/fix_vehicle_availability.sql
    echo -e "${GREEN}-------------------------FIN DU SQL-------------------------${NC}"
    echo
    echo -e "${YELLOW}6. Exécutez la requête${NC}"
fi

echo -e "${GREEN}Processus terminé!${NC}" 