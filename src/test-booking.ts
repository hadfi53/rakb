import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kaegngmkmeuenndcqdsx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWduZ21rbWV1ZW5uZGNxZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTc1MjUsImV4cCI6MjA1MzU5MzUyNX0.z7Rpj4RsAdPwitQG8NyaAdflYdedWhdKM87HgVatKLI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestBooking() {
  try {
    // Se connecter en tant que locataire
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'hhadfi53@gmail.com',
      password: 'Bmx4ever'
    });

    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return;
    }

    console.log('Authentifié en tant que:', authData.user);

    // Créer une réservation de test
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        vehicle_id: '390b3ac6-db87-42ec-80f6-ab8fcbb81c73', // Mercedes C
        renter_id: authData.user.id, // Utiliser l'ID de l'utilisateur authentifié
        owner_id: 'ea3e8eda-dae4-44cb-b9ac-8a7394e6738b',
        start_date: '2024-05-15T10:00:00Z',
        end_date: '2024-05-17T10:00:00Z',
        status: 'pending',
        total_price: 1800,
        pickup_location: 'Rabat',
        return_location: 'Rabat'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      return;
    }

    console.log('Réservation créée avec succès:', data);
  } catch (err) {
    console.error('Erreur:', err);
  }
}

// Exécuter le test
createTestBooking(); 