import { TouristLayout } from '@/components/tourist/TouristLayout';
import { SafetyMap } from '@/components/map/SafetyMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Shield, Users } from 'lucide-react';

export default function TouristMap() {
  return (
    <TouristLayout>
      <div className="space-y-4 animate-in">
        <div>
          <h1 className="text-2xl font-bold">Safety Map</h1>
          <p className="text-muted-foreground">Real-time safety zones and crowd density</p>
        </div>

        <SafetyMap height="50vh" className="rounded-xl overflow-hidden shadow-lg" />

        {/* Legend */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Map Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-safe" />
              <span className="text-sm">Safe Zone - Well patrolled area</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-caution" />
              <span className="text-sm">Caution Zone - Stay alert</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-danger" />
              <span className="text-sm">High Risk - Avoid if possible</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Smaller circles show real-time crowd density from users
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="glass-card">
            <CardContent className="pt-4 text-center">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Safe Zones</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 text-center">
              <Shield className="w-5 h-5 mx-auto mb-1 text-safe" />
              <p className="text-xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">Police Posts</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-accent" />
              <p className="text-xl font-bold">24</p>
              <p className="text-xs text-muted-foreground">Reports Today</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TouristLayout>
  );
}
