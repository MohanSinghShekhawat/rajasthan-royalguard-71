import { useState, useRef } from 'react';
import { Camera, Upload, Users, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { TouristLayout } from '@/components/tourist/TouristLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyzeImage, getDensityLabel, getDensityColor } from '@/utils/roboflowService';
import { RoboflowResponse, DensityLevel } from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CrowdCam() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RoboflowResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { latitude, longitude } = useGeolocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!fileInputRef.current?.files?.[0] && !cameraInputRef.current?.files?.[0]) {
      toast({
        title: 'No image selected',
        description: 'Please select or capture an image first',
        variant: 'destructive',
      });
      return;
    }

    const file = fileInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    
    try {
      const analysisResult = await analyzeImage(file);
      setResult(analysisResult);

      // Save report to database
      if (user && latitude && longitude) {
        await supabase.from('crowd_reports').insert({
          user_id: user.id,
          latitude,
          longitude,
          person_count: analysisResult.personCount,
          density_level: analysisResult.densityLevel,
        });

        toast({
          title: 'Report Submitted',
          description: 'Your crowd report has been shared with authorities',
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getDensityIcon = (level: DensityLevel) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="w-8 h-8 text-safe" />;
      case 'medium':
        return <Users className="w-8 h-8 text-caution" />;
      case 'high':
        return <AlertTriangle className="w-8 h-8 text-danger" />;
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <TouristLayout>
      <div className="space-y-4 animate-in">
        <div>
          <h1 className="text-2xl font-bold">Crowd Cam</h1>
          <p className="text-muted-foreground">Analyze crowd density using AI</p>
        </div>

        {!selectedImage ? (
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              {/* Camera Input */}
              <div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="camera-input"
                />
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-24 text-lg"
                  variant="outline"
                >
                  <Camera className="w-8 h-8 mr-3" />
                  Take Photo
                </Button>
              </div>

              {/* File Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-16"
                  variant="secondary"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload from Gallery
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Point your camera at the crowd to check density levels
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <Card className="glass-card overflow-hidden">
              <img 
                src={selectedImage} 
                alt="Selected" 
                className="w-full h-64 object-cover"
              />
            </Card>

            {/* Analysis Button */}
            {!result && (
              <Button 
                onClick={handleAnalyze} 
                className="w-full h-14 text-lg"
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Crowd...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 mr-2" />
                    Analyze Crowd Density
                  </>
                )}
              </Button>
            )}

            {/* Results */}
            {result && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {getDensityIcon(result.densityLevel)}
                    <span>Analysis Complete</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-3xl font-bold">{result.personCount}</p>
                      <p className="text-sm text-muted-foreground">People Detected</p>
                    </div>
                    <div className={cn(
                      'text-center p-4 rounded-lg',
                      result.densityLevel === 'low' && 'bg-safe/10',
                      result.densityLevel === 'medium' && 'bg-caution/10',
                      result.densityLevel === 'high' && 'bg-danger/10',
                    )}>
                      <p className={cn('text-lg font-bold', getDensityColor(result.densityLevel))}>
                        {getDensityLabel(result.densityLevel)}
                      </p>
                      <p className="text-sm text-muted-foreground">Crowd Level</p>
                    </div>
                  </div>

                  {result.densityLevel === 'high' && (
                    <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
                      <p className="text-sm text-danger font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        High crowd density detected. Exercise caution.
                      </p>
                    </div>
                  )}

                  <Button onClick={resetAnalysis} variant="outline" className="w-full">
                    Analyze Another Location
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tips */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Hold your phone steady and capture a wide view</p>
            <p>• Ensure good lighting for accurate detection</p>
            <p>• Include the entire crowd area in the frame</p>
            <p>• Your reports help others plan their visits</p>
          </CardContent>
        </Card>
      </div>
    </TouristLayout>
  );
}
