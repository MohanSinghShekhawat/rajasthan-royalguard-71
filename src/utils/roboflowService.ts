import { RoboflowResponse, DensityLevel } from '@/types';

const ROBOFLOW_API_KEY = 'YOUR_ROBOFLOW_API_KEY';
const ROBOFLOW_MODEL_ENDPOINT = 'https://detect.roboflow.com/crowd-detection/1';

function getDensityLevel(count: number): DensityLevel {
  if (count > 50) return 'high';
  if (count > 20) return 'medium';
  return 'low';
}

function generateMockResponse(): RoboflowResponse {
  const mockCount = Math.floor(Math.random() * 80) + 5;
  
  return {
    predictions: Array.from({ length: mockCount }, (_, i) => ({
      class: 'person',
      confidence: 0.75 + Math.random() * 0.2,
      x: Math.random() * 640,
      y: Math.random() * 480,
      width: 30 + Math.random() * 20,
      height: 60 + Math.random() * 40,
    })),
    personCount: mockCount,
    densityLevel: getDensityLevel(mockCount),
  };
}

export async function analyzeImage(imageFile: File): Promise<RoboflowResponse> {
  // Check if API key is configured
  if (ROBOFLOW_API_KEY === 'YOUR_ROBOFLOW_API_KEY') {
    console.log('Roboflow API key not configured, using mock response');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return generateMockResponse();
  }

  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const response = await fetch(`${ROBOFLOW_MODEL_ENDPOINT}?api_key=${ROBOFLOW_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Count persons in predictions
    const personCount = data.predictions?.filter(
      (pred: { class: string }) => pred.class.toLowerCase() === 'person'
    ).length || 0;

    return {
      predictions: data.predictions || [],
      personCount,
      densityLevel: getDensityLevel(personCount),
    };
  } catch (error) {
    console.error('Roboflow API error, using mock response:', error);
    return generateMockResponse();
  }
}

export function getDensityLabel(level: DensityLevel): string {
  switch (level) {
    case 'low':
      return 'Low Density';
    case 'medium':
      return 'Moderate Density';
    case 'high':
      return 'High Density - Crowded';
  }
}

export function getDensityColor(level: DensityLevel): string {
  switch (level) {
    case 'low':
      return 'text-safe';
    case 'medium':
      return 'text-caution';
    case 'high':
      return 'text-danger';
  }
}
