import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, MapPin, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { analyzeImage, getDensityLabel, getZoneInfo } from '@/utils/roboflowService';
import { RoboflowResponse, DensityLevel } from '@/types';

// Predefined locations in Rajasthan
const LOCATIONS = [
  { name: 'Hawa Mahal, Jaipur', lat: 26.9239, lng: 75.8267 },
  { name: 'Amber Fort, Jaipur', lat: 26.9855, lng: 75.8513 },
  { name: 'City Palace, Jaipur', lat: 26.9258, lng: 75.8237 },
  { name: 'Jantar Mantar, Jaipur', lat: 26.9246, lng: 75.8245 },
  { name: 'Lake Pichola, Udaipur', lat: 24.5760, lng: 73.6803 },
  { name: 'City Palace, Udaipur', lat: 24.5764, lng: 73.6904 },
  { name: 'Mehrangarh Fort, Jodhpur', lat: 26.2979, lng: 73.0183 },
  { name: 'Jaisalmer Fort', lat: 26.9124, lng: 70.9079 },
  { name: 'Pushkar Lake', lat: 26.4899, lng: 74.5500 },
  { name: 'Albert Hall Museum, Jaipur', lat: 26.9116, lng: 75.8182 },
];

export function CrowdFeedUploader() {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<typeof LOCATIONS[0] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RoboflowResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: 'No Image',
        description: 'Please select an image first',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await analyzeImage(selectedImage);
      setResult(response);
      toast({
        title: 'Analysis Complete',
        description: `Detected ${response.personCount} people - ${getDensityLabel(response.densityLevel)}`,
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!result || !selectedLocation) {
      toast({
        title: 'Missing Data',
        description: 'Please analyze an image and select a location',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('crowd_reports').insert({
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        location_name: selectedLocation.name,
        person_count: result.personCount,
        density_level: result.densityLevel,
      });

      if (error) throw error;

      toast({
        title: 'Report Submitted',
        description: `Crowd data for ${selectedLocation.name} has been updated on the map`,
      });

      // Reset form
      setSelectedImage(null);
      setImagePreview(null);
      setResult(null);
      setSelectedLocation(null);
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Could not submit the crowd report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setSelectedLocation(null);
  };

  const zoneInfo = result ? getZoneInfo(result.densityLevel) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Camera className="w-4 h-4" />
          Feed Crowd Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Crowd Density Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-3">
            <Label>Upload Crowd Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Crowd preview"
                  className="w-full h-64 object-cover"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Location Selection */}
          <div className="space-y-3">
            <Label>Select Location</Label>
            <Select
              value={selectedLocation?.name}
              onValueChange={(value) => {
                const loc = LOCATIONS.find(l => l.name === value);
                setSelectedLocation(loc || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a tourist spot" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc.name} value={loc.name}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {loc.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || analyzing}
            className="w-full"
            variant="secondary"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Analyze Crowd Density
              </>
            )}
          </Button>

          {/* Results */}
          {result && zoneInfo && (
            <Card className={`${zoneInfo.bgColor} border-none`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  {result.densityLevel === 'high' ? (
                    <AlertTriangle className={`w-5 h-5 ${zoneInfo.color}`} />
                  ) : (
                    <CheckCircle className={`w-5 h-5 ${zoneInfo.color}`} />
                  )}
                  Analysis Results
                </CardTitle>
                <CardDescription>Based on AI crowd detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-3xl font-bold">{result.personCount}</p>
                    <p className="text-sm text-muted-foreground">People Detected</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className={`text-xl font-bold ${zoneInfo.color}`}>
                      {zoneInfo.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getDensityLabel(result.densityLevel)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-background/50 rounded-lg">
                  <h4 className="font-medium mb-2">Zone Classification</h4>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-safe/20 text-safe">
                      Green: 0-20 people
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-caution/20 text-caution">
                      Yellow: 21-50 people
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-danger/20 text-danger">
                      Red: 50+ people
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetForm} className="flex-1">
              Reset
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!result || !selectedLocation || submitting}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit to Map'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
