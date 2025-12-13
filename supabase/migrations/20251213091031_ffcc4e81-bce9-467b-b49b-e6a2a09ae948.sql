-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('tourist', 'official');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create trusted_contacts table for "Watch Me" feature
CREATE TABLE public.trusted_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create safety_zones table for geo-fenced areas
CREATE TABLE public.safety_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER DEFAULT 500,
  safety_level TEXT NOT NULL CHECK (safety_level IN ('safe', 'caution', 'danger')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create crowd_reports table for Crowd Cam submissions
CREATE TABLE public.crowd_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  person_count INTEGER NOT NULL DEFAULT 0,
  density_level TEXT NOT NULL CHECK (density_level IN ('low', 'medium', 'high')),
  image_url TEXT,
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sos_alerts table for emergency alerts
CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create scams table for Common Scams Database
CREATE TABLE public.scams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  prevention_tips TEXT[],
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create transport_services table for Verified Transport
CREATE TABLE public.transport_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  license_number TEXT,
  phone TEXT,
  area TEXT,
  is_verified BOOLEAN DEFAULT true,
  rating DECIMAL(2,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create watch_me_sessions table for location sharing
CREATE TABLE public.watch_me_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_latitude DOUBLE PRECISION,
  last_longitude DOUBLE PRECISION,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checklist_items table for Pre-Trip Checklist
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_me_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.phone
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_zones_updated_at
  BEFORE UPDATE ON public.safety_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Officials can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for trusted_contacts
CREATE POLICY "Users can manage own contacts"
  ON public.trusted_contacts FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for safety_zones (public read, officials can manage)
CREATE POLICY "Anyone can view safety zones"
  ON public.safety_zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officials can manage safety zones"
  ON public.safety_zones FOR ALL
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for crowd_reports
CREATE POLICY "Authenticated users can create crowd reports"
  ON public.crowd_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view crowd reports"
  ON public.crowd_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officials can manage all crowd reports"
  ON public.crowd_reports FOR ALL
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for sos_alerts
CREATE POLICY "Users can create own SOS alerts"
  ON public.sos_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own SOS alerts"
  ON public.sos_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Officials can view all SOS alerts"
  ON public.sos_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'official'));

CREATE POLICY "Officials can update SOS alerts"
  ON public.sos_alerts FOR UPDATE
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for scams (public read)
CREATE POLICY "Anyone can view scams"
  ON public.scams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officials can manage scams"
  ON public.scams FOR ALL
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for transport_services (public read)
CREATE POLICY "Anyone can view transport services"
  ON public.transport_services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Officials can manage transport services"
  ON public.transport_services FOR ALL
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for watch_me_sessions
CREATE POLICY "Users can manage own watch sessions"
  ON public.watch_me_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Officials can view all watch sessions"
  ON public.watch_me_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'official'));

-- RLS Policies for checklist_items
CREATE POLICY "Users can manage own checklist items"
  ON public.checklist_items FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for crowd_reports and sos_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.crowd_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- Insert sample scams data
INSERT INTO public.scams (title, description, category, location, prevention_tips, severity) VALUES
('Fake Taxi Meters', 'Taxi drivers tampering with meters to overcharge tourists', 'Transport', 'Jaipur', ARRAY['Use prepaid taxi counters at airports', 'Negotiate fare before starting', 'Use official taxi apps'], 'high'),
('Gem Store Scam', 'Fake gem stores offering "export deals" that are worthless', 'Shopping', 'Jaipur', ARRAY['Only buy from government-certified shops', 'Never trust strangers offering deals', 'Ask for authenticity certificates'], 'high'),
('Temple Donation Pressure', 'Fake priests pressuring for large donations', 'Religious', 'Various', ARRAY['Donate only what you are comfortable with', 'Ignore aggressive priests', 'Report to temple authorities'], 'medium'),
('Photography Fee Scam', 'Locals demanding money for photos taken of them', 'Street', 'Tourist Areas', ARRAY['Ask permission before photographing people', 'Agree on price beforehand', 'Walk away if demands are unreasonable'], 'low'),
('Tour Guide Kickbacks', 'Guides taking tourists to overpriced shops for commissions', 'Shopping', 'All Cities', ARRAY['Research shops independently', 'Decline shopping detours', 'Use government-approved guides'], 'medium');

-- Insert sample transport services
INSERT INTO public.transport_services (name, service_type, license_number, phone, area, is_verified, rating) VALUES
('Rajasthan State Road Transport', 'Bus', 'RJ-GOV-001', '1800-180-3030', 'State-wide', true, 4.2),
('Jaipur Metro Rail', 'Metro', 'JM-2015-001', '141-2722050', 'Jaipur', true, 4.5),
('Pink City Prepaid Taxi', 'Taxi', 'RJ-14-TX-2023', '141-2201010', 'Jaipur Airport', true, 4.0),
('Udaipur Lake Palace Boats', 'Boat', 'UD-BOAT-001', '294-2528800', 'Udaipur', true, 4.7),
('Jodhpur Heritage Walks', 'Walking Tour', 'JD-TOUR-055', '291-2612321', 'Jodhpur', true, 4.8);

-- Insert sample safety zones
INSERT INTO public.safety_zones (name, description, latitude, longitude, radius_meters, safety_level) VALUES
('Hawa Mahal Area', 'Well-patrolled tourist zone with police presence', 26.9239, 75.8267, 500, 'safe'),
('Amber Fort Complex', 'Heritage site with security checkpoints', 26.9855, 75.8513, 800, 'safe'),
('Johari Bazaar', 'Crowded market area - watch for pickpockets', 26.9186, 75.8229, 300, 'caution'),
('City Palace Udaipur', 'Royal heritage site with good security', 24.5764, 73.6915, 600, 'safe'),
('Pushkar Lake', 'Religious area - respectful behavior required', 26.4897, 74.5511, 400, 'safe');