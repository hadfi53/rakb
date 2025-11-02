/**
 * Script de diagnostic pour vérifier pourquoi les véhicules ne s'affichent pas
 * Utilisez ce script dans la console du navigateur pour déboguer
 */

import { supabase } from './supabase';

export const debugVehicles = async (location?: string) => {
  console.group('🔍 Diagnostic des véhicules' + (location ? ` - Recherche: "${location}"` : ''));
  
  try {
    // 1. Vérifier la table vehicles
    console.log('1. Vérification de la table vehicles...');
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, make, model, status, publication_status, location')
      .limit(10);
    
    if (vehiclesError) {
      console.error('❌ Erreur vehicles:', vehiclesError);
    } else {
      console.log(`✅ ${vehiclesData?.length || 0} véhicules dans la table vehicles`);
      console.log('Exemples:', vehiclesData);
    }
    
    // 2. Vérifier avec le filtre status = 'available'
    console.log('\n2. Véhicules avec status = "available"...');
    const { data: availableData, error: availableError } = await supabase
      .from('vehicles')
      .select('id, make, model, status, publication_status')
      .eq('status', 'available')
      .limit(5);
    
    if (availableError) {
      console.error('❌ Erreur filtre available:', availableError);
    } else {
      console.log(`✅ ${availableData?.length || 0} véhicules avec status = "available"`);
      console.log('Exemples:', availableData);
    }
    
    // 3. Vérifier publication_status
    console.log('\n3. Vérification publication_status...');
    const { data: pubStatusData } = await supabase
      .from('vehicles')
      .select('publication_status')
      .eq('status', 'available');
    
    const statusCounts = pubStatusData?.reduce((acc: any, v: any) => {
      const status = v.publication_status || 'null';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    console.log('Répartition publication_status:', statusCounts);
    
    // 4. Test avec recherche par localisation
    if (location) {
      console.log(`\n4. Test recherche avec localisation: "${location}"...`);
      const { data: locationData, error: locationError } = await supabase
        .from('vehicles')
        .select('id, make, model, location, status')
        .eq('status', 'available')
        .ilike('location', `%${location}%`);
      
      if (locationError) {
        console.error('❌ Erreur recherche localisation:', locationError);
      } else {
        console.log(`✅ ${locationData?.length || 0} véhicules avec location contenant "${location}"`);
        if (locationData && locationData.length > 0) {
          console.log('Véhicules trouvés:', locationData.map((v: any) => ({
            make: v.make,
            model: v.model,
            location: v.location
          })));
        } else {
          console.warn('⚠️ Aucun véhicule trouvé. Vérifiez les localisations dans la base:');
          const { data: allLocations } = await supabase
            .from('vehicles')
            .select('location')
            .eq('status', 'available');
          const uniqueLocations = [...new Set(allLocations?.map((v: any) => v.location) || [])];
          console.log('Localisations disponibles:', uniqueLocations);
        }
      }
    }
    
    // 5. Vérifier RLS policies
    console.log('\n5. Test de requête avec filtre complet...');
    const { data: filteredData, error: filteredError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available')
      .limit(5);
    
    if (filteredError) {
      console.error('❌ Erreur filtre complet:', filteredError);
    } else {
      console.log(`✅ ${filteredData?.length || 0} véhicules disponibles (sans filtres)`);
    }
    
    // 6. Vérifier la table cars si elle existe
    console.log('\n6. Vérification table cars (alternative)...');
    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('id, make, model, is_available')
      .eq('is_available', true)
      .limit(5);
    
    if (carsError) {
      if (carsError.code === '42P01') {
        console.log('ℹ️ Table cars n\'existe pas (normal)');
      } else {
        console.error('❌ Erreur table cars:', carsError);
      }
    } else {
      console.log(`✅ ${carsData?.length || 0} véhicules dans la table cars`);
    }
    
    console.groupEnd();
    
    return {
      vehicles: vehiclesData,
      available: availableData,
      filtered: filteredData,
      cars: carsData
    };
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    console.groupEnd();
    return null;
  }
};

// Test de recherche complète comme dans l'app
export const testSearch = async (location: string, startDate?: string, endDate?: string) => {
  console.group(`🔍 Test Recherche: "${location}"${startDate ? ` (${startDate} - ${endDate})` : ''}`);
  
  try {
    // Test sans dates
    console.log('\n1. Test SANS dates...');
    const { data: noDates, error: noDatesError } = await supabase
      .from('vehicles')
      .select('id, make, model, location, status')
      .eq('status', 'available')
      .ilike('location', `%${location}%`);
    
    console.log(`✅ ${noDates?.length || 0} véhicules trouvés SANS filtres de dates`);
    
    // Test avec dates si fournies
    if (startDate && endDate) {
      console.log('\n2. Test AVEC dates...');
      // Vérifier les réservations qui chevauchent
      const { data: withDates, error: withDatesError } = await supabase
        .from('vehicles')
        .select(`
          id, make, model, location, status,
          bookings!inner(id, start_date, end_date, status)
        `)
        .eq('status', 'available')
        .ilike('location', `%${location}%`)
        .in('bookings.status', ['pending', 'confirmed', 'active']);
      
      // Meilleure approche: chercher les véhicules disponibles
      const { data: availableVehicles } = await supabase
        .from('vehicles')
        .select('id, make, model, location')
        .eq('status', 'available')
        .ilike('location', `%${location}%`);
      
      if (availableVehicles) {
        // Vérifier pour chaque véhicule s'il a des réservations qui chevauchent
        const available: any[] = [];
        for (const vehicle of availableVehicles) {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('start_date, end_date, status')
            .eq('car_id', vehicle.id)
            .in('status', ['pending', 'confirmed', 'active'])
            .lte('start_date', endDate)
            .gte('end_date', startDate);
          
          if (!bookings || bookings.length === 0) {
            available.push(vehicle);
          }
        }
        console.log(`✅ ${available.length} véhicules disponibles AVEC filtres de dates`);
        console.log('Véhicules disponibles:', available);
      }
    }
    
    console.groupEnd();
  } catch (error) {
    console.error('❌ Erreur test recherche:', error);
    console.groupEnd();
  }
};

// Exposer globalement
if (typeof window !== 'undefined') {
  (window as any).testSearch = testSearch;
}

// Exposer globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
  (window as any).debugVehicles = debugVehicles;
}

