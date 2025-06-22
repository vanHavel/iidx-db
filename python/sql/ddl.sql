CREATE TABLE IF NOT EXISTS song (
  id INTEGER PRIMARY KEY,
  english_title TEXT NOT NULL,
  japanese_title TEXT, -- only set if different from english_title
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  min_bpm INTEGER NOT NULL,
  max_bpm INTEGER NOT NULL,
  unlock_type INTEGER NOT NULL, -- -1 = unknown, 0 = default, 1 = bits, 2 = songpack
  folder INTEGER NOT NULL -- see constants.ts for folder names
) STRICT;

CREATE TABLE IF NOT EXISTS chart (
  id INTEGER PRIMARY KEY,
  id_song INTEGER NOT NULL,
  difficulty INTEGER NOT NULL, -- 0 = beginner, 1 = standard, 2 = hyper, 3 = another, 4 = leggendaria
  chart_type INTEGER NOT NULL, -- 0 = single, 1 = double
  level INTEGER NOT NULL,
  note_count INTEGER NOT NULL,
  FOREIGN KEY (id_song) REFERENCES song(id) ON DELETE CASCADE,
  UNIQUE (id_song, difficulty, chart_type)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_chart_song ON chart (id_song);

CREATE VIRTUAL TABLE IF NOT EXISTS song_search USING fts5(
  english_title,
  artist,
  genre,
  content='song',
  content_rowid='id',
);
CREATE TRIGGER IF NOT EXISTS song_search_insert AFTER INSERT ON song BEGIN
  INSERT INTO song_search (rowid, english_title, artist, genre)
  VALUES (new.id, new.english_title, new.artist, new.genre);
END;