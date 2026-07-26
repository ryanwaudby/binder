CREATE TABLE species (
  dex_number INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  page INTEGER NOT NULL,
  slot INTEGER NOT NULL
);

CREATE TABLE collection (
  dex_number INTEGER PRIMARY KEY REFERENCES species(dex_number),
  collected_at TEXT NOT NULL
);
