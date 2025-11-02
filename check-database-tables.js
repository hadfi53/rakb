/**
 * Script de diagnostic pour vérifier les tables dans Supabase
 * Exécutez: node check-database-tables.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kcujctyosmjlofppntfb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Vérification des tables dans Supabase...\n');
  console.log(`URL: ${supabaseUrl}\n`);

  const tablesToCheck = [
    'vehicles',
    'cars',
    'profiles',
    'bookings',
    'favorites',
    'notifications',
    'reviews',
    'documents'
  ];

  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${tableName}: Table n'existe pas`);
        } else if (error.code === 'PGRST301') {
          console.log(`⚠️  ${tableName}: Table existe mais RLS bloque l'accès`);
        } else {
          console.log(`⚠️  ${tableName}: Erreur (${error.code}): ${error.message}`);
        }
      } else {
        // Try to count rows
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        const rowCount = countError ? '?' : (count || 0);
        console.log(`✅ ${tableName}: Table existe (${rowCount} ligne(s))`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Erreur inattendue:`, err.message);
    }
  }

  console.log('\n📋 Vérification des fonctions RPC...\n');

  const rpcFunctions = [
    'search_vehicles',
    'get_available_vehicles',
    'search_available_cars'
  ];

  for (const funcName of rpcFunctions) {
    try {
      // Try calling with minimal params
      const { data, error } = await supabase.rpc(funcName, {});
      
      if (error) {
        if (error.code === 'PGRST202') {
          console.log(`❌ ${funcName}: Fonction n'existe pas`);
        } else {
          console.log(`⚠️  ${funcName}: Erreur (${error.code}): ${error.message}`);
        }
      } else {
        console.log(`✅ ${funcName}: Fonction existe`);
      }
    } catch (err) {
      console.log(`❌ ${funcName}: Erreur:`, err.message);
    }
  }

  console.log('\n✨ Diagnostic terminé!');
}

checkTables().catch(console.error);
