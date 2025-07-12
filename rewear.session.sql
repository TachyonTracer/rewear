-- REWEAR - Clothing Resale Platform Database Schema and Queries
-- Created: July 12, 2025

-- ========================================
-- 1. DATABASE SCHEMA CREATION
-- ========================================

-- Create database (if using separate database)
-- CREATE DATABASE rewear;
-- USE rewear;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    type ENUM('admin', 'user', 'seller') NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
-- CREATE TABLE categories (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     name VARCHAR(100) NOT NULL,
--     slug VARCHAR(100) UNIQUE NOT NULL,
--     description TEXT,
--     parent_id INT,
--     image_url VARCHAR(255),
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (parent_id) REFERENCES categories(id)
-- );

-- Brands table
CREATE TABLE brands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    brand_id INT,
    size VARCHAR(20),
    color VARCHAR(50),
    condition_rating ENUM('new', 'like_new', 'very_good', 'good', 'fair') NOT NULL,
    original_price DECIMAL(10, 2),
    price DECIMAL(10, 2) NOT NULL,
    is_negotiable BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'sold', 'pending', 'removed') DEFAULT 'active',
    measurements TEXT, -- JSON string for detailed measurements
    tags TEXT, -- JSON array of tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    image_url TEXT[],
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Product images table
-- CREATE TABLE product_images (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     product_id INT NOT NULL,
--     image_url VARCHAR(255) NOT NULL,
--     is_primary BOOLEAN DEFAULT FALSE,
--     sort_order INT DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
-- );

-- User favorites/likes table
-- CREATE TABLE user_favorites (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     user_id INT NOT NULL,
--     product_id INT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id),
--     FOREIGN KEY (product_id) REFERENCES products(id),
--     UNIQUE KEY unique_favorite (user_id, product_id)
-- );

-- Messages table for buyer-seller communication
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
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
    id INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    product_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Reviews table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
);

-- Search history table
-- CREATE TABLE search_history (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     user_id INT,
--     search_term VARCHAR(255) NOT NULL,
--     results_count INT DEFAULT 0,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- ========================================
-- 2. SAMPLE DATA INSERTION
-- ========================================

-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
('Women''s Clothing', 'womens-clothing', 'All women''s clothing items'),
('Men''s Clothing', 'mens-clothing', 'All men''s clothing items'),
('Accessories', 'accessories', 'Bags, jewelry, and accessories'),
('Shoes', 'shoes', 'All types of footwear');

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id) VALUES
('Dresses', 'dresses', 'Women''s dresses', 1),
('Tops', 'tops', 'Women''s tops and blouses', 1),
('Jeans', 'jeans', 'Denim jeans', 1),
('Shirts', 'shirts', 'Men''s shirts', 2),
('Pants', 'pants', 'Men''s pants', 2),
('Handbags', 'handbags', 'Women''s handbags', 3),
('Sneakers', 'sneakers', 'Athletic shoes', 4),
('Heels', 'heels', 'High heels', 4);

-- Insert sample brands
INSERT INTO brands (name, slug, description) VALUES
('Zara', 'zara', 'Fast fashion brand'),
('H&M', 'hm', 'Swedish clothing retailer'),
('Nike', 'nike', 'Athletic wear and shoes'),
('Adidas', 'adidas', 'Sports clothing and footwear'),
('Gucci', 'gucci', 'Luxury fashion brand'),
('Louis Vuitton', 'louis-vuitton', 'Luxury fashion and leather goods'),
('Uniqlo', 'uniqlo', 'Japanese casual wear');

-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name, phone, city, state) VALUES
('alice@example.com', 'hashed_password_1', 'Alice', 'Johnson', '555-0101', 'New York', 'NY'),
('bob@example.com', 'hashed_password_2', 'Bob', 'Smith', '555-0102', 'Los Angeles', 'CA'),
('carol@example.com', 'hashed_password_3', 'Carol', 'Davis', '555-0103', 'Chicago', 'IL'),
('david@example.com', 'hashed_password_4', 'David', 'Wilson', '555-0104', 'Houston', 'TX');

-- ========================================
-- 3. ESSENTIAL QUERIES FOR THE APPLICATION
-- ========================================

-- Query 1: Get all active products with seller and category info
SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.condition_rating,
    p.size,
    p.color,
    p.views_count,
    p.likes_count,
    p.created_at,
    u.first_name as seller_first_name,
    u.last_name as seller_last_name,
    c.name as category_name,
    b.name as brand_name,
    pi.image_url as primary_image
FROM products p
JOIN users u ON p.seller_id = u.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE p.status = 'active'
ORDER BY p.created_at DESC;

-- Query 2: Search products by keyword
SELECT 
    p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.size,
    c.name as category_name,
    b.name as brand_name,
    pi.image_url as primary_image
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE p.status = 'active'
AND (
    p.title LIKE '%dress%' OR 
    p.description LIKE '%dress%' OR
    c.name LIKE '%dress%' OR
    b.name LIKE '%dress%'
)
ORDER BY p.created_at DESC;

-- Query 3: Get user's favorite products
SELECT 
    p.id,
    p.title,
    p.price,
    p.condition_rating,
    c.name as category_name,
    pi.image_url as primary_image,
    uf.created_at as favorited_at
FROM user_favorites uf
JOIN products p ON uf.product_id = p.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE uf.user_id = 1
ORDER BY uf.created_at DESC;

-- Query 4: Get products by category
SELECT 
    p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.size,
    b.name as brand_name,
    pi.image_url as primary_image
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE c.slug = 'dresses'
AND p.status = 'active'
ORDER BY p.created_at DESC;

-- Query 5: Get user's selling products
SELECT 
    p.id,
    p.title,
    p.price,
    p.status,
    p.views_count,
    p.likes_count,
    p.created_at,
    c.name as category_name,
    pi.image_url as primary_image
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE p.seller_id = 1
ORDER BY p.created_at DESC;

-- Query 6: Get product details with all images
SELECT 
    p.*,
    u.first_name as seller_first_name,
    u.last_name as seller_last_name,
    u.profile_image as seller_profile_image,
    c.name as category_name,
    b.name as brand_name,
    GROUP_CONCAT(pi.image_url ORDER BY pi.sort_order) as all_images
FROM products p
JOIN users u ON p.seller_id = u.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = 1
GROUP BY p.id;

-- Query 7: Get user's orders (as buyer)
SELECT 
    o.id,
    o.total_amount,
    o.status,
    o.created_at,
    p.title as product_title,
    p.price as product_price,
    pi.image_url as product_image,
    u.first_name as seller_first_name,
    u.last_name as seller_last_name
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN users u ON o.seller_id = u.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE o.buyer_id = 1
ORDER BY o.created_at DESC;

-- Query 8: Get user's sales (as seller)
SELECT 
    o.id,
    o.total_amount,
    o.status,
    o.created_at,
    p.title as product_title,
    u.first_name as buyer_first_name,
    u.last_name as buyer_last_name
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN users u ON o.buyer_id = u.id
WHERE o.seller_id = 1
ORDER BY o.created_at DESC;

-- Query 9: Get user's messages
SELECT 
    m.id,
    m.subject,
    m.message,
    m.is_read,
    m.created_at,
    u.first_name as sender_first_name,
    u.last_name as sender_last_name,
    p.title as product_title
FROM messages m
JOIN users u ON m.sender_id = u.id
LEFT JOIN products p ON m.product_id = p.id
WHERE m.recipient_id = 1
ORDER BY m.created_at DESC;

-- Query 10: Get trending/popular products
SELECT 
    p.id,
    p.title,
    p.price,
    p.condition_rating,
    p.views_count,
    p.likes_count,
    c.name as category_name,
    b.name as brand_name,
    pi.image_url as primary_image
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE p.status = 'active'
ORDER BY (p.views_count + p.likes_count * 3) DESC
LIMIT 20;

-- ========================================
-- 4. ADVANCED QUERIES FOR ANALYTICS
-- ========================================

-- Query 11: Get category statistics
SELECT 
    c.name as category_name,
    COUNT(p.id) as total_products,
    AVG(p.price) as avg_price,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY total_products DESC;

-- Query 12: Get user statistics
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT p.id) as products_listed,
    COUNT(DISTINCT o.id) as orders_completed,
    AVG(r.rating) as avg_rating,
    COUNT(DISTINCT r.id) as total_reviews
FROM users u
LEFT JOIN products p ON u.id = p.seller_id
LEFT JOIN orders o ON u.id = o.seller_id AND o.status = 'delivered'
LEFT JOIN reviews r ON u.id = r.reviewee_id
GROUP BY u.id, u.first_name, u.last_name
ORDER BY products_listed DESC;

-- Query 13: Get monthly sales report
SELECT 
    DATE_FORMAT(o.created_at, '%Y-%m') as month,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value
FROM orders o
WHERE o.status IN ('delivered', 'paid')
GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
ORDER BY month DESC;

-- ========================================
-- 5. UTILITY QUERIES
-- ========================================

-- Query 14: Add product to favorites
INSERT INTO user_favorites (user_id, product_id) 
VALUES (1, 1)
ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP;

-- Query 15: Remove product from favorites
DELETE FROM user_favorites 
WHERE user_id = 1 AND product_id = 1;

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
SELECT 
    p.id,
    p.title,
    p.price,
    p.condition_rating,
    pi.image_url as primary_image
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
WHERE p.category_id = (SELECT category_id FROM products WHERE id = 1)
AND p.id != 1
AND p.price BETWEEN 
    (SELECT price * 0.7 FROM products WHERE id = 1) AND 
    (SELECT price * 1.3 FROM products WHERE id = 1)
AND p.status = 'active'
ORDER BY ABS(p.price - (SELECT price FROM products WHERE id = 1))
LIMIT 5;

-- ========================================
-- 6. INDEXES FOR PERFORMANCE
-- ========================================

-- Create indexes for better query performance
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_created ON products(created_at);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_product ON user_favorites(product_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(is_primary);

-- ========================================
-- END OF REWEAR SQL QUERIES
-- ========================================