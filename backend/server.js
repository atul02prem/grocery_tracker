const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// User Authentication Endpoints
app.post('/api/users/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Email already registered." 
            });
        }

        // Create new user
        const userId = await db.createUser(firstName, lastName, email, password);
        res.json({ 
            success: true, 
            user: { id: userId, firstName, lastName, email } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error creating user: " + error.message 
        });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.getUserByEmail(email);
        
        if (!user || user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password." 
            });
        }

        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                firstName: user.first_name, 
                lastName: user.last_name, 
                email: user.email 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error logging in: " + error.message 
        });
    }
});

// Grocery Item Endpoints
app.post('/api/items', async (req, res) => {
    try {
        const { userId, itemName, purchaseDate, expirationDate } = req.body;
        
        // Validate dates
        if (new Date(purchaseDate) > new Date(expirationDate)) {
            return res.status(400).json({ 
                success: false, 
                message: "Expiration date cannot be before purchase date." 
            });
        }

        const itemId = await db.createItem(userId, itemName, purchaseDate, expirationDate);
        res.json({ 
            success: true, 
            item: { 
                id: itemId, 
                itemName, 
                purchaseDate, 
                expirationDate 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error creating item: " + error.message 
        });
    }
});

app.get('/api/items/:userId', async (req, res) => {
    try {
        const items = await db.getItemsByUserId(req.params.userId);
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error getting items: " + error.message 
        });
    }
});

app.put('/api/items/:itemId', async (req, res) => {
    try {
        const { userId, itemName, purchaseDate, expirationDate } = req.body;
        
        // Validate dates
        if (new Date(purchaseDate) > new Date(expirationDate)) {
            return res.status(400).json({ 
                success: false, 
                message: "Expiration date cannot be before purchase date." 
            });
        }

        const success = await db.updateItem(
            req.params.itemId, 
            userId, 
            itemName, 
            purchaseDate, 
            expirationDate
        );

        if (!success) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found or unauthorized." 
            });
        }

        res.json({ 
            success: true, 
            message: "Item updated successfully." 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error updating item: " + error.message 
        });
    }
});

app.delete('/api/items/:itemId', async (req, res) => {
    try {
        const { userId } = req.body;
        const success = await db.deleteItem(req.params.itemId, userId);

        if (!success) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found or unauthorized." 
            });
        }

        res.json({ 
            success: true, 
            message: "Item deleted successfully." 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error deleting item: " + error.message 
        });
    }
});

app.get('/api/items/:userId/expiring', async (req, res) => {
    try {
        const items = await db.getExpiringItems(req.params.userId);
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Error getting expiring items: " + error.message 
        });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve other HTML files
app.get('/:page', (req, res) => {
    const page = req.params.page;
    if (['dashboard', 'signup', 'add-item', 'edit-item'].includes(page)) {
        res.sendFile(path.join(__dirname, '..', `${page}.html`));
    } else {
        res.status(404).send('Page not found');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
}); 