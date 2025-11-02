-- Créer les tables de messagerie pour RAKB
-- Migration: 20250129_create_messaging_tables.sql

-- Table pour les threads de conversation
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  participant_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Contrainte pour s'assurer que les participants sont différents
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id),
  -- Contrainte unique pour éviter les threads dupliqués pour la même réservation
  CONSTRAINT unique_booking_thread UNIQUE (booking_id, participant_1_id, participant_2_id)
);

-- Table pour les messages individuels
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Vérifier que le sender est un participant du thread
  CONSTRAINT valid_sender CHECK (
    EXISTS (
      SELECT 1 FROM public.message_threads mt
      WHERE mt.id = thread_id
      AND (mt.participant_1_id = sender_id OR mt.participant_2_id = sender_id)
    )
  )
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_message_threads_booking_id ON public.message_threads(booking_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_participant_1 ON public.message_threads(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_participant_2 ON public.message_threads(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message_at ON public.message_threads(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;

-- Fonction pour mettre à jour last_message_at et last_message_id
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.message_threads
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le thread quand un message est créé
CREATE TRIGGER update_thread_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Fonction pour obtenir ou créer un thread
CREATE OR REPLACE FUNCTION get_or_create_thread(
  p_booking_id UUID,
  p_participant_1_id UUID,
  p_participant_2_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  -- Chercher un thread existant (les participants peuvent être dans n'importe quel ordre)
  SELECT id INTO v_thread_id
  FROM public.message_threads
  WHERE booking_id = p_booking_id
    AND (
      (participant_1_id = p_participant_1_id AND participant_2_id = p_participant_2_id)
      OR (participant_1_id = p_participant_2_id AND participant_2_id = p_participant_1_id)
    )
  LIMIT 1;

  -- Si aucun thread n'existe, en créer un nouveau
  IF v_thread_id IS NULL THEN
    INSERT INTO public.message_threads (booking_id, participant_1_id, participant_2_id)
    VALUES (p_booking_id, p_participant_1_id, p_participant_2_id)
    RETURNING id INTO v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activer RLS sur les tables
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour message_threads
CREATE POLICY "Les utilisateurs peuvent voir leurs propres threads"
  ON public.message_threads FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Les utilisateurs peuvent créer des threads où ils sont participants"
  ON public.message_threads FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs threads"
  ON public.message_threads FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  )
  WITH CHECK (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- Politiques RLS pour messages
CREATE POLICY "Les utilisateurs peuvent voir les messages de leurs threads"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads mt
      WHERE mt.id = messages.thread_id
      AND (mt.participant_1_id = auth.uid() OR mt.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent envoyer des messages dans leurs threads"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.message_threads mt
      WHERE mt.id = thread_id
      AND (mt.participant_1_id = auth.uid() OR mt.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs messages reçus (marquer comme lu)"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.message_threads mt
      WHERE mt.id = thread_id
      AND (mt.participant_1_id = auth.uid() OR mt.participant_2_id = auth.uid())
    )
  )
  WITH CHECK (
    recipient_id = auth.uid()
  );

-- Activer Realtime pour les messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;

