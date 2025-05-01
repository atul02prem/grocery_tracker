const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'data', 'grocery.db'));
    }

    // User operations
    async createUser(firstName, lastName, email, hashedPassword) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (first_name, last_name, email, password) 
                        VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [firstName, lastName, email, hashedPassword], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            this.db.get(sql, [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Grocery item operations
    async createItem(userId, itemName, purchaseDate, expirationDate) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO grocery_items (user_id, item_name, purchase_date, expiration_date) 
                        VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [userId, itemName, purchaseDate, expirationDate], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getItemsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM grocery_items WHERE user_id = ? ORDER BY expiration_date ASC';
            this.db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async updateItem(itemId, userId, itemName, purchaseDate, expirationDate) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE grocery_items 
                        SET item_name = ?, purchase_date = ?, expiration_date = ? 
                        WHERE id = ? AND user_id = ?`;
            this.db.run(sql, [itemName, purchaseDate, expirationDate, itemId, userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    async deleteItem(itemId, userId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM grocery_items WHERE id = ? AND user_id = ?';
            this.db.run(sql, [itemId, userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    async getExpiringItems(userId, daysThreshold = 3) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM grocery_items 
                        WHERE user_id = ? 
                        AND expiration_date <= date('now', '+' || ? || ' days')
                        AND expiration_date >= date('now')
                        ORDER BY expiration_date ASC`;
            this.db.all(sql, [userId, daysThreshold], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new Database(); 