CREATE TABLE trust_scores (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    trust_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    condition_accuracy_score NUMERIC(5, 2) DEFAULT 0,
    condition_assessments_count INTEGER DEFAULT 0,
    accurate_condition_count INTEGER DEFAULT 0,
    showup_reliability_score NUMERIC(5, 2) DEFAULT 0,
    pickup_commitments_count INTEGER DEFAULT 0,
    successful_showups_count INTEGER DEFAULT 0,
    no_shows_count INTEGER DEFAULT 0,
    response_time_score NUMERIC(5, 2) DEFAULT 0,
    average_response_time_hours NUMERIC(10, 2) DEFAULT 0,
    requests_responded_count INTEGER DEFAULT 0,
    completion_rate NUMERIC(5, 2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    completed_transactions INTEGER DEFAULT 0,
    cancellation_rate NUMERIC(5, 2) DEFAULT 0,
    cancelled_transactions INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP
);

CREATE INDEX idx_trust_scores_user_id ON trust_scores(user_id);
CREATE INDEX idx_trust_scores_trust_score ON trust_scores(trust_score);

-- Add condition fields to exchanges table (if they don't exist)
-- Note: H2 doesn't support IF NOT EXISTS, so this will be handled by ddl-auto: update
-- For PostgreSQL, uncomment the IF NOT EXISTS version:
-- ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS listed_condition VARCHAR(50);
-- ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS received_condition VARCHAR(50);

