CREATE TABLE books (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    status VARCHAR(32) NOT NULL
);

CREATE INDEX idx_books_title_author ON books (LOWER(title), LOWER(author));

