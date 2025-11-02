import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, Star } from "lucide-react";
import { RentalHistoryItem } from "@/types/rental";

interface RentalHistoryProps {
  history: RentalHistoryItem[];
  onSortChange: (value: string) => void;
  onRate: (item: RentalHistoryItem, rating: number) => void;
}

export const RentalHistory = ({ history, onSortChange, onRate }: RentalHistoryProps) => {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Historique des locations</CardTitle>
        <Select onValueChange={onSortChange} defaultValue="date">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="price">Prix</SelectItem>
            <SelectItem value="rating">Note</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Véhicule</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Prix total</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.car}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.duration}</TableCell>
                <TableCell>{item.price} Dh</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="ml-1">{item.rating}/5</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Noter
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <DropdownMenuItem 
                          key={rating}
                          onClick={() => onRate(item, rating)}
                        >
                          <div className="flex items-center">
                            {Array.from({ length: rating }).map((_, i) => (
                              <Star 
                                key={i}
                                className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1"
                              />
                            ))}
                            <span className="ml-2">{rating} étoile{rating > 1 ? 's' : ''}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
