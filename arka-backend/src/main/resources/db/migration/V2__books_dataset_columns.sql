ALTER TABLE books
    ADD COLUMN isbn VARCHAR(32),
    ADD COLUMN publisher VARCHAR(255),
    ADD COLUMN publication_year INTEGER,
    ADD COLUMN image_url_small VARCHAR(500),
    ADD COLUMN image_url_medium VARCHAR(500),
    ADD COLUMN image_url_large VARCHAR(500),
    ADD COLUMN average_rating NUMERIC(4, 2),
    ADD COLUMN ratings_count INTEGER DEFAULT 0;

ALTER TABLE books
    ADD CONSTRAINT uk_books_isbn UNIQUE (isbn);














