-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(10,2) NOT NULL,
    pickup_fee NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    shipping_address TEXT,
    pickup_time VARCHAR(50),
    payment_method VARCHAR(50),
    contact_phone VARCHAR(50),
    special_instructions TEXT,
    tracking_number VARCHAR(100)
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    version BIGINT,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_book_id ON order_items(book_id);



