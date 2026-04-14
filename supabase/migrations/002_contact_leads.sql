-- Landing chatbot lead qualification table
CREATE TABLE IF NOT EXISTS contact_leads (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             TEXT,
    phone            TEXT,
    role             TEXT,
    properties_count TEXT,
    main_challenge   TEXT,
    score            TEXT DEFAULT 'medio',   -- 'alto' | 'medio' | 'bajo'
    source           TEXT DEFAULT 'landing_chatbot',
    status           TEXT DEFAULT 'nuevo',   -- 'nuevo' | 'contactado' | 'cerrado'
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Only service role can read/write (admin access via Supabase dashboard or admin key)
ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON contact_leads
    USING (false);
