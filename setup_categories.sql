-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_pl TEXT NOT NULL,
  name_de TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_cs TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_en TEXT,
  description_pl TEXT,
  description_de TEXT,
  description_fr TEXT,
  description_cs TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_pl TEXT NOT NULL,
  name_de TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_cs TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES categories(id),
  color TEXT DEFAULT '#6B7280',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create model_tags junction table
CREATE TABLE IF NOT EXISTS model_tags (
  id SERIAL PRIMARY KEY,
  model_id INTEGER REFERENCES models(id) ON DELETE CASCADE NOT NULL,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add category_id column to models table if it doesn't exist
ALTER TABLE models ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Insert main categories
INSERT INTO categories (name_en, name_pl, name_de, name_fr, name_cs, slug, description_en, description_pl, description_de, description_fr, description_cs, icon, color, sort_order) VALUES
('Art', 'Sztuka', 'Kunst', 'Art', 'Umění', 'art', 'Artistic and creative models', 'Modele artystyczne i kreatywne', 'Künstlerische und kreative Modelle', 'Modèles artistiques et créatifs', 'Umělecké a kreativní modely', 'Palette', '#EC4899', 1),
('Home & Garden', 'Dom i Ogród', 'Haus & Garten', 'Maison & Jardin', 'Dům a Zahrada', 'home-garden', 'Household and garden items', 'Przedmioty domowe i ogrodowe', 'Haushalts- und Gartenartikel', 'Articles ménagers et de jardin', 'Domácí a zahradní předměty', 'Home', '#10B981', 2),
('Architecture', 'Architektura', 'Architektur', 'Architecture', 'Architektura', 'architecture', 'Architectural designs and structures', 'Projekty architektoniczne i konstrukcje', 'Architektonische Entwürfe und Strukturen', 'Conceptions architecturales et structures', 'Architektonické návrhy a struktury', 'Building2', '#3B82F6', 3),
('Gadget', 'Gadżety', 'Gadgets', 'Gadgets', 'Gadgety', 'gadget', 'Electronic devices and accessories', 'Urządzenia elektroniczne i akcesoria', 'Elektronische Geräte und Zubehör', 'Appareils électroniques et accessoires', 'Elektronická zařízení a příslušenství', 'Smartphone', '#F59E0B', 4),
('Game', 'Gry', 'Spiele', 'Jeux', 'Hry', 'game', 'Gaming related models and toys', 'Modele związane z grami i zabawkami', 'Gaming-bezogene Modelle und Spielzeug', 'Modèles liés aux jeux et jouets', 'Herní modely a hračky', 'Gamepad2', '#8B5CF6', 5),
('Tools', 'Narzędzia', 'Werkzeuge', 'Outils', 'Nástroje', 'tools', 'Professional and hobby tools', 'Narzędzia profesjonalne i hobbystyczne', 'Professionelle und Hobby-Werkzeuge', 'Outils professionnels et de loisir', 'Profesionální a hobby nástroje', 'Wrench', '#EF4444', 6)
ON CONFLICT (slug) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_pl = EXCLUDED.name_pl,
  name_de = EXCLUDED.name_de,
  name_fr = EXCLUDED.name_fr,
  name_cs = EXCLUDED.name_cs,
  description_en = EXCLUDED.description_en,
  description_pl = EXCLUDED.description_pl,
  description_de = EXCLUDED.description_de,
  description_fr = EXCLUDED.description_fr,
  description_cs = EXCLUDED.description_cs,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;