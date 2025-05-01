const Database = require('better-sqlite3');
const db = new Database('grocery.db');

// Initialize database
db.exec(`
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_items_user_id ON grocery_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_items_expiration ON grocery_items(expiration_date);
`);

// Prepare statements
const createUser = db.prepare('INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)');
const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const createItem = db.prepare('INSERT INTO grocery_items (user_id, item_name, purchase_date, expiration_date) VALUES (?, ?, ?, ?)');
const getItemsByUserId = db.prepare('SELECT * FROM grocery_items WHERE user_id = ? ORDER BY expiration_date ASC');
const updateItem = db.prepare('UPDATE grocery_items SET item_name = ?, purchase_date = ?, expiration_date = ? WHERE id = ? AND user_id = ?');
const deleteItem = db.prepare('DELETE FROM grocery_items WHERE id = ? AND user_id = ?');
const getExpiringItems = db.prepare(`
    SELECT * FROM grocery_items 
    WHERE user_id = ? 
    AND expiration_date <= date('now', '+' || ? || ' days')
    AND expiration_date >= date('now')
    ORDER BY expiration_date ASC
`);

module.exports = {
    createUser: (firstName, lastName, email, password) => {
        try {
            const result = createUser.run(firstName, lastName, email, password);
            return result.lastInsertRowid;
        } catch (error) {
            throw new Error('Error creating user: ' + error.message);
        }
    },

    getUserByEmail: (email) => {
        try {
            return getUserByEmail.get(email);
        } catch (error) {
            throw new Error('Error getting user: ' + error.message);
        }
    },

    createItem: (userId, itemName, purchaseDate, expirationDate) => {
        try {
            const result = createItem.run(userId, itemName, purchaseDate, expirationDate);
            return result.lastInsertRowid;
        } catch (error) {
            throw new Error('Error creating item: ' + error.message);
        }
    },

    getItemsByUserId: (userId) => {
        try {
            return getItemsByUserId.all(userId);
        } catch (error) {
            throw new Error('Error getting items: ' + error.message);
        }
    },

    updateItem: (itemId, userId, itemName, purchaseDate, expirationDate) => {
        try {
            const result = updateItem.run(itemName, purchaseDate, expirationDate, itemId, userId);
            return result.changes > 0;
        } catch (error) {
            throw new Error('Error updating item: ' + error.message);
        }
    },

    deleteItem: (itemId, userId) => {
        try {
            const result = deleteItem.run(itemId, userId);
            return result.changes > 0;
        } catch (error) {
            throw new Error('Error deleting item: ' + error.message);
        }
    },

    getExpiringItems: (userId, daysThreshold = 3) => {
        try {
            return getExpiringItems.all(userId, daysThreshold);
        } catch (error) {
            throw new Error('Error getting expiring items: ' + error.message);
        }
    }
}; 