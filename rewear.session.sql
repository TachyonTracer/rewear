-- REWEAR - Clothing Resale Platform Database Schema and Queries (PostgreSQL)
-- Created: July 12, 2025
-- ========================================
-- 1. DATABASE SCHEMA CREATION
-- ========================================
-- Create custom types for PostgreSQL
CREATE TYPE user_type AS ENUM ('admin', 'user', 'seller');
CREATE TYPE condition_type AS ENUM ('new', 'like_new', 'very_good', 'good', 'fair');
CREATE TYPE product_status AS ENUM ('active', 'sold', 'pending', 'removed');
CREATE TYPE order_status AS ENUM (
    'pending',
    'paid',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    type user_type NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
-- Brands table
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    brand_id INT,
    size VARCHAR(20),
    color VARCHAR(50),
    condition_rating condition_type NOT NULL,
    original_price DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    is_negotiable BOOLEAN DEFAULT FALSE,
    status product_status DEFAULT 'active',
    measurements JSONB,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_urls TEXT[],
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);
 -- Product images table
-- CREATE TABLE product_images (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     product_id INT NOT NULL,
--     image_url VARCHAR(255) NOT NULL, x
--     is_primary BOOLEAN DEFAULT FALSE,
--     sort_order INT DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
-- );
-- User favorites/likes table
CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (user_id, product_id)
);
-- Messages table for buyer-seller communication
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    product_id INT,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    product_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    status order_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    shipping_address JSONB,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewee_id INT NOT NULL,
    rating INT NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (reviewee_id) REFERENCES users(id)
);
-- Search history table
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INT,
    search_term VARCHAR(255) NOT NULL,
    results_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

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

-- ========================================
-- 2. SAMPLE DATA INSERTION
-- ========================================
-- Insert sample categories
INSERT INTO categories (name, slug, description)
VALUES (
        'Women''s Clothing',
        'womens-clothing',
        'All women''s clothing items'
    ),
    (
        'Men''s Clothing',
        'mens-clothing',
        'All men''s clothing items'
    ),
    (
        'Accessories',
        'accessories',
        'Bags, jewelry, and accessories'
    ),
    ('Shoes', 'shoes', 'All types of footwear');
-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id)
VALUES ('Dresses', 'dresses', 'Women''s dresses', 1),
    ('Tops', 'tops', 'Women''s tops and blouses', 1),
    ('Jeans', 'jeans', 'Denim jeans', 1),
    ('Shirts', 'shirts', 'Men''s shirts', 2),
    ('Pants', 'pants', 'Men''s pants', 2),
    ('Handbags', 'handbags', 'Women''s handbags', 3),
    ('Sneakers', 'sneakers', 'Athletic shoes', 4),
    ('Heels', 'heels', 'High heels', 4);
-- Insert sample brands
INSERT INTO brands (name, slug, description)
VALUES ('Zara', 'zara', 'Fast fashion brand'),
    ('H&M', 'hm', 'Swedish clothing retailer'),
    ('Nike', 'nike', 'Athletic wear and shoes'),
    (
        'Adidas',
        'adidas',
        'Sports clothing and footwear'
    ),
    ('Gucci', 'gucci', 'Luxury fashion brand'),
    (
        'Louis Vuitton',
        'louis-vuitton',
        'Luxury fashion and leather goods'
    ),
    ('Uniqlo', 'uniqlo', 'Japanese casual wear');
-- Insert sample users
INSERT INTO users (
        email,
        password_hash,
        phone,
        city,
        state,
        type
    )
VALUES (
        'Alpha@123',
        'Alpha@123',
        '555-0101',
        'New York',
        'NY',
        'admin'
    ),
    (
        'Beta@123',
        'Beta@123',
        '555-0102',
        'Los Angeles',
        'CA',
        'user'
    ),
    (
        'Gamma@123',
        'Gamma@123',
        '555-0103',
        'Chicago',
        'IL',
        'seller'
    );
   
-- Insert sample products
INSERT INTO products (
        seller_id,
        title,
        description,
        category_id,
        brand_id,
        size,
        color,
        condition_rating,
        price,
        image_urls,
        tags
    )
VALUES (
        3,
        'Vintage Zara Dress',
        'Beautiful vintage dress in excellent condition',
        5,
        1,
        'M',
        'Black',
        'very_good',
        45.00,
        ARRAY ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        ARRAY ['vintage', 'formal', 'elegant']
    ),
    (
        3,
        'Nike Air Max Sneakers',
        'Barely worn Nike sneakers',
        11,
        3,
        '9',
        'White',
        'like_new',
        120.00,
        ARRAY ['https://example.com/shoe1.jpg', 'https://example.com/shoe2.jpg'],
        ARRAY ['athletic', 'casual', 'comfortable']
    );
-- ========================================
-- 3. ESSENTIAL QUERIES FOR THE APPLICATION
-- ========================================
-- Query 1: Get all active products with seller and brand info
SELECT p.id,
    p.title,
    p.description,
    p.price,
    p.condition_rating,
    p.size,
    p.color,
    p.views_count,
    p.likes_count,
    p.created_at,
    u.first_name || ' ' || u.last_name as seller_name,
    c.name as category_name,
    b.name as brand_name,
    p.image_urls [1] as primary_image
FROM products p
    JOIN users u ON p.seller_id = u.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active'
ORDER BY p.created_at DESC;
-- Query 2: Search products by keyword (using PostgreSQL text search)
SELECT p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.size,
    c.name as category_name,
    b.name as brand_name,
    p.image_urls [1] as primary_image
FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active'
    AND (
        p.title ILIKE '%dress%'
        OR p.description ILIKE '%dress%'
        OR c.name ILIKE '%dress%'
        OR b.name ILIKE '%dress%'
        OR 'dress' = ANY(p.tags)
    )
ORDER BY p.created_at DESC;
-- Query 3: Get user's favorite products
SELECT p.id,
    p.title,
    p.price,
    p.condition_rating,
    c.name as category_name,
    p.image_urls [1] as primary_image,
    uf.created_at as favorited_at
FROM user_favorites uf
    JOIN products p ON uf.product_id = p.id
    JOIN categories c ON p.category_id = c.id
WHERE uf.user_id = 1
ORDER BY uf.created_at DESC;
-- Query 4: Get products by category
SELECT p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.size,
    b.name as brand_name,
    p.image_urls [1] as primary_image
FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
WHERE c.slug = 'dresses'
    AND p.status = 'active'
ORDER BY p.created_at DESC;
-- Query 5: Get user's selling products
SELECT p.id,
    p.title,
    p.price,
    p.status,
    p.views_count,
    p.likes_count,
    p.created_at,
    c.name as category_name,
    p.image_urls [1] as primary_image
FROM products p
    JOIN categories c ON p.category_id = c.id
WHERE p.seller_id = 1
ORDER BY p.created_at DESC;
-- Query 6: Get product details with all images
SELECT p.*,
    u.first_name || ' ' || u.last_name as seller_name,
    u.profile_image as seller_profile_image,
    c.name as category_name,
    b.name as brand_name
FROM products p
    JOIN users u ON p.seller_id = u.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.id = 1;
-- Query 7: Get user's orders (as buyer)
SELECT o.id,
    o.total_amount,
    o.status,
    o.created_at,
    p.title as product_title,
    p.price as product_price,
    p.image_urls [1] as product_image,
    u.first_name || ' ' || u.last_name as seller_name
FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users u ON o.seller_id = u.id
WHERE o.buyer_id = 1
ORDER BY o.created_at DESC;
-- Query 8: Get user's sales (as seller)
SELECT o.id,
    o.total_amount,
    o.status,
    o.created_at,
    p.title as product_title,
    u.first_name || ' ' || u.last_name as buyer_name
FROM orders o
    JOIN products p ON o.product_id = p.id
    JOIN users u ON o.buyer_id = u.id
WHERE o.seller_id = 1
ORDER BY o.created_at DESC;
-- Query 9: Get user's messages
SELECT m.id,
    m.subject,
    m.message,
    m.is_read,
    m.created_at,
    u.first_name || ' ' || u.last_name as sender_name,
    p.title as product_title
FROM messages m
    JOIN users u ON m.sender_id = u.id
    LEFT JOIN products p ON m.product_id = p.id
WHERE m.recipient_id = 1
ORDER BY m.created_at DESC;
-- Query 10: Get trending/popular products
SELECT p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.views_count,
    p.likes_count,
    c.name as category_name,
    b.name as brand_name,
    p.image_urls [1] as primary_image
FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active'
ORDER BY (p.views_count + p.likes_count * 3) DESC
LIMIT 20;
-- ========================================
-- 4. ADVANCED QUERIES FOR ANALYTICS
-- ========================================
-- Query 11: Get category statistics
SELECT c.name as category_name,
    COUNT(p.id) as total_products,
    ROUND(AVG(p.price), 2) as avg_price,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price
FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    AND p.status = 'active'
GROUP BY c.id,
    c.name
ORDER BY total_products DESC;
-- Query 12: Get user statistics
SELECT u.id,
    u.first_name || ' ' || u.last_name as name,
    COUNT(DISTINCT p.id) as products_listed,
    COUNT(DISTINCT o.id) as orders_completed,
    ROUND(AVG(r.rating), 2) as avg_rating,
    COUNT(DISTINCT r.id) as total_reviews
FROM users u
    LEFT JOIN products p ON u.id = p.seller_id
    LEFT JOIN orders o ON u.id = o.seller_id
    AND o.status = 'delivered'
    LEFT JOIN reviews r ON u.id = r.reviewee_id
GROUP BY u.id,
    u.first_name || ' ' || u.last_name
ORDER BY products_listed DESC;
-- Query 13: Get monthly sales report
SELECT TO_CHAR(o.created_at, 'YYYY-MM') as month,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    ROUND(AVG(o.total_amount), 2) as avg_order_value
FROM orders o
WHERE o.status IN ('delivered', 'paid')
GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
ORDER BY month DESC;
-- ========================================
-- 5. UTILITY QUERIES
-- ========================================
-- Query 14: Add product to favorites
INSERT INTO user_favorites (user_id, product_id)
VALUES (1, 1) ON CONFLICT (user_id, product_id) DO
UPDATE
SET created_at = CURRENT_TIMESTAMP;
-- Query 15: Remove product from favorites
DELETE FROM user_favorites
WHERE user_id = 1
    AND product_id = 1;
-- Query 16: Update product views count
UPDATE products
SET views_count = views_count + 1
WHERE id = 1;
-- Query 17: Update product likes count
UPDATE products
SET likes_count = likes_count + 1
WHERE id = 1;
-- Query 18: Mark message as read
UPDATE messages
SET is_read = TRUE
WHERE id = 1;
-- Query 19: Update product status
UPDATE products
SET status = 'sold'
WHERE id = 1;
-- Query 20: Get similar products (same category, similar price range)
SELECT p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.image_urls [1] as primary_image
FROM products p
WHERE p.category_id = (
        SELECT category_id
        FROM products
        WHERE id = 1
    )
    AND p.id != 1
    AND p.price BETWEEN (
        SELECT price * 0.7
        FROM products
        WHERE id = 1
    )
    AND (
        SELECT price * 1.3
        FROM products
        WHERE id = 1
    )
    AND p.status = 'active'
ORDER BY ABS(
        p.price - (
            SELECT price
            FROM products
            WHERE id = 1
        )
    )
LIMIT 5;
-- Query 21: Search products by tags
SELECT p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.tags,
    p.image_urls [1] as primary_image
FROM products p
WHERE p.tags && ARRAY ['vintage', 'formal'] -- Contains any of these tags
    AND p.status = 'active'
ORDER BY p.created_at DESC;
-- Query 22: Get products with JSONB measurements query
SELECT p.id,
    p.title,
    p.price,
    p.measurements
FROM products p
WHERE p.measurements->>'chest' IS NOT NULL
    AND (p.measurements->>'chest')::numeric > 36
    AND p.status = 'active';
-- Query 23: Full-text search using PostgreSQL
SELECT p.id,
    p.title,
    p.description,
    p.price,
    ts_rank(
        to_tsvector(
            'english',
            p.title || ' ' || COALESCE(p.description, '')
        ),
        plainto_tsquery('english', 'vintage dress')
    ) as rank
FROM products p
WHERE to_tsvector(
        'english',
        p.title || ' ' || COALESCE(p.description, '')
    ) @@ plainto_tsquery('english', 'vintage dress')
    AND p.status = 'active'
ORDER BY rank DESC;
-- Query 24: Create a trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE
UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ========================================
-- 6. INDEXES FOR PERFORMANCE (PostgreSQL)
-- ========================================
-- Create indexes for better query performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_created ON products(created_at);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_measurements ON products USING GIN(measurements);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_product ON user_favorites(product_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_brands_slug ON brands(slug);
-- Full-text search indexes
CREATE INDEX idx_products_fts ON products USING GIN(
    to_tsvector(
        'english',
        title || ' ' || COALESCE(description, '')
    )
);
-- ========================================
-- 7. POSTGRESQL SPECIFIC FEATURES
-- ========================================
-- Create a view for active products with seller info
CREATE VIEW active_products_view AS
SELECT p.id,
    p.title,
    p.description,
    p.price,
    p.condition_rating,
    p.size,
    p.color,
    p.image_urls,
    p.tags,
    p.created_at,
    u.first_name || ' ' || u.last_name as seller_name,
    u.profile_image as seller_profile_image,
    c.name as category_name,
    b.name as brand_name
FROM products p
    JOIN users u ON p.seller_id = u.id
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.status = 'active';
-- Create a function to get product statistics
CREATE OR REPLACE FUNCTION get_product_stats(product_id INT) RETURNS TABLE(
        total_views INT,
        total_likes INT,
        is_favorited_by_user BOOLEAN
    ) AS $$ BEGIN RETURN QUERY
SELECT p.views_count,
    p.likes_count,
    EXISTS(
        SELECT 1
        FROM user_favorites uf
        WHERE uf.product_id = p.id
            AND uf.user_id = 1
    ) as is_favorited
FROM products p
WHERE p.id = product_id;
END;
$$ LANGUAGE plpgsql;
-- ========================================
-- END OF REWEAR POSTGRESQL SCHEMA
-- ========================================