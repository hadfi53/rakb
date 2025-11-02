-- Désactiver temporairement RLS sur les tables principales
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Accorder toutes les permissions aux utilisateurs authentifiés
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.vehicles TO authenticated;
GRANT ALL ON public.profiles TO authenticated; 