CREATE TABLE bookshelf (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    notes TEXT,
    UNIQUE (user_id, book_id)
);

CREATE INDEX idx_bookshelf_user_id ON bookshelf(user_id);
CREATE INDEX idx_bookshelf_book_id ON bookshelf(book_id);


