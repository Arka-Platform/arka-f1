CREATE TABLE books (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    credit_price NUMERIC(12,2) NOT NULL,
    owner_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL
);

CREATE TABLE user_behaviors (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    user_id UUID NOT NULL,
    book_id UUID,
    behavior_type VARCHAR(50) NOT NULL,
    search_query VARCHAR(500),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    duration_seconds INTEGER
);

CREATE INDEX idx_books_title_author ON books (title, author);
CREATE INDEX idx_books_genre ON books (genre);
CREATE INDEX idx_books_category ON books (category);
CREATE INDEX idx_books_subcategory ON books (subcategory);
CREATE INDEX idx_user_behaviors_user_id ON user_behaviors (user_id);
CREATE INDEX idx_user_behaviors_book_id ON user_behaviors (book_id);
CREATE INDEX idx_user_behaviors_type ON user_behaviors (behavior_type);
CREATE INDEX idx_user_behaviors_created_at ON user_behaviors (created_at);

CREATE TABLE waste_paper (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    weight_kg NUMERIC(10,2) NOT NULL,
    credit_value NUMERIC(12,2) NOT NULL,
    owner_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL
);

CREATE INDEX idx_waste_paper_category ON waste_paper (category);











