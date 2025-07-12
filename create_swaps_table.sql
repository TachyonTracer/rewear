-- Create swaps table for handling swap requests between users
CREATE TABLE swaps (
    id SERIAL PRIMARY KEY,
    requester_id INT NOT NULL,
    requester_product_id INT NOT NULL,
    target_user_id INT NOT NULL,
    target_product_id INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (requester_product_id) REFERENCES products(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    FOREIGN KEY (target_product_id) REFERENCES products(id)
);

-- Create indexes for better performance
CREATE INDEX idx_swaps_requester ON swaps(requester_id);
CREATE INDEX idx_swaps_target_user ON swaps(target_user_id);
CREATE INDEX idx_swaps_status ON swaps(status);
CREATE INDEX idx_swaps_created_at ON swaps(created_at);
