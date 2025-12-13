CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'tourist',
    'official'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklist_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    is_completed boolean DEFAULT false,
    category text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crowd_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crowd_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    person_count integer DEFAULT 0 NOT NULL,
    density_level text NOT NULL,
    image_url text,
    location_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT crowd_reports_density_level_check CHECK ((density_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    language text DEFAULT 'en'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: safety_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safety_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    radius_meters integer DEFAULT 500,
    safety_level text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT safety_zones_safety_level_check CHECK ((safety_level = ANY (ARRAY['safe'::text, 'caution'::text, 'danger'::text])))
);


--
-- Name: scams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    location text,
    prevention_tips text[],
    severity text DEFAULT 'medium'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT scams_severity_check CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])))
);


--
-- Name: sos_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sos_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    latitude double precision,
    longitude double precision,
    status text DEFAULT 'active'::text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sos_alerts_status_check CHECK ((status = ANY (ARRAY['active'::text, 'resolved'::text, 'cancelled'::text])))
);


--
-- Name: transport_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transport_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    service_type text NOT NULL,
    license_number text,
    phone text,
    area text,
    is_verified boolean DEFAULT true,
    rating numeric(2,1),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: trusted_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trusted_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    relationship text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: watch_me_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.watch_me_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    is_active boolean DEFAULT true,
    duration_minutes integer NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_latitude double precision,
    last_longitude double precision,
    last_updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: checklist_items checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_pkey PRIMARY KEY (id);


--
-- Name: crowd_reports crowd_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crowd_reports
    ADD CONSTRAINT crowd_reports_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: safety_zones safety_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_zones
    ADD CONSTRAINT safety_zones_pkey PRIMARY KEY (id);


--
-- Name: scams scams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scams
    ADD CONSTRAINT scams_pkey PRIMARY KEY (id);


--
-- Name: sos_alerts sos_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sos_alerts
    ADD CONSTRAINT sos_alerts_pkey PRIMARY KEY (id);


--
-- Name: transport_services transport_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transport_services
    ADD CONSTRAINT transport_services_pkey PRIMARY KEY (id);


--
-- Name: trusted_contacts trusted_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_contacts
    ADD CONSTRAINT trusted_contacts_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: watch_me_sessions watch_me_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_me_sessions
    ADD CONSTRAINT watch_me_sessions_pkey PRIMARY KEY (id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: safety_zones update_safety_zones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_safety_zones_updated_at BEFORE UPDATE ON public.safety_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: checklist_items checklist_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklist_items
    ADD CONSTRAINT checklist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: crowd_reports crowd_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crowd_reports
    ADD CONSTRAINT crowd_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sos_alerts sos_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sos_alerts
    ADD CONSTRAINT sos_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: trusted_contacts trusted_contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trusted_contacts
    ADD CONSTRAINT trusted_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: watch_me_sessions watch_me_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_me_sessions
    ADD CONSTRAINT watch_me_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: safety_zones Anyone can view safety zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view safety zones" ON public.safety_zones FOR SELECT TO authenticated USING (true);


--
-- Name: scams Anyone can view scams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view scams" ON public.scams FOR SELECT TO authenticated USING (true);


--
-- Name: transport_services Anyone can view transport services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view transport services" ON public.transport_services FOR SELECT TO authenticated USING (true);


--
-- Name: crowd_reports Authenticated users can create crowd reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create crowd reports" ON public.crowd_reports FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: crowd_reports Authenticated users can view crowd reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view crowd reports" ON public.crowd_reports FOR SELECT TO authenticated USING (true);


--
-- Name: crowd_reports Officials can manage all crowd reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can manage all crowd reports" ON public.crowd_reports USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: safety_zones Officials can manage safety zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can manage safety zones" ON public.safety_zones USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: scams Officials can manage scams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can manage scams" ON public.scams USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: transport_services Officials can manage transport services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can manage transport services" ON public.transport_services USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: sos_alerts Officials can update SOS alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can update SOS alerts" ON public.sos_alerts FOR UPDATE USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: sos_alerts Officials can view all SOS alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can view all SOS alerts" ON public.sos_alerts FOR SELECT USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: user_roles Officials can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: watch_me_sessions Officials can view all watch sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officials can view all watch sessions" ON public.watch_me_sessions FOR SELECT USING (public.has_role(auth.uid(), 'official'::public.app_role));


--
-- Name: sos_alerts Users can create own SOS alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own SOS alerts" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: checklist_items Users can manage own checklist items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own checklist items" ON public.checklist_items USING ((auth.uid() = user_id));


--
-- Name: trusted_contacts Users can manage own contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own contacts" ON public.trusted_contacts USING ((auth.uid() = user_id));


--
-- Name: watch_me_sessions Users can manage own watch sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own watch sessions" ON public.watch_me_sessions USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: sos_alerts Users can view own SOS alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own SOS alerts" ON public.sos_alerts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: checklist_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

--
-- Name: crowd_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.crowd_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: safety_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.safety_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: scams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scams ENABLE ROW LEVEL SECURITY;

--
-- Name: sos_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: transport_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transport_services ENABLE ROW LEVEL SECURITY;

--
-- Name: trusted_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: watch_me_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.watch_me_sessions ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


