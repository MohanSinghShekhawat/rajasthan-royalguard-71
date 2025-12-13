import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Tourist Pages
import TouristHome from "./pages/tourist/TouristHome";
import TouristMap from "./pages/tourist/TouristMap";
import CrowdCam from "./pages/tourist/CrowdCam";
import SafetyTools from "./pages/tourist/SafetyTools";
import TouristProfile from "./pages/tourist/TouristProfile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMap from "./pages/admin/AdminMap";
import CrowdAnalytics from "./pages/admin/CrowdAnalytics";
import AccommodationInsights from "./pages/admin/AccommodationInsights";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'tourist' | 'official' }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'official' ? '/admin' : '/tourist'} replace />;
  }

  return <>{children}</>;
}

// Root redirect based on auth state
function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && role) {
    return <Navigate to={role === 'official' ? '/admin' : '/tourist'} replace />;
  }

  return <Landing />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Landing / Auth */}
      <Route path="/" element={<RootRedirect />} />

      {/* Tourist Routes */}
      <Route path="/tourist" element={<ProtectedRoute requiredRole="tourist"><TouristHome /></ProtectedRoute>} />
      <Route path="/tourist/map" element={<ProtectedRoute requiredRole="tourist"><TouristMap /></ProtectedRoute>} />
      <Route path="/tourist/camera" element={<ProtectedRoute requiredRole="tourist"><CrowdCam /></ProtectedRoute>} />
      <Route path="/tourist/safety" element={<ProtectedRoute requiredRole="tourist"><SafetyTools /></ProtectedRoute>} />
      <Route path="/tourist/profile" element={<ProtectedRoute requiredRole="tourist"><TouristProfile /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="official"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/map" element={<ProtectedRoute requiredRole="official"><AdminMap /></ProtectedRoute>} />
      <Route path="/admin/crowd" element={<ProtectedRoute requiredRole="official"><CrowdAnalytics /></ProtectedRoute>} />
      <Route path="/admin/accommodation" element={<ProtectedRoute requiredRole="official"><AccommodationInsights /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute requiredRole="official"><Reports /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="official"><Settings /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
