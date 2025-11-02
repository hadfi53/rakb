-- Drop existing objects
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;

-- Create review status type
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reviewed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status review_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    rental_id UUID REFERENCES public.rentals(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_rental_id ON public.reviews(rental_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reviews"
    ON public.reviews FOR SELECT
    TO authenticated
    USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id);

CREATE POLICY "Users can create reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = reviewer_id AND status = 'pending')
    WITH CHECK (auth.uid() = reviewer_id AND status = 'pending');

CREATE POLICY "Users can delete their own reviews"
    ON public.reviews FOR DELETE
    TO authenticated
    USING (auth.uid() = reviewer_id AND status = 'pending');

-- Create function to get user reviews
CREATE OR REPLACE FUNCTION get_user_reviews(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    reviewer_id UUID,
    reviewer_name TEXT,
    rating INTEGER,
    comment TEXT,
    status review_status,
    created_at TIMESTAMPTZ,
    rental_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.reviewer_id,
        CONCAT(p.first_name, ' ', p.last_name) as reviewer_name,
        r.rating,
        r.comment,
        r.status,
        r.created_at,
        r.rental_id
    FROM public.reviews r
    JOIN public.profiles p ON p.id = r.reviewer_id
    WHERE r.reviewed_id = p_user_id
    ORDER BY r.created_at DESC;
END;
$$; 