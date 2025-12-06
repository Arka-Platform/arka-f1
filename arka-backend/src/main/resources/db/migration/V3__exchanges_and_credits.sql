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

-- Add credit_balance column if users table exists but column doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'credit_balance') THEN
            ALTER TABLE users ADD COLUMN credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0;
        END IF;
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX idx_exchanges_book_id ON exchanges(book_id);
CREATE INDEX idx_exchanges_seller_id ON exchanges(seller_id);
CREATE INDEX idx_exchanges_buyer_id ON exchanges(buyer_id);
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_exchange_id ON credit_transactions(exchange_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);












