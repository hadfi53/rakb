import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
const supabaseUrl = 'https://kaegngmkmeuenndcqdsx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWduZ21rbWV1ZW5uZGNxZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTc1MjUsImV4cCI6MjA1MzU5MzUyNX0.z7Rpj4RsAdPwitQG8NyaAdflYdedWhdKM87HgVatKLI';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestVehicle() {
  try {
    // Se connecter en tant que propriétaire
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hhadfi53@gmail.com',
      password: 'Bmx4ever'
    });

    if (authError) throw authError;

    console.log('Authentifié en tant que:', user);

    // Mettre à jour le rôle en propriétaire
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'owner' })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Créer un véhicule de test
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert([
        {
          owner_id: user.id,
          make: 'Mercedes',
          model: 'C',
          year: 2024,
          price_per_day: 600,
          location: 'Rabat',
          description: 'Voiture de test',
          status: 'available',
          fuel_type: 'essence',
          luggage: 4,
          mileage: 1000,
          color: 'black',
          transmission: 'automatic',
          seats: 5,
          features: ['GPS', 'Bluetooth', 'Climatisation'],
          category: 'Berline',
          is_premium: true
        }
      ])
      .select()
      .single();

    if (vehicleError) throw vehicleError;

    console.log('Véhicule créé avec succès:', vehicle);
  } catch (error) {
    console.error('Erreur lors de la création du véhicule:', error);
  }
}

createTestVehicle(); 