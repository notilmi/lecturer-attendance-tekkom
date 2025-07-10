import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LecturesArrivalGraphicProps {
  arrivalDistribution: {
    time: string,
    count: number,
  }[]
}

export function LecturesArrivalGraphic({ arrivalDistribution }: LecturesArrivalGraphicProps) {


  return (
    <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Distribusi Waktu Kedatangan</CardTitle>
            <CardDescription>
              Jumlah dosen berdasarkan rentang waktu kedatangan hari ini
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={arrivalDistribution}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={50} />
              <YAxis />
              <Tooltip />
              <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Jumlah Dosen" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
  );
}
