-- Jalankan SQL ini di Supabase Dashboard > SQL Editor

-- Tambah kolom linked_event_ids (array UUID) untuk multi-select event
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS linked_event_ids UUID[] DEFAULT NULL;

-- Buat index GIN untuk performa query array
CREATE INDEX IF NOT EXISTS idx_articles_linked_event_ids ON articles USING GIN(linked_event_ids);

-- (Opsional) Jika sebelumnya sudah punya linked_event_id single, migrate datanya dulu:
-- UPDATE articles SET linked_event_ids = ARRAY[linked_event_id] WHERE linked_event_id IS NOT NULL;

-- Cek hasilnya
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'articles'
ORDER BY ordinal_position;
