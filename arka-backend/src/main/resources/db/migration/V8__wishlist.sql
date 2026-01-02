-- Create wishlists table
CREATE TABLE wishlists (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    notes VARCHAR(500)
);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_wishlists_user_book ON wishlists(user_id, book_id);

-- Indexes for performance
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_book_id ON wishlists(book_id);
CREATE INDEX idx_wishlists_created_at ON wishlists(created_at DESC);


