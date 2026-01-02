-- H2 database requires separate ALTER TABLE statements for each column
ALTER TABLE books ADD COLUMN isbn VARCHAR(32);
ALTER TABLE books ADD COLUMN publisher VARCHAR(255);
ALTER TABLE books ADD COLUMN publication_year INTEGER;
ALTER TABLE books ADD COLUMN image_url_small VARCHAR(500);
ALTER TABLE books ADD COLUMN image_url_medium VARCHAR(500);
ALTER TABLE books ADD COLUMN image_url_large VARCHAR(500);
ALTER TABLE books ADD COLUMN average_rating NUMERIC(4, 2);
ALTER TABLE books ADD COLUMN ratings_count INTEGER DEFAULT 0;

ALTER TABLE books
    ADD CONSTRAINT uk_books_isbn UNIQUE (isbn);


















