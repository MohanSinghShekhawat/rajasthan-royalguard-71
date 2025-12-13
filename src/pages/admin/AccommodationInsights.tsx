import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const occupancyData = [
  { district: 'Jaipur', occupancy: 87, rooms: 15000, avgPrice: 4500, trend: 'up' },
  { district: 'Udaipur', occupancy: 92, rooms: 8000, avgPrice: 6200, trend: 'up' },
  { district: 'Jodhpur', occupancy: 78, rooms: 6500, avgPrice: 3800, trend: 'down' },
  { district: 'Jaisalmer', occupancy: 95, rooms: 4200, avgPrice: 5500, trend: 'up' },
  { district: 'Pushkar', occupancy: 68, rooms: 3500, avgPrice: 2800, trend: 'stable' },
  { district: 'Mount Abu', occupancy: 72, rooms: 2800, avgPrice: 3200, trend: 'up' },
];

const priceData = occupancyData.map(d => ({
  district: d.district,
  price: d.avgPrice,
}));

const getOccupancyColor = (occupancy: number) => {
  if (occupancy >= 90) return 'hsl(var(--danger))';
  if (occupancy >= 75) return 'hsl(var(--caution))';
  return 'hsl(var(--safe))';
};

export default function AccommodationInsights() {
  const totalRooms = occupancyData.reduce((sum, d) => sum + d.rooms, 0);
  const avgOccupancy = Math.round(
    occupancyData.reduce((sum, d) => sum + d.occupancy, 0) / occupancyData.length
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in">
        <div>
          <h2 className="text-2xl font-bold">Accommodation Insights</h2>
          <p className="text-muted-foreground">Hotel and lodging analytics across Rajasthan</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Room Inventory</p>
                  <p className="text-3xl font-bold">{(totalRooms / 1000).toFixed(1)}K</p>
                </div>
                <Building2 className="w-10 h-10 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Occupancy</p>
                  <p className="text-3xl font-bold">{avgOccupancy}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-safe opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Capacity Alerts</p>
                  <p className="text-3xl font-bold">
                    {occupancyData.filter(d => d.occupancy >= 90).length}
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-danger opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Occupancy by District */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>District-wise Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {occupancyData.map((district) => (
                <div key={district.district} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-24">{district.district}</span>
                      <Badge
                        className={
                          district.occupancy >= 90
                            ? 'bg-danger text-danger-foreground'
                            : district.occupancy >= 75
                            ? 'bg-caution text-caution-foreground'
                            : 'bg-safe text-safe-foreground'
                        }
                      >
                        {district.occupancy}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{district.rooms.toLocaleString()} rooms</span>
                      <span className="flex items-center gap-1">
                        {district.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-safe" />
                        ) : district.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-danger" />
                        ) : (
                          <span className="w-4 h-4">—</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={district.occupancy}
                    className="h-2"
                    style={{
                      // @ts-ignore
                      '--progress-foreground': getOccupancyColor(district.occupancy),
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Comparison */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Average Room Prices by District (₹/night)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                  <YAxis type="category" dataKey="district" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Avg Price']}
                  />
                  <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                    {priceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">District</th>
                    <th className="text-right py-3 px-4 font-medium">Total Rooms</th>
                    <th className="text-right py-3 px-4 font-medium">Occupancy</th>
                    <th className="text-right py-3 px-4 font-medium">Avg. Price</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {occupancyData.map((district) => (
                    <tr key={district.district} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{district.district}</td>
                      <td className="py-3 px-4 text-right">
                        {district.rooms.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">{district.occupancy}%</td>
                      <td className="py-3 px-4 text-right">
                        ₹{district.avgPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {district.occupancy >= 90 ? (
                          <Badge className="bg-danger text-danger-foreground">
                            Near Capacity
                          </Badge>
                        ) : district.occupancy >= 75 ? (
                          <Badge className="bg-caution text-caution-foreground">
                            Filling Up
                          </Badge>
                        ) : (
                          <Badge className="bg-safe text-safe-foreground">
                            Available
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
