import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CrowdReport } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

// Mock data for popular sites
const siteData = [
  { name: 'Amber Fort', avgCrowd: 850, peakTime: '11 AM - 2 PM', status: 'moderate' },
  { name: 'Hawa Mahal', avgCrowd: 620, peakTime: '10 AM - 12 PM', status: 'low' },
  { name: 'City Palace Jaipur', avgCrowd: 540, peakTime: '3 PM - 5 PM', status: 'low' },
  { name: 'Lake Palace Udaipur', avgCrowd: 380, peakTime: '4 PM - 6 PM', status: 'low' },
  { name: 'Mehrangarh Fort', avgCrowd: 920, peakTime: '10 AM - 1 PM', status: 'high' },
];

const hourlyData = [
  { hour: '6 AM', amber: 50, hawa: 30, city: 20 },
  { hour: '8 AM', amber: 200, hawa: 150, city: 100 },
  { hour: '10 AM', amber: 650, hawa: 450, city: 320 },
  { hour: '12 PM', amber: 850, hawa: 620, city: 480 },
  { hour: '2 PM', amber: 780, hawa: 580, city: 520 },
  { hour: '4 PM', amber: 600, hawa: 420, city: 540 },
  { hour: '6 PM', amber: 350, hawa: 280, city: 380 },
  { hour: '8 PM', amber: 100, hawa: 80, city: 120 },
];

const weeklyTrend = [
  { day: 'Mon', visitors: 42000 },
  { day: 'Tue', visitors: 38000 },
  { day: 'Wed', visitors: 45000 },
  { day: 'Thu', visitors: 48000 },
  { day: 'Fri', visitors: 55000 },
  { day: 'Sat', visitors: 78000 },
  { day: 'Sun', visitors: 85000 },
];

export default function CrowdAnalytics() {
  const [reports, setReports] = useState<CrowdReport[]>([]);
  const [selectedSite, setSelectedSite] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    const { data } = await supabase
      .from('crowd_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setReports(data as CrowdReport[]);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'bg-danger text-danger-foreground';
      case 'moderate':
        return 'bg-caution text-caution-foreground';
      default:
        return 'bg-safe text-safe-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Crowd Analytics</h2>
            <p className="text-muted-foreground">Monitor and analyze visitor patterns</p>
          </div>
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="amber">Amber Fort</SelectItem>
              <SelectItem value="hawa">Hawa Mahal</SelectItem>
              <SelectItem value="city">City Palace</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Weekly Trend */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Weekly Visitor Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(value) => `${value / 1000}K`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${(value / 1000).toFixed(1)}K`, 'Visitors']}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Comparison */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Hourly Crowd Comparison - Top Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amber"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Amber Fort"
                  />
                  <Line
                    type="monotone"
                    dataKey="hawa"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Hawa Mahal"
                  />
                  <Line
                    type="monotone"
                    dataKey="city"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="City Palace"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Site Statistics */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Site-wise Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Site Name</th>
                    <th className="text-left py-3 px-4 font-medium">Avg. Crowd</th>
                    <th className="text-left py-3 px-4 font-medium">Peak Time</th>
                    <th className="text-left py-3 px-4 font-medium">Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {siteData.map((site) => (
                    <tr key={site.name} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{site.name}</td>
                      <td className="py-3 px-4">{site.avgCrowd}</td>
                      <td className="py-3 px-4 text-muted-foreground">{site.peakTime}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(site.status)}>
                          {site.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Crowd Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {reports.slice(0, 10).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {report.location_name || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{report.person_count} people</p>
                    <Badge
                      className={
                        report.density_level === 'high'
                          ? 'bg-danger text-danger-foreground'
                          : report.density_level === 'medium'
                          ? 'bg-caution text-caution-foreground'
                          : 'bg-safe text-safe-foreground'
                      }
                    >
                      {report.density_level}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
