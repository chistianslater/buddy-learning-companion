-- Migration: Add Learning Companion Schema
-- This migration adds the core database tables for the digital learning companion system
-- Tables: user_interests, competencies, competency_progress, learning_context

-- =============================================
-- 1. USER INTERESTS Table
-- =============================================
-- Stores user's personal interests that are used as anchors for learning

CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interest_name TEXT NOT NULL,
    intensity_level INTEGER DEFAULT 1 CHECK (intensity_level BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================
-- 2. COMPETENCIES Table
-- =============================================
-- Stores curriculum competencies with German educational system metadata

CREATE TYPE public.competency_domain AS ENUM (
    'Mathematik',
    'Deutsch',
    'Sachkunde',
    'Englisch',
    'Kunst',
    'Musik',
    'Sport'
);

CREATE TYPE public.federal_state AS ENUM (
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen'
);

CREATE TABLE IF NOT EXISTS public.competencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    domain competency_domain NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 10),
    federal_state federal_state NOT NULL,
    prerequisites TEXT[] DEFAULT '{}',
    learning_objectives TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================
-- 3. COMPETENCY_PROGRESS Table
-- =============================================
-- Tracks user progress through competencies

CREATE TYPE public.progress_status AS ENUM (
    'not_started',
    'in_progress',
    'mastered',
    'struggling'
);

CREATE TABLE IF NOT EXISTS public.competency_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started',
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    attempts INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    total_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    UNIQUE(user_id, competency_id)
);

-- =============================================
-- 4. LEARNING_CONTEXT Table
-- =============================================
-- Stores user preferences and engagement patterns

CREATE TYPE public.session_duration_preference AS ENUM (
    'short_15',
    'medium_30',
    'long_45',
    'flexible'
);

CREATE TABLE IF NOT EXISTS public.learning_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_times TEXT[] DEFAULT '{}', -- Array of preferred time slots
    session_duration session_duration_preference DEFAULT 'medium_30',
    engagement_patterns JSONB DEFAULT '{}',
    learning_style_preferences JSONB DEFAULT '{}',
    sensitivity_settings JSONB DEFAULT '{"visual_stimulus": "low", "auditory_stimulus": "low", "cognitive_load": "low"}',
    last_session_at TIMESTAMP WITH TIME ZONE,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    UNIQUE(user_id)
);

-- =============================================
-- Indexes for Performance Optimization
-- =============================================

-- User interests indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_name ON public.user_interests(interest_name);

-- Competencies indexes
CREATE INDEX IF NOT EXISTS idx_competencies_domain ON public.competencies(domain);
CREATE INDEX IF NOT EXISTS idx_competencies_grade_level ON public.competencies(grade_level);
CREATE INDEX IF NOT EXISTS idx_competencies_federal_state ON public.competencies(federal_state);
CREATE INDEX IF NOT EXISTS idx_competencies_domain_grade ON public.competencies(domain, grade_level);

-- Competency progress indexes
CREATE INDEX IF NOT EXISTS idx_competency_progress_user_id ON public.competency_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_competency_progress_status ON public.competency_progress(status);
CREATE INDEX IF NOT EXISTS idx_competency_progress_competency_id ON public.competency_progress(competency_id);
CREATE INDEX IF NOT EXISTS idx_competency_progress_user_status ON public.competency_progress(user_id, status);

-- Learning context indexes
CREATE INDEX IF NOT EXISTS idx_learning_context_user_id ON public.learning_context(user_id);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_context ENABLE ROW LEVEL SECURITY;

-- Competencies table is readable by all authenticated users (curriculum data)
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

-- User interests policies
CREATE POLICY "Users can view own interests" ON public.user_interests
    FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own interests" ON public.user_interests
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own interests" ON public.user_interests
    FOR UPDATE USING (requesting_user_id() = user_id);

CREATE POLICY "Users can delete own interests" ON public.user_interests
    FOR DELETE USING (requesting_user_id() = user_id);

-- Competency progress policies
CREATE POLICY "Users can view own progress" ON public.competency_progress
    FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own progress" ON public.competency_progress
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own progress" ON public.competency_progress
    FOR UPDATE USING (requesting_user_id() = user_id);

-- Learning context policies
CREATE POLICY "Users can view own learning context" ON public.learning_context
    FOR SELECT USING (requesting_user_id() = user_id);

CREATE POLICY "Users can insert own learning context" ON public.learning_context
    FOR INSERT WITH CHECK (requesting_user_id() = user_id);

CREATE POLICY "Users can update own learning context" ON public.learning_context
    FOR UPDATE USING (requesting_user_id() = user_id);

-- Competencies policies (curriculum data is readable by all authenticated users)
CREATE POLICY "Authenticated users can view competencies" ON public.competencies
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- Trigger Functions for Updated At
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_user_interests_updated_at
    BEFORE UPDATE ON public.user_interests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_competencies_updated_at
    BEFORE UPDATE ON public.competencies
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_competency_progress_updated_at
    BEFORE UPDATE ON public.competency_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_learning_context_updated_at
    BEFORE UPDATE ON public.learning_context
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Seed Data: German Curriculum Competencies
-- =============================================

-- Insert sample competencies for different grade levels and federal states
INSERT INTO public.competencies (domain, title, description, grade_level, federal_state, prerequisites, learning_objectives) VALUES
-- Mathematics Grade 3
('Mathematik', 'Grundrechenarten verstehen und anwenden', 'Die vier Grundrechenarten (Addition, Subtraktion, Multiplikation, Division) im Zahlenraum bis 1000 verstehen und sicher anwenden.', 3, 'Bayern', '{}', '{"Zahlen bis 1000 sicher addieren und subtrahieren", "Das kleine Einmaleins beherrschen", "Einfache Divisionen verstehen"}'),
('Mathematik', 'Geometrische Formen erkennen', 'Zweidimensionale Grundformen (Kreis, Dreieck, Viereck) erkennen, benennen und ihre Eigenschaften beschreiben.', 3, 'Bayern', '{}', '{"Grundformen erkennen und benennen", "Eigenschaften beschreiben", "Formen in der Umwelt entdecken"}'),

-- Mathematics Grade 4
('Mathematik', 'Schriftliche Rechenverfahren', 'Schriftliche Addition und Subtraktion im Zahlenraum bis 10.000, einfache schriftliche Multiplikation.', 4, 'Bayern', '{"Grundrechenarten beherrschen"}', '{"Schriftliche Addition und Subtraktion durchführen", "Überschlag schätzen", "Rechenwege erklären"}'),
('Mathematik', 'Brüche als Teil eines Ganzen', 'Einfache Brüche (1/2, 1/4, 3/4) als Teil eines Ganzen verstehen und darstellen.', 4, 'Bayern', '{}', '{"Einfache Brüche verstehen", "Brüche als Teil von Figuren darstellen", "Gleichwertige Brüche erkennen"}'),

-- Mathematics Grade 5
('Mathematik', 'Flächeninhalte berechnen', 'Flächeninhalte von Rechtecken und Quadraten berechnen, Flächen vergleichen und schätzen.', 5, 'Bayern', '{"Geometrische Grundformen kennen"}', '{"Rechtecksflächen berechnen", "Flächen schätzen und vergleichen", "Einheiten umrechnen"}'),
('Mathematik', 'Dezimalzahlen verstehen', 'Dezimalzahlen bis zum Hundertstert verstehen, lesen, schreiben und vergleichen.', 5, 'Bayern', '{"Brüche als Teil verstehen"}', '{"Dezimalzahlen lesen und schreiben", "Dezimalzahlen vergleichen", "Dezimalbrüche in Brüche umwandeln"}'),

-- German Grade 3
('Deutsch', 'Leseflüssigkeit entwickeln', 'Texte flüssig und verständlich lesen, Lesesicherheit verbessern.', 3, 'Bayern', '{}', '{"Texte flüssig vorlesen", "Sinnentnehmend lesen", "Lesestrategien anwenden"}'),
('Deutsch', 'Rechtschreibung Grundregeln', 'Grundlegende Rechtschreibregeln anwenden: Groß- und Kleinschreibung, Worttrennung, einfache Laut-Buchstaben-Zuordnungen.', 3, 'Bayern', '{}', '{"Groß- und Kleinschreibung beachten", "Wörter am Zeilenende trennen", "Laute richtig zuordnen"}'),

-- German Grade 4
('Deutsch', 'Texte verfassen', 'Einfache Erzählungen, Beschreibungen und Berichte verfassen, Texte planen und überarbeiten.', 4, 'Bayern', '{"Rechtschreibung Grundregeln"}', '{"Erzählungen schreiben", "Beschreibungen verfassen", "Texte überarbeiten"}'),
('Deutsch', 'Grammatik: Satzarten', 'Hauptsätze, Nebensätze und Satzzeichen erkennen und正确 verwenden.', 4, 'Bayern', '{"Einfache Sätze bilden"}', '{"Satzarten unterscheiden", "Satzzeichen setzen", "Sätze verbinden"}'),

-- Sachkunde Grade 3
('Sachkunde', 'Lebensräume verstehen', 'Verschiedene Lebensräume (Wald, Wiese, Wasser) erkunden und deren Bewohner kennenlernen.', 3, 'Bayern', '{}', '{"Lebensräume beschreiben", "Tiere und Pflanzen zuordnen", "Nahrungsnetz verstehen"}'),
('Sachkunde', 'Zeit und Kalender', 'Jahreszeiten, Monate, Wochentage und Uhrenzeiten verstehen und im Kalender orientieren.', 3, 'Bayern', '{}', '{"Jahreszeiten beschreiben", "Kalender lesen", "Uhrzeiten ablesen"}'),

-- English Grade 3
('Englisch', 'Einfache Englische Sätze', 'Grundlegende englische Begrüßungen, Vorstellungen und einfache Sätze verstehen und bilden.', 3, 'Bayern', '{}', '{"Begrüßungen verstehen", "Einfache Sätze bilden", "Auf Englisch vorstellen"}'),

-- English Grade 4
('Englisch', 'English Numbers and Colors', 'English numbers from 1-20 and basic colors understand and use in simple sentences.', 4, 'Bayern', '{"Einfache Englische Sätze"}', '{"Numbers 1-20 verstehen", "Colors benennen", "Einfache Zählungen durchführen"}');

-- =============================================
-- Grant Permissions
-- =============================================

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.competency_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_context TO authenticated;
GRANT SELECT ON public.competencies TO authenticated;

-- Grant usage for sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get next competency for user
CREATE OR REPLACE FUNCTION public.get_next_competency(
    p_user_id TEXT,
    p_grade_level INTEGER,
    p_federal_state federal_state
)
RETURNS TABLE (
    competency_id UUID,
    domain competency_domain,
    title TEXT,
    description TEXT,
    priority_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_progress AS (
        SELECT
            cp.competency_id,
            CASE
                WHEN cp.status = 'not_started' THEN 3
                WHEN cp.status = 'struggling' THEN 2
                WHEN cp.status = 'in_progress' THEN 1
                WHEN cp.status = 'mastered' THEN 0
            END as priority_score
        FROM public.competency_progress cp
        WHERE cp.user_id = p_user_id
    ),
    available_competencies AS (
        SELECT
            c.id,
            c.domain,
            c.title,
            c.description,
            COALESCE(up.priority_score, 3) as priority_score
        FROM public.competencies c
        LEFT JOIN user_progress up ON c.id = up.competency_id
        WHERE c.grade_level = p_grade_level
        AND c.federal_state = p_federal_state
        ORDER BY
            priority_score DESC,
            c.created_at ASC
        LIMIT 1
    )
    SELECT
        ac.id::UUID,
        ac.domain::competency_domain,
        ac.title,
        ac.description,
        ac.priority_score::INTEGER
    FROM available_competencies ac;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user engagement metrics
CREATE OR REPLACE FUNCTION public.update_engagement_metrics(
    p_user_id TEXT,
    p_session_duration_minutes INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.learning_context (
        user_id,
        last_session_at,
        total_sessions,
        engagement_patterns
    ) VALUES (
        p_user_id,
        timezone('utc'::text, now()),
        1,
        jsonb_build_object('last_session_duration', p_session_duration_minutes)
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        last_session_at = timezone('utc'::text, now()),
        total_sessions = learning_context.total_sessions + 1,
        engagement_patterns = learning_context.engagement_patterns ||
            jsonb_build_object('last_session_duration', p_session_duration_minutes,
                             'last_session', timezone('utc'::text, now())),
        updated_at = timezone('utc'::text, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.user_interests IS 'Stores user interests that serve as anchors for personalized learning';
COMMENT ON TABLE public.competencies IS 'Curriculum competencies aligned with German educational standards';
COMMENT ON TABLE public.competency_progress IS 'Tracks individual user progress through competencies';
COMMENT ON TABLE public.learning_context IS 'Stores user preferences and engagement patterns for personalization';

COMMENT ON COLUMN public.user_interests.intensity_level IS '1=low interest, 5=very high interest/passionate';
COMMENT ON COLUMN public.competency_progress.confidence_score IS '0.00=no confidence, 1.00=complete mastery';
COMMENT ON COLUMN public.learning_context.sensitivity_settings IS 'Controls stimulus levels for neurodivergent users';