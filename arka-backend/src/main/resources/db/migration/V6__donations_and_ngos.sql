-- Create NGOs table
CREATE TABLE ngos (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(200),
    verified BOOLEAN NOT NULL DEFAULT false,
    books_received INTEGER DEFAULT 0,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(100),
    website VARCHAR(500)
);

-- Create NGOs categories join table (for ElementCollection)
CREATE TABLE ngos_categories (
    ngos_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    PRIMARY KEY (ngos_id, category)
);

-- Create donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    ngo_id UUID NOT NULL REFERENCES ngos(id),
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_phone VARCHAR(100) NOT NULL,
    donor_type VARCHAR(20) NOT NULL,
    institution_name VARCHAR(255),
    book_count INTEGER NOT NULL,
    condition VARCHAR(20) NOT NULL,
    pickup_street VARCHAR(500) NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_state VARCHAR(100) NOT NULL,
    pickup_pincode VARCHAR(20) NOT NULL,
    additional_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    user_id UUID
);

-- Create donations categories join table (for ElementCollection)
CREATE TABLE donations_book_categories (
    donations_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    PRIMARY KEY (donations_id, category)
);

-- Add is_admin column to users table
-- Note: This may fail if column already exists (e.g., created by Hibernate ddl-auto)
-- That's acceptable - Hibernate will handle schema updates in H2 local dev
-- For PostgreSQL production, this will add the column if it doesn't exist
-- H2 doesn't support IF NOT EXISTS in ALTER TABLE, so we rely on Hibernate for H2
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Indexes for performance
CREATE INDEX idx_ngos_verified ON ngos(verified);
CREATE INDEX idx_donations_ngo_id ON donations(ngo_id);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created_at ON donations(created_at);

