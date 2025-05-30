CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL, -- bcrypt hashes are long
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
