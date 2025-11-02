import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface RentalDetails {
  id: string
  vehicle_name: string
  start_date: string
  end_date: string
  total_price: number
  owner_id: string
  renter_id: string
  owner_name: string
  renter_name: string
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}

export function useRentals() {
  const [rentals, setRentals] = useState<RentalDetails[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRentals = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_rental_details')
      
      if (error) {
        throw error
      }

      setRentals(data)
    } catch (error) {
      console.error('Error fetching rentals:', error)
      toast.error('Failed to load rentals')
    } finally {
      setLoading(false)
    }
  }, [])

  const completeRental = useCallback(async (rentalId: string) => {
    try {
      const { error } = await supabase
        .from('rentals')
        .update({ status: 'completed' })
        .eq('id', rentalId)

      if (error) {
        throw error
      }

      // Update local state
      setRentals(prev => 
        prev.map(rental => 
          rental.id === rentalId 
            ? { ...rental, status: 'completed' } 
            : rental
        )
      )

      toast.success('Rental marked as completed')
    } catch (error) {
      console.error('Error completing rental:', error)
      toast.error('Failed to complete rental')
    }
  }, [])

  return {
    rentals,
    loading,
    fetchRentals,
    completeRental
  }
} 