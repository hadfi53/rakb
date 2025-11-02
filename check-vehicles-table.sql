-- Script pour vérifier quelle table de véhicules existe dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%vehicle%' OR table_name LIKE '%car%')
ORDER BY table_name;
