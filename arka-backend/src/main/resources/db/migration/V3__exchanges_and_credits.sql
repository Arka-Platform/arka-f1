-- Create exchanges table
CREATE TABLE exchanges (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    book_id UUID NOT NULL REFERENCES books(id),
    seller_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    credit_amount NUMERIC(10,2) NOT NULL,
    service_fee NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
);

-- Create credit_transactions table
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    user_id UUID NOT NULL,
    exchange_id UUID REFERENCES exchanges(id),
    amount NUMERIC(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    description VARCHAR(500)
);

-- Create users table if it doesn't exist (for credit balance)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Add credit_balance column to users table
-- Note: This may fail if column already exists (e.g., created by Hibernate ddl-auto)
-- That's acceptable - Hibernate will handle schema updates in H2 local dev
-- For PostgreSQL production, this will add the column if it doesn't exist
-- H2 doesn't support IF NOT EXISTS in ALTER TABLE, so we rely on Hibernate for H2

-- Indexes for performance
CREATE INDEX idx_exchanges_book_id ON exchanges(book_id);
CREATE INDEX idx_exchanges_seller_id ON exchanges(seller_id);
CREATE INDEX idx_exchanges_buyer_id ON exchanges(buyer_id);
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_exchange_id ON credit_transactions(exchange_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
















