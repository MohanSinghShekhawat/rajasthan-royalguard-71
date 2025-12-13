import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { SafetyZone, CrowdReport } from '@/types';
import { useGeolocation, DEFAULT_COORDS } from '@/hooks/useGeolocation';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface SafetyMapProps {
  showCrowdData?: boolean;
  showSafetyZones?: boolean;
  height?: string;
  className?: string;
}

const safetyColors = {
  safe: '#2E8B57',
  caution: '#F59E0B',
  danger: '#DC2626',
};

const densityColors = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#EF4444',
};

function LocationMarker() {
  const { latitude, longitude } = useGeolocation({ watch: true });
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 14);
    }
  }, [latitude, longitude, map]);

  if (!latitude || !longitude) return null;

  return (
    <Marker position={[latitude, longitude]}>
      <Popup>
        <div className="text-center">
          <p className="font-semibold">Your Location</p>
          <p className="text-sm text-muted-foreground">
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export function SafetyMap({ 
  showCrowdData = true, 
  showSafetyZones = true,
  height = '400px',
  className = ''
}: SafetyMapProps) {
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([]);
  const [crowdReports, setCrowdReports] = useState<CrowdReport[]>([]);
  const { latitude, longitude } = useGeolocation();

  const center: [number, number] = [
    latitude || DEFAULT_COORDS.latitude,
    longitude || DEFAULT_COORDS.longitude,
  ];

  useEffect(() => {
    async function fetchData() {
      if (showSafetyZones) {
        const { data: zones } = await supabase
          .from('safety_zones')
          .select('*');
        if (zones) setSafetyZones(zones as SafetyZone[]);
      }

      if (showCrowdData) {
        // Get crowd reports from last 24 hours
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const { data: reports } = await supabase
          .from('crowd_reports')
          .select('*')
          .gte('created_at', yesterday.toISOString());
        if (reports) setCrowdReports(reports as CrowdReport[]);
      }
    }

    fetchData();

    // Subscribe to realtime updates
    if (showCrowdData) {
      const channel = supabase
        .channel('crowd-reports')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'crowd_reports' },
          (payload) => {
            setCrowdReports(prev => [...prev, payload.new as CrowdReport]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [showCrowdData, showSafetyZones]);

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationMarker />

        {/* Safety Zones */}
        {showSafetyZones && safetyZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.latitude, zone.longitude]}
            radius={zone.radius_meters}
            pathOptions={{
              color: safetyColors[zone.safety_level],
              fillColor: safetyColors[zone.safety_level],
              fillOpacity: 0.2,
            }}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">{zone.name}</h3>
                <p className="text-sm">{zone.description}</p>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1`}
                  style={{ 
                    backgroundColor: safetyColors[zone.safety_level],
                    color: 'white'
                  }}
                >
                  {zone.safety_level.toUpperCase()}
                </span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Crowd Reports */}
        {showCrowdData && crowdReports.map((report) => (
          <Circle
            key={report.id}
            center={[report.latitude, report.longitude]}
            radius={100}
            pathOptions={{
              color: densityColors[report.density_level],
              fillColor: densityColors[report.density_level],
              fillOpacity: 0.5,
            }}
          >
            <Popup>
              <div>
                <h3 className="font-semibold">Crowd Report</h3>
                <p className="text-sm">People detected: {report.person_count}</p>
                <p className="text-sm">Density: {report.density_level}</p>
                {report.location_name && (
                  <p className="text-sm text-muted-foreground">{report.location_name}</p>
                )}
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
}
