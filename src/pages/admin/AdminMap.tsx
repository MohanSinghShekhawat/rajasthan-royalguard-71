import { AdminLayout } from '@/components/admin/AdminLayout';
import { SafetyMap } from '@/components/map/SafetyMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, AlertTriangle } from 'lucide-react';

export default function AdminMap() {
  return (
    <AdminLayout>
      <div className="space-y-6 animate-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live Map View</h2>
            <p className="text-muted-foreground">Real-time crowd and safety monitoring</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              Live Data
            </Badge>
          </div>
        </div>

        {/* Full Screen Map */}
        <Card className="glass-card">
          <CardContent className="p-0">
            <SafetyMap 
              height="calc(100vh - 280px)" 
              showCrowdData={true} 
              showSafetyZones={true}
              className="rounded-lg overflow-hidden"
            />
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-safe" />
              <span className="text-sm">Safe Zones</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-caution" />
              <span className="text-sm">Caution Areas</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-danger" />
              <span className="text-sm">High Risk</span>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="py-3 flex items-center gap-3">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm">Crowd Reports</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
