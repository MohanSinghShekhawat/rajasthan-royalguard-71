import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Shield, MapPin, Users, AlertTriangle } from 'lucide-react';

export default function Settings() {
  return (
    <AdminLayout>
      <div className="space-y-6 animate-in max-w-3xl">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Configure system preferences and alerts</p>
        </div>

        {/* Alert Thresholds */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alert Thresholds
            </CardTitle>
            <CardDescription>
              Configure when the system should trigger alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="crowd-threshold">High Crowd Density Threshold</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="crowd-threshold"
                  type="number"
                  defaultValue="50"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">people detected</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sos-radius">SOS Alert Notification Radius</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="sos-radius"
                  type="number"
                  defaultValue="5"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">kilometers</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupancy-warning">Hotel Occupancy Warning Level</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="occupancy-warning"
                  type="number"
                  defaultValue="85"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">% occupancy</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SOS Alert Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive immediate alerts for all SOS triggers
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Crowd Density Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Alert when crowd exceeds threshold
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Summary Reports</p>
                <p className="text-sm text-muted-foreground">
                  Receive end-of-day analytics summary
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Send alerts to registered email addresses
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Safety Zone Management */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Safety Zone Management
            </CardTitle>
            <CardDescription>
              Configure safety zones and their properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Safety zones can be managed through the database. Future versions will include
              a visual map editor for creating and modifying zones.
            </p>
            <Button variant="outline">
              View Safety Zones in Database
            </Button>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              External service integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roboflow-key">Roboflow API Key</Label>
              <Input
                id="roboflow-key"
                type="password"
                placeholder="Enter your Roboflow API key"
              />
              <p className="text-xs text-muted-foreground">
                Used for crowd detection in Crowd Cam feature
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button>Save Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
