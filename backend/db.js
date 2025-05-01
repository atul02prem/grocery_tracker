const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Create database connection
const dbPath = path.join(dataDir, 'grocery.db');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initSchema = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grocery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_expiration ON grocery_items(expiration_date);
`;

db.serialize(() => {
    db.exec(initSchema, (err) => {
        if (err) {
            console.error('Error initializing database schema:', err);
        } else {
            console.log('Database schema initialized successfully');
        }
    });
});

// User operations
const createUser = (firstName, lastName, email, password) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(
            'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)'
        );
        stmt.run([firstName, lastName, email, password], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
        stmt.finalize();
    });
};

const getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE email = ?',
            [email],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
};

// Grocery item operations
const createItem = (userId, itemName, purchaseDate, expirationDate) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(
            'INSERT INTO grocery_items (user_id, item_name, purchase_date, expiration_date) VALUES (?, ?, ?, ?)'
        );
        stmt.run([userId, itemName, purchaseDate, expirationDate], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
        stmt.finalize();
    });
};

const getItemsByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM grocery_items WHERE user_id = ? ORDER BY expiration_date ASC',
            [userId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

const updateItem = (itemId, userId, itemName, purchaseDate, expirationDate) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(
            'UPDATE grocery_items SET item_name = ?, purchase_date = ?, expiration_date = ? WHERE id = ? AND user_id = ?'
        );
        stmt.run([itemName, purchaseDate, expirationDate, itemId, userId], function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
        stmt.finalize();
    });
};

const deleteItem = (itemId, userId) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(
            'DELETE FROM grocery_items WHERE id = ? AND user_id = ?'
        );
        stmt.run([itemId, userId], function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
        });
        stmt.finalize();
    });
};

const getExpiringItems = (userId) => {
    return new Promise((resolve, reject) => {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        
        db.all(
            `SELECT * FROM grocery_items 
             WHERE user_id = ? 
             AND expiration_date <= ? 
             AND expiration_date >= date('now')
             ORDER BY expiration_date ASC`,
            [userId, threeDaysFromNow.toISOString().split('T')[0]],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
};

module.exports = {
    createUser,
    getUserByEmail,
    createItem,
    getItemsByUserId,
    updateItem,
    deleteItem,
    getExpiringItems
}; 