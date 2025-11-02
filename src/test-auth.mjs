import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kaegngmkmeuenndcqdsx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWduZ21rbWV1ZW5uZGNxZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMTc1MjUsImV4cCI6MjA1MzU5MzUyNX0.z7Rpj4RsAdPwitQG8NyaAdflYdedWhdKM87HgVatKLI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  try {
    console.log('Tentative de connexion...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'hhadfi53@gmail.com',
      password: 'Bmx4ever'
    })

    if (error) {
      console.error('Erreur de connexion:', error)
      return
    }

    console.log('Connexion réussie:', data)

    // Tester la récupération des véhicules
    console.log('Récupération des véhicules...')
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')

    if (vehiclesError) {
      console.error('Erreur lors de la récupération des véhicules:', vehiclesError)
      return
    }

    console.log('Véhicules trouvés:', vehicles)
  } catch (error) {
    console.error('Erreur:', error)
  }
}

testAuth() 