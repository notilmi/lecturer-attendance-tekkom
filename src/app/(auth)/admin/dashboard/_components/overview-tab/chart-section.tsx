import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { UseDashboardPage } from "../../use-dashboard-page";

interface ChartSectionProps {
    weeklyData: any[]
    todayFormatted: string,
    pieChartData: {
        name: string,
        value: number
    }[]
}

export function ChartSection({ weeklyData, todayFormatted, pieChartData }: ChartSectionProps) {

    const { COLORS } = UseDashboardPage();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Kehadiran Mingguan</CardTitle>
            <CardDescription>
              Data 7 hari terakhir
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={weeklyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                {/* <XAxis dataKey="day" tick={{ angle: -45 }} textAnchor="end" height={50} />
                <YAxis /> */}
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#4ade80" name="Hadir" />
                <Bar dataKey="absent" fill="#f87171" name="Tidak Hadir" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status Kehadiran Hari Ini</CardTitle>
            <CardDescription>
              {todayFormatted}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
}