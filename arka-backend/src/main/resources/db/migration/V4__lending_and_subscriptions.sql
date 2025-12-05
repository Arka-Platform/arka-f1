-- Create lendings table
CREATE TABLE lendings (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    book_id UUID NOT NULL REFERENCES books(id),
    owner_id UUID NOT NULL,
    borrower_id UUID NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    start_date TIMESTAMP,
    expected_return_date TIMESTAMP,
    actual_return_date TIMESTAMP,
    lending_fee NUMERIC(10,2),
    deposit NUMERIC(10,2),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    notes VARCHAR(1000),
    condition_before VARCHAR(255),
    condition_after VARCHAR(255)
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    user_id UUID NOT NULL,
    plan VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    renewal_date TIMESTAMP,
    monthly_price NUMERIC(10,2),
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    books_per_month INTEGER,
    books_used_this_month INTEGER DEFAULT 0,
    unlimited_access BOOLEAN NOT NULL DEFAULT false,
    priority_support BOOLEAN NOT NULL DEFAULT false,
    ad_free BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for performance
CREATE INDEX idx_lendings_book_id ON lendings(book_id);
CREATE INDEX idx_lendings_owner_id ON lendings(owner_id);
CREATE INDEX idx_lendings_borrower_id ON lendings(borrower_id);
CREATE INDEX idx_lendings_status ON lendings(status);
CREATE INDEX idx_lendings_requested_at ON lendings(requested_at DESC);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);



