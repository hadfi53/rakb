-- Create enum for rating type
CREATE TYPE public.rating_type AS ENUM (
    'owner_rating',    -- Évaluation du propriétaire par le locataire
    'renter_rating',   -- Évaluation du locataire par le propriétaire
    'car_rating'       -- Évaluation de la voiture par le locataire
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES auth.users(id),
    rated_user_id UUID REFERENCES auth.users(id),
    car_id UUID REFERENCES public.cars(id),
    rating_type rating_type NOT NULL,
    
    -- Note globale
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Critères spécifiques pour l'évaluation des propriétaires
    communication_rating INTEGER CHECK (
        (rating_type = 'owner_rating' AND communication_rating >= 1 AND communication_rating <= 5) OR
        (rating_type != 'owner_rating' AND communication_rating IS NULL)
    ),
    punctuality_rating INTEGER CHECK (
        (rating_type = 'owner_rating' AND punctuality_rating >= 1 AND punctuality_rating <= 5) OR
        (rating_type != 'owner_rating' AND punctuality_rating IS NULL)
    ),
    car_condition_rating INTEGER CHECK (
        (rating_type = 'owner_rating' AND car_condition_rating >= 1 AND car_condition_rating <= 5) OR
        (rating_type != 'owner_rating' AND car_condition_rating IS NULL)
    ),
    
    -- Critères spécifiques pour l'évaluation des locataires
    reliability_rating INTEGER CHECK (
        (rating_type = 'renter_rating' AND reliability_rating >= 1 AND reliability_rating <= 5) OR
        (rating_type != 'renter_rating' AND reliability_rating IS NULL)
    ),
    car_care_rating INTEGER CHECK (
        (rating_type = 'renter_rating' AND car_care_rating >= 1 AND car_care_rating <= 5) OR
        (rating_type != 'renter_rating' AND car_care_rating IS NULL)
    ),
    return_condition_rating INTEGER CHECK (
        (rating_type = 'renter_rating' AND return_condition_rating >= 1 AND return_condition_rating <= 5) OR
        (rating_type != 'renter_rating' AND return_condition_rating IS NULL)
    ),
    
    comment TEXT NOT NULL CHECK (LENGTH(comment) >= 20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT valid_rating_target CHECK (
        (rating_type = 'owner_rating' AND rated_user_id IS NOT NULL AND car_id IS NULL) OR
        (rating_type = 'renter_rating' AND rated_user_id IS NOT NULL AND car_id IS NULL) OR
        (rating_type = 'car_rating' AND car_id IS NOT NULL AND rated_user_id IS NULL)
    ),
    CONSTRAINT unique_reservation_rating UNIQUE (reservation_id, rater_id, rating_type)
);

-- Create indexes for performance
CREATE INDEX ratings_reservation_id_idx ON public.ratings(reservation_id);
CREATE INDEX ratings_rater_id_idx ON public.ratings(rater_id);
CREATE INDEX ratings_rated_user_id_idx ON public.ratings(rated_user_id);
CREATE INDEX ratings_car_id_idx ON public.ratings(car_id);
CREATE INDEX ratings_rating_type_idx ON public.ratings(rating_type);
CREATE INDEX ratings_rating_idx ON public.ratings(rating);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own ratings"
ON public.ratings FOR INSERT TO authenticated
WITH CHECK (
    rater_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.id = reservation_id
        AND (
            -- Le locataire peut évaluer le propriétaire et la voiture
            (r.user_id = auth.uid() AND rating_type IN ('owner_rating', 'car_rating')) OR
            -- Le propriétaire peut évaluer le locataire
            (r.car_owner_id = auth.uid() AND rating_type = 'renter_rating')
        )
        AND r.end_date < CURRENT_TIMESTAMP
        AND r.status = 'completed'
    )
);

CREATE POLICY "Users can read all ratings"
ON public.ratings FOR SELECT TO authenticated
USING (true);

-- Function to get detailed user ratings as owner
CREATE OR REPLACE FUNCTION get_owner_rating_stats(user_id_param UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_ratings BIGINT,
    communication_avg NUMERIC,
    punctuality_avg NUMERIC,
    car_condition_avg NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
        COUNT(*) as total_ratings,
        COALESCE(ROUND(AVG(communication_rating)::numeric, 1), 0) as communication_avg,
        COALESCE(ROUND(AVG(punctuality_rating)::numeric, 1), 0) as punctuality_avg,
        COALESCE(ROUND(AVG(car_condition_rating)::numeric, 1), 0) as car_condition_avg
    FROM public.ratings
    WHERE rated_user_id = user_id_param
    AND rating_type = 'owner_rating';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed user ratings as renter
CREATE OR REPLACE FUNCTION get_renter_rating_stats(user_id_param UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_ratings BIGINT,
    reliability_avg NUMERIC,
    car_care_avg NUMERIC,
    return_condition_avg NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
        COUNT(*) as total_ratings,
        COALESCE(ROUND(AVG(reliability_rating)::numeric, 1), 0) as reliability_avg,
        COALESCE(ROUND(AVG(car_care_rating)::numeric, 1), 0) as car_care_avg,
        COALESCE(ROUND(AVG(return_condition_rating)::numeric, 1), 0) as return_condition_avg
    FROM public.ratings
    WHERE rated_user_id = user_id_param
    AND rating_type = 'renter_rating';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user rating distribution
CREATE OR REPLACE FUNCTION get_user_rating_distribution(
    user_id_param UUID,
    rating_type_param rating_type
)
RETURNS TABLE (
    score INTEGER,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.rating as score,
        COUNT(*) as count
    FROM public.ratings r
    WHERE r.rated_user_id = user_id_param
    AND r.rating_type = rating_type_param
    GROUP BY r.rating
    ORDER BY r.rating DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 