import { useEffect } from 'react'
import { useRentals } from '@/hooks/use-rentals'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface RentalListProps {
  className?: string
}

export function RentalList({ className }: RentalListProps) {
  const { rentals, loading, fetchRentals, completeRental } = useRentals()

  useEffect(() => {
    fetchRentals()
  }, [fetchRentals])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!rentals.length) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-center">No rentals found</p>
          <p className="text-sm text-muted-foreground text-center mt-1">
            When you rent a car, it will appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {rentals.map((rental) => (
        <Card key={rental.id}>
          <CardHeader>
            <CardTitle>{rental.vehicle_name}</CardTitle>
            <CardDescription>
              {format(new Date(rental.start_date), 'PPP')} - {format(new Date(rental.end_date), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Owner: {rental.owner_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Renter: {rental.renter_name}
                </p>
                <p className="font-medium mt-2">
                  {formatCurrency(rental.total_price)}
                </p>
              </div>
              {rental.status === 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => completeRental(rental.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
              <div className="flex items-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  rental.status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : rental.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : rental.status === 'confirmed'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {rental.status.replace('_', ' ').charAt(0).toUpperCase() + rental.status.slice(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 