
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UsageData {
  mois: string;
  locations: number;
}

interface UsageChartProps {
  data: UsageData[];
}

export const UsageChart = ({ data }: UsageChartProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Statistiques d'utilisation</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="locations" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
