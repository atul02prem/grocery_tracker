const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const db = require('./db');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        await db.initializeDatabase();
        console.log('Database initialized successfully');

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

        // Add new endpoint for updating user details
        app.put('/api/users/:userId', async (req, res) => {
            try {
                const { firstName, lastName } = req.body;
                const userId = req.params.userId;
                
                if (!firstName || !lastName) {
                    return res.status(400).json({ 
                        success: false, 
                        message: "First name and last name are required." 
                    });
                }

                const success = await db.updateUser(userId, firstName, lastName);
                if (!success) {
                    return res.status(404).json({ 
                        success: false, 
                        message: "User not found." 
                    });
                }

                res.json({ 
                    success: true, 
                    message: "User details updated successfully.",
                    user: {
                        id: userId,
                        firstName,
                        lastName
                    }
                });
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    message: "Error updating user: " + error.message 
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

        // Add new endpoint for sending expiration alerts
        app.post('/api/items/:userId/send-alerts', async (req, res) => {
            try {
                const userId = req.params.userId;
                console.log('Fetching user with ID:', userId);
                const user = await db.getUserById(userId);
                
                if (!user) {
                    console.log('User not found:', userId);
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                console.log('User found:', user.email);
                const expiringItems = await db.getExpiringItems(userId);
                console.log('Expiring items:', expiringItems);
                
                if (expiringItems.length === 0) {
                    return res.json({
                        success: true,
                        message: "No items expiring soon"
                    });
                }

                // Create email content
                const emailContent = `
                    <h2>Grocery Items Expiring Soon</h2>
                    <p>The following items in your grocery list are expiring soon:</p>
                    <ul>
                        ${expiringItems.map(item => `
                            <li>${item.itemName} - Expires on ${new Date(item.expirationDate).toLocaleDateString()}</li>
                        `).join('')}
                    </ul>
                    <p>Please check your items and take necessary action.</p>
                `;

                try {
                    console.log('Attempting to send email to:', user.email);
                    
                    // First, try to activate the email
                    try {
                        await axios.post(`https://formsubmit.co/activate/${encodeURIComponent(user.email)}`, {
                            email: user.email
                        });
                        console.log('Email activation successful');
                    } catch (activationError) {
                        console.log('Email activation response:', activationError.response?.status);
                        // If activation fails with 404, that's okay - the email will still be sent
                        if (activationError.response?.status !== 404) {
                            throw activationError;
                        }
                    }

                    // Then send the actual email using FormSubmit's API endpoint
                    const formSubmitResponse = await axios({
                        method: 'post',
                        url: `https://formsubmit.co/api/el/${encodeURIComponent(user.email)}`,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        data: {
                            _subject: 'Grocery Items Expiring Soon!',
                            _template: 'table',
                            _autoresponse: 'Your expiration alerts have been sent successfully.',
                            _captcha: 'true',
                            email: user.email,
                            name: `${user.first_name} ${user.last_name}`,
                            message: emailContent
                        }
                    });

                    console.log('FormSubmit response:', formSubmitResponse.data);

                    if (formSubmitResponse.data.success) {
                        res.json({
                            success: true,
                            message: "Expiration alerts sent successfully. Please check your email for confirmation."
                        });
                    } else {
                        throw new Error('Failed to send email through FormSubmit');
                    }
                } catch (formSubmitError) {
                    console.error('FormSubmit error:', {
                        message: formSubmitError.message,
                        response: formSubmitError.response?.data,
                        status: formSubmitError.response?.status
                    });

                    // If it's a 404, it means the email needs to be activated
                    if (formSubmitError.response?.status === 404) {
                        res.json({
                            success: true,
                            message: "Please check your email for a confirmation link. After confirming your email, you'll receive the expiration alerts."
                        });
                    } else {
                        throw new Error('Failed to send email: ' + (formSubmitError.response?.data?.message || formSubmitError.message));
                    }
                }
            } catch (error) {
                console.error('Error sending alerts:', error);
                res.status(500).json({
                    success: false,
                    message: "Error sending expiration alerts: " + error.message
                });
            }
        });

        // Health check endpoint
        app.get('/api/health', (req, res) => {
          res.status(200).json({ status: 'ok' });
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

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({
                success: false,
                message: 'Something went wrong!',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err);
            // Don't exit the process, just log the error
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // Don't exit the process, just log the error
        });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Open http://localhost:${PORT} in your browser`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer(); 