import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RotateCw, XCircle } from "lucide-react";
import { BookingStatusLabels, BookingStatusColors } from "@/types/booking";

interface Reservation {
  id: number;
  car: string;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  location: string;
}

interface ReservationsTableProps {
  reservations: Reservation[];
  onRenewal?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
}

export const ReservationsTable = ({ reservations, onRenewal, onCancel }: ReservationsTableProps) => {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Réservations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Véhicule</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">{reservation.car}</TableCell>
                <TableCell>
                  {reservation.startDate} - {reservation.endDate}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    BookingStatusColors[reservation.status as keyof typeof BookingStatusColors] ||
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {BookingStatusLabels[reservation.status as keyof typeof BookingStatusLabels] || 
                    reservation.status}
                  </span>
                </TableCell>
                <TableCell>{reservation.price} Dh</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {reservation.status === "completed" && onRenewal && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onRenewal(reservation)}
                      >
                        <RotateCw className="h-4 w-4 mr-2" />
                        Renouveler
                      </Button>
                    )}
                    {(reservation.status === "pending" || reservation.status === "confirmed") && onCancel && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onCancel(reservation)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
