const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use an absolute path for the database file
const dbPath = path.join(__dirname, 'data', 'grocery.db');

// Create the data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Created data directory:', dataDir);
    } catch (err) {
        console.error('Error creating data directory:', err);
        throw err;
    }
}

// Initialize database connection
let db;
try {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            throw err;
        }
        console.log('Connected to the SQLite database at:', dbPath);
    });
} catch (err) {
    console.error('Failed to create database connection:', err);
    throw err;
}

// Initialize database with tables
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            db.serialize(() => {
                // Enable foreign keys
                db.run('PRAGMA foreign_keys = ON', (err) => {
                    if (err) {
                        console.error('Error enabling foreign keys:', err);
                        reject(err);
                        return;
                    }
                });

                // Create users table
                db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        console.error('Error creating users table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Users table created or already exists');
                });

                // Create grocery_items table
                db.run(`CREATE TABLE IF NOT EXISTS grocery_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    item_name TEXT NOT NULL,
                    purchase_date DATE NOT NULL,
                    expiration_date DATE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )`, (err) => {
                    if (err) {
                        console.error('Error creating grocery_items table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Grocery items table created or already exists');
                });

                // Create indexes
                db.run('CREATE INDEX IF NOT EXISTS idx_user_email ON users(email)', (err) => {
                    if (err) console.error('Error creating email index:', err);
                    else console.log('Email index created or already exists');
                });

                db.run('CREATE INDEX IF NOT EXISTS idx_items_user_id ON grocery_items(user_id)', (err) => {
                    if (err) console.error('Error creating user_id index:', err);
                    else console.log('User ID index created or already exists');
                });

                db.run('CREATE INDEX IF NOT EXISTS idx_items_expiration ON grocery_items(expiration_date)', (err) => {
                    if (err) console.error('Error creating expiration_date index:', err);
                    else console.log('Expiration date index created or already exists');
                });

                resolve();
            });
        } catch (err) {
            console.error('Error in database initialization:', err);
            reject(err);
        }
    });
}

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

// Close database connection on process termination
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = {
    initializeDatabase,
    createUser,
    getUserByEmail,
    createItem,
    getItemsByUserId,
    updateItem,
    deleteItem,
    getExpiringItems
}; 