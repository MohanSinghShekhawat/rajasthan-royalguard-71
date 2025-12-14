import { useState, useEffect } from 'react';
import { Users, TrendingUp, MapPin, Calendar, BarChart3 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CrowdReport, DensityLevel } from '@/types';
import { getZoneInfo } from '@/utils/roboflowService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend 
} from 'recharts';

interface LocationStats {
  location: string;
  avgCrowd: number;
  reports: number;
  lastDensity: DensityLevel;
}

export default function CrowdAnalytics() {
  const [crowdReports, setCrowdReports] = useState<CrowdReport[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [locationStats, setLocationStats] = useState<LocationStats[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; low: number; medium: number; high: number }[]>([]);

  useEffect(() => {
    fetchCrowdData();
  }, [timeRange]);

  async function fetchCrowdData() {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const { data } = await supabase
      .from('crowd_reports')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setCrowdReports(data as CrowdReport[]);
      processData(data as CrowdReport[]);
    }
  }

  function processData(reports: CrowdReport[]) {
    // Location statistics
    const locMap = new Map<string, { total: number; count: number; lastDensity: DensityLevel }>();
    reports.forEach(report => {
      const loc = report.location_name || 'Unknown';
      const existing = locMap.get(loc) || { total: 0, count: 0, lastDensity: 'low' as DensityLevel };
      locMap.set(loc, {
        total: existing.total + report.person_count,
        count: existing.count + 1,
        lastDensity: report.density_level,
      });
    });

    const stats: LocationStats[] = Array.from(locMap.entries()).map(([location, data]) => ({
      location,
      avgCrowd: Math.round(data.total / data.count),
      reports: data.count,
      lastDensity: data.lastDensity,
    })).sort((a, b) => b.avgCrowd - a.avgCrowd);

    setLocationStats(stats);

    // Hourly distribution
    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hourMap.set(i, 0);
    
    reports.forEach(report => {
      const hour = new Date(report.created_at).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + report.person_count);
    });

    setHourlyData(
      Array.from(hourMap.entries()).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
      }))
    );

    // Daily zone distribution
    const dayMap = new Map<string, { low: number; medium: number; high: number }>();
    reports.forEach(report => {
      const date = new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dayMap.get(date) || { low: 0, medium: 0, high: 0 };
      existing[report.density_level]++;
      dayMap.set(date, existing);
    });

    setDailyData(
      Array.from(dayMap.entries()).map(([date, counts]) => ({
        date,
        ...counts,
      })).reverse()
    );
  }

  const totalReports = crowdReports.length;
  const avgCrowd = totalReports > 0 
    ? Math.round(crowdReports.reduce((sum, r) => sum + r.person_count, 0) / totalReports) 
    : 0;
  const highDensityCount = crowdReports.filter(r => r.density_level === 'high').length;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Crowd Analytics</h1>
            <p className="text-muted-foreground">Historical crowd density analysis</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalReports}</p>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-safe/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-safe" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgCrowd}</p>
                  <p className="text-sm text-muted-foreground">Avg People/Report</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{highDensityCount}</p>
                  <p className="text-sm text-muted-foreground">Red Zone Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-caution/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-caution" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{locationStats.length}</p>
                  <p className="text-sm text-muted-foreground">Active Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Hourly Crowd Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Zone Distribution Over Time */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Zone Distribution Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="low" name="Green Zone" fill="#22C55E" stackId="stack" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="medium" name="Yellow Zone" fill="#F59E0B" stackId="stack" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" name="Red Zone" fill="#EF4444" stackId="stack" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Location Statistics Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location-wise Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Location</th>
                    <th className="text-center py-3 px-4 font-medium">Reports</th>
                    <th className="text-center py-3 px-4 font-medium">Avg Crowd</th>
                    <th className="text-center py-3 px-4 font-medium">Current Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {locationStats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">
                        No data available for the selected time range
                      </td>
                    </tr>
                  ) : (
                    locationStats.map((stat, index) => {
                      const zoneInfo = getZoneInfo(stat.lastDensity);
                      return (
                        <tr key={index} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">{stat.location}</td>
                          <td className="py-3 px-4 text-center">{stat.reports}</td>
                          <td className="py-3 px-4 text-center">{stat.avgCrowd}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={zoneInfo.color} variant="outline">
                              {zoneInfo.name}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {crowdReports.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No crowd reports found
                </p>
              ) : (
                crowdReports.slice(0, 20).map((report) => {
                  const zoneInfo = getZoneInfo(report.density_level);
                  return (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg ${zoneInfo.bgColor} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full ${
                          report.density_level === 'low' ? 'bg-safe' :
                          report.density_level === 'medium' ? 'bg-caution' : 'bg-danger'
                        }`} />
                        <div>
                          <p className="font-medium">{report.location_name || 'Unknown Location'}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.person_count} people detected
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={zoneInfo.color} variant="outline">
                          {zoneInfo.name}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
