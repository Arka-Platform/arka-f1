-- Create book_requests table for demand-driven platform
CREATE TABLE book_requests (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    isbn VARCHAR(32),
    max_price DECIMAL(10, 2),
    preferred_condition VARCHAR(20),
    urgency VARCHAR(20),
    location VARCHAR(200),
    additional_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    expires_at TIMESTAMP,
    fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    fulfilled_at TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    offers_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_book_requests_requester_id ON book_requests(requester_id);
CREATE INDEX idx_book_requests_status ON book_requests(status);
CREATE INDEX idx_book_requests_expires_at ON book_requests(expires_at);
CREATE INDEX idx_book_requests_fulfilled_by ON book_requests(fulfilled_by);
CREATE INDEX idx_book_requests_created_at ON book_requests(created_at DESC);
CREATE INDEX idx_book_requests_genre ON book_requests(genre);
CREATE INDEX idx_book_requests_title_author ON book_requests(title, author);

-- Full-text search index (if supported)
-- CREATE INDEX idx_book_requests_search ON book_requests USING gin(to_tsvector('english', title || ' ' || author || ' ' || COALESCE(description, '')));


