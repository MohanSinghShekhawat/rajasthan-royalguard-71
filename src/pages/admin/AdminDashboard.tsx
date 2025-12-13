import { useState, useEffect } from 'react';
import { Users, Globe, AlertTriangle, MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafetyMap } from '@/components/map/SafetyMap';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { SOSAlert, CrowdReport } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(210, 50%, 35%)', 'hsl(35, 45%, 65%)', 'hsl(15, 65%, 55%)', 'hsl(145, 55%, 42%)'];

// Mock data for demonstration
const peakTimeData = [
  { time: '6 AM', visitors: 120 },
  { time: '8 AM', visitors: 450 },
  { time: '10 AM', visitors: 890 },
  { time: '12 PM', visitors: 1200 },
  { time: '2 PM', visitors: 980 },
  { time: '4 PM', visitors: 1100 },
  { time: '6 PM', visitors: 750 },
  { time: '8 PM', visitors: 320 },
];

const visitorDistribution = [
  { name: 'Jaipur', value: 45000 },
  { name: 'Udaipur', value: 28000 },
  { name: 'Jodhpur', value: 22000 },
  { name: 'Jaisalmer', value: 18000 },
];

export default function AdminDashboard() {
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [crowdReports, setCrowdReports] = useState<CrowdReport[]>([]);
  const [stats, setStats] = useState({
    totalFootfall: 120000,
    domesticVisitors: 102000,
    internationalVisitors: 18000,
    activeAlerts: 0,
    highDensityZones: 0,
  });

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime SOS alerts
    const sosChannel = supabase
      .channel('sos-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          setSOSAlerts(prev => [payload.new as SOSAlert, ...prev]);
          setStats(prev => ({ ...prev, activeAlerts: prev.activeAlerts + 1 }));
        }
      )
      .subscribe();

    // Subscribe to crowd reports
    const crowdChannel = supabase
      .channel('crowd-reports-admin')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crowd_reports' },
        (payload) => {
          const report = payload.new as CrowdReport;
          setCrowdReports(prev => [report, ...prev]);
          if (report.density_level === 'high') {
            setStats(prev => ({ ...prev, highDensityZones: prev.highDensityZones + 1 }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sosChannel);
      supabase.removeChannel(crowdChannel);
    };
  }, []);

  async function fetchData() {
    // Fetch active SOS alerts
    const { data: alerts } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (alerts) {
      setSOSAlerts(alerts as SOSAlert[]);
      setStats(prev => ({ ...prev, activeAlerts: alerts.length }));
    }

    // Fetch recent crowd reports
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const { data: reports } = await supabase
      .from('crowd_reports')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    if (reports) {
      setCrowdReports(reports as CrowdReport[]);
      const highDensity = reports.filter(r => r.density_level === 'high').length;
      setStats(prev => ({ ...prev, highDensityZones: highDensity }));
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Footfall Today"
            value={formatNumber(stats.totalFootfall)}
            subtitle="Across all destinations"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="Domestic Visitors"
            value={formatNumber(stats.domesticVisitors)}
            subtitle="85% of total"
            icon={MapPin}
            trend={{ value: 8, isPositive: true }}
          />
          <MetricCard
            title="International Visitors"
            value={formatNumber(stats.internationalVisitors)}
            subtitle="15% of total"
            icon={Globe}
            trend={{ value: 5, isPositive: true }}
          />
          <MetricCard
            title="Active SOS Alerts"
            value={stats.activeAlerts.toString()}
            subtitle={stats.activeAlerts > 0 ? 'Requires attention' : 'All clear'}
            icon={AlertTriangle}
            variant={stats.activeAlerts > 0 ? 'accent' : 'default'}
          />
        </div>

        {/* Map and Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Crowd Heatmap */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Real-Time Crowd Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SafetyMap height="350px" showCrowdData={true} showSafetyZones={true} />
            </CardContent>
          </Card>

          {/* Live Alerts */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Live Alerts
                </span>
                {sosAlerts.length > 0 && (
                  <Badge className="bg-danger text-danger-foreground animate-pulse">
                    {sosAlerts.length} Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {sosAlerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No active alerts
                  </p>
                ) : (
                  sosAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-danger/10 border border-danger/20 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-danger">SOS Alert</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      {alert.latitude && alert.longitude && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  ))
                )}

                {/* Recent crowd reports */}
                {crowdReports.slice(0, 3).map((report) => (
                  <div
                    key={report.id}
                    className={`p-3 rounded-lg border ${
                      report.density_level === 'high' 
                        ? 'bg-caution/10 border-caution/20' 
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Crowd Report</span>
                      <Badge variant={report.density_level === 'high' ? 'destructive' : 'secondary'}>
                        {report.density_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.person_count} people detected
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Times Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Peak Visiting Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakTimeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="visitors" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Visitor Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Visitor Distribution by City</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visitorDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {visitorDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => formatNumber(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
