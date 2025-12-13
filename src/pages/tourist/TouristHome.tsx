import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Phone, MapPin, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { SafetyIndicator } from '@/components/ui/SafetyIndicator';
import { SOSButton } from '@/components/ui/SOSButton';
import { TouristLayout } from '@/components/tourist/TouristLayout';
import { useGeolocation, DEFAULT_COORDS } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SafetyLevel, SafetyZone } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function TouristHome() {
  const [watchMeActive, setWatchMeActive] = useState(false);
  const [currentSafetyLevel, setCurrentSafetyLevel] = useState<SafetyLevel>('safe');
  const [nearbyZone, setNearbyZone] = useState<SafetyZone | null>(null);
  const { latitude, longitude, loading: locationLoading } = useGeolocation({ watch: true });
  const { user } = useAuth();
  const { toast } = useToast();

  // Check safety level based on location
  useEffect(() => {
    async function checkSafetyZone() {
      if (!latitude || !longitude) return;

      const { data: zones } = await supabase
        .from('safety_zones')
        .select('*');

      if (!zones) return;

      // Find the nearest zone
      let nearest: SafetyZone | null = null;
      let minDistance = Infinity;

      zones.forEach((zone: SafetyZone) => {
        const distance = Math.sqrt(
          Math.pow(zone.latitude - latitude, 2) + 
          Math.pow(zone.longitude - longitude, 2)
        ) * 111000; // Approximate meters

        if (distance < zone.radius_meters && distance < minDistance) {
          minDistance = distance;
          nearest = zone;
        }
      });

      if (nearest) {
        setNearbyZone(nearest);
        setCurrentSafetyLevel(nearest.safety_level);
      } else {
        setNearbyZone(null);
        setCurrentSafetyLevel('safe');
      }
    }

    checkSafetyZone();
  }, [latitude, longitude]);

  const handleWatchMeToggle = async (enabled: boolean) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to use the Watch Me feature',
        variant: 'destructive',
      });
      return;
    }

    setWatchMeActive(enabled);

    if (enabled) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      await supabase.from('watch_me_sessions').insert({
        user_id: user.id,
        duration_minutes: 30,
        expires_at: expiresAt.toISOString(),
        last_latitude: latitude,
        last_longitude: longitude,
      });

      toast({
        title: 'Watch Me Activated',
        description: 'Your trusted contacts can now see your location for 30 minutes',
      });
    } else {
      await supabase
        .from('watch_me_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      toast({
        title: 'Watch Me Deactivated',
        description: 'Location sharing has been stopped',
      });
    }
  };

  return (
    <TouristLayout>
      <div className="space-y-6 animate-in">
        {/* Safety Status */}
        <Card className="glass-card overflow-hidden">
          <div className={`h-2 ${
            currentSafetyLevel === 'safe' ? 'bg-safe' : 
            currentSafetyLevel === 'caution' ? 'bg-caution' : 'bg-danger'
          }`} />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Current Location Status</p>
                <h2 className="text-xl font-semibold mb-1">
                  {nearbyZone?.name || 'Unknown Area'}
                </h2>
                {locationLoading ? (
                  <p className="text-sm text-muted-foreground">Getting location...</p>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                  </p>
                )}
              </div>
              <SafetyIndicator level={currentSafetyLevel} size="md" showLabel={false} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          {/* SOS Button Card */}
          <Card className="glass-card">
            <CardContent className="pt-6 flex flex-col items-center gap-3">
              <SOSButton />
              <p className="text-sm text-muted-foreground text-center">
                Hold to send emergency alert
              </p>
            </CardContent>
          </Card>

          {/* Watch Me Feature */}
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span className="font-medium">Watch Me</span>
                </div>
                <Switch 
                  checked={watchMeActive} 
                  onCheckedChange={handleWatchMeToggle}
                />
              </div>
              {watchMeActive && (
                <div className="flex items-center gap-2 text-sm text-safe">
                  <Clock className="w-4 h-4" />
                  <span>Active for 30 min</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Share live location with trusted contacts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Numbers */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Police</span>
              <a href="tel:100" className="text-primary font-semibold">100</a>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Tourist Helpline</span>
              <a href="tel:1363" className="text-primary font-semibold">1363</a>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm">Women Helpline</span>
              <a href="tel:1091" className="text-primary font-semibold">1091</a>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="space-y-2">
          <Link to="/tourist/safety">
            <Card className="glass-card hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-caution/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-caution" />
                  </div>
                  <div>
                    <p className="font-medium">Common Scams</p>
                    <p className="text-sm text-muted-foreground">Learn how to stay safe</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/tourist/camera">
            <Card className="glass-card hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Crowd Cam</p>
                    <p className="text-sm text-muted-foreground">Check crowd density</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </TouristLayout>
  );
}
