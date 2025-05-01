// script.js

// Utility: Get query parameters from URL
function getQueryParams() {
    const params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function(str, key, value) {
        params[key] = value;
    });
    return params;
}

// Add this at the top of your file, after the existing code
console.log('Script loaded successfully');

// ------------------------------
// User Authentication Functions
// ------------------------------
async function signupUser(user) {
    try {
        console.log('Attempting to signup with:', { email: user.email });
        const response = await fetch(`${config.apiUrl}/users/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Signup response:', data);
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        }
        return data;
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: "Error connecting to server." };
    }
}

async function loginUser(email, password) {
    try {
        console.log('Attempting to login with:', { email });
        const response = await fetch(`${config.apiUrl}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Login response:', data);
        if (data.success) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            const loginMessage = document.getElementById('loginMessage');
            if (loginMessage) {
                loginMessage.textContent = data.message || 'Login failed';
            }
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        const loginMessage = document.getElementById('loginMessage');
        if (loginMessage) {
            loginMessage.textContent = 'Error connecting to server';
        }
        return { success: false, message: "Error connecting to server." };
    }
}

function logoutUser() {
    localStorage.removeItem('currentUser');
}

function checkAuth() {
    return localStorage.getItem('currentUser') ? true : false;
}

function requireAuth() {
    if(!checkAuth()) {
        window.location.href = 'index.html';
    }
}

// ------------------------------
// Grocery Item Functions (User-Specific)
// ------------------------------
function getCurrentUserEmail() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser ? currentUser.email : null;
}

async function getItems() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            console.log('No current user found');
            return [];
        }
        
        console.log('Fetching items for user:', currentUser.id);
        const response = await fetch(`${config.apiUrl}/items/${currentUser.id}`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Items response:', data);
        
        if (!data.success) {
            console.error('API returned error:', data.message);
            return [];
        }
        
        if (!Array.isArray(data.items)) {
            console.error('API did not return an array of items:', data);
            return [];
        }
        
        return data.items;
    } catch (error) {
        console.error('Error fetching items:', error);
        return [];
    }
}

async function addItem(item) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) return { success: false, message: "Not authenticated" };

        const response = await fetch(`${config.apiUrl}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...item, userId: currentUser.id })
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: "Error connecting to server." };
    }
}

async function updateItem(updatedItem) {
    try {
        const response = await fetch(`${config.apiUrl}/items/${updatedItem.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedItem)
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: "Error connecting to server." };
    }
}

async function deleteItem(id) {
    try {
        const response = await fetch(`${config.apiUrl}/items/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: "Error connecting to server." };
    }
}

// ------------------------------
// Notification Functions
// ------------------------------
async function displayNotifications() {
    try {
        const items = await getItems();
        const notifications = items.filter(item => {
            const expDate = new Date(item.expirationDate);
            const now = new Date();
            const diffTime = expDate - now;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays <= 3 && diffDays >= 0;
        });
        
        const notificationArea = document.getElementById('notificationArea');
        if(notificationArea) {
            notificationArea.innerHTML = '';
            if(notifications.length > 0) {
                notifications.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'notification';
                    div.textContent = `${item.itemName} is expiring soon on ${item.expirationDate}`;
                    notificationArea.appendChild(div);
                });
            }
        }
    } catch (error) {
        console.error('Error displaying notifications:', error);
    }
}

// ------------------------------
// Page Event Listeners
// ------------------------------
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM Content Loaded');
    
    // Logout button
    let logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        console.log('Logout button found');
        logoutBtn.addEventListener('click', function() {
            console.log('Logout button clicked');
            logoutUser();
            window.location.href = 'index.html';
        });
    }

    // Login form
    let loginForm = document.getElementById('loginForm');
    if(loginForm) {
        console.log('Login form found');
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginMessage = document.getElementById('loginMessage');
            
            try {
                const result = await loginUser(email, password);
                if (!result.success) {
                    loginMessage.textContent = result.message || 'Login failed';
                }
            } catch (error) {
                console.error('Login form error:', error);
                loginMessage.textContent = 'An error occurred during login';
            }
        });
    }

    // Signup form
    let signupForm = document.getElementById('signupForm');
    if(signupForm) {
        console.log('Signup form found');
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Signup form submitted');
            const user = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            const signupMessage = document.getElementById('signupMessage');
            
            try {
                const result = await signupUser(user);
                if (!result.success) {
                    signupMessage.textContent = result.message || 'Signup failed';
                }
            } catch (error) {
                console.error('Signup form error:', error);
                signupMessage.textContent = 'An error occurred during signup';
            }
        });
    }

    // Add Item form
    let addItemForm = document.getElementById('addItemForm');
    if(addItemForm) {
        console.log('Add item form found');
        requireAuth();
        addItemForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Add item form submitted');
            const itemName = document.getElementById('itemName').value;
            const purchaseDate = document.getElementById('purchaseDate').value;
            const expirationDate = document.getElementById('expirationDate').value;
            const addItemMessage = document.getElementById('addItemMessage');

            if(!itemName || !purchaseDate || !expirationDate) {
                addItemMessage.textContent = "All fields are required.";
                return;
            }

            if(new Date(purchaseDate) > new Date(expirationDate)) {
                addItemMessage.textContent = "Expiration date cannot be before purchase date.";
                return;
            }

            try {
                const item = { itemName, purchaseDate, expirationDate };
                const result = await addItem(item);
                if (result.success) {
                    addItemMessage.textContent = "Item added successfully!";
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    addItemMessage.textContent = result.message || 'Failed to add item';
                }
            } catch (error) {
                console.error('Add item error:', error);
                addItemMessage.textContent = 'An error occurred while adding the item';
            }
        });
    }

    // Edit Item page
    let editItemForm = document.getElementById('editItemForm');
    if(editItemForm) {
        requireAuth();
        let params = getQueryParams();
        let itemId = params.id;
        let items = await getItems();
        let item = items.find(i => i.id == itemId);
        if(item) {
            document.getElementById('editItemId').value = item.id;
            document.getElementById('editItemName').value = item.itemName;
            document.getElementById('editPurchaseDate').value = item.purchaseDate;
            document.getElementById('editExpirationDate').value = item.expirationDate;
        }
        editItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let updatedItem = {
                id: document.getElementById('editItemId').value,
                itemName: document.getElementById('editItemName').value,
                purchaseDate: document.getElementById('editPurchaseDate').value,
                expirationDate: document.getElementById('editExpirationDate').value
            };
            if(new Date(updatedItem.purchaseDate) > new Date(updatedItem.expirationDate)) {
                document.getElementById('editItemMessage').textContent = "Expiration date cannot be before purchase date.";
                return;
            }
            updateItem(updatedItem);
            window.location.href = 'dashboard.html';
        });
    }

    // Dashboard page
    if(document.getElementById('itemsTable')) {
        requireAuth();
        try {
            const items = await getItems();
            console.log('Retrieved items for dashboard:', items);
            
            const tbody = document.querySelector('#itemsTable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                if (Array.isArray(items) && items.length > 0) {
                    items.forEach(item => {
                        console.log('Processing item:', item);
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${item.itemName || 'N/A'}</td>
                            <td>${item.purchaseDate || 'N/A'}</td>
                            <td>${item.expirationDate || 'N/A'}</td>
                            <td>
                                <a href="edit-item.html?id=${item.id}">Edit</a>
                                <button onclick="deleteItemAndRefresh(${item.id})">Delete</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    const tr = document.createElement('tr');
                    tr.innerHTML = '<td colspan="4">No items found</td>';
                    tbody.appendChild(tr);
                }
            }
            await displayNotifications();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            const tbody = document.querySelector('#itemsTable tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4">Error loading items</td></tr>';
            }
        }
    }

    // Dynamic Email Sending for Dashboard
    let emailForm = document.getElementById('emailForm');
    if(emailForm) {
        requireAuth();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if(!currentUser || !currentUser.email) {
            console.error("No logged-in user found");
            return;
        }

        emailForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const items = await getItems();
                console.log('Items for email:', items);
                
                if (!Array.isArray(items)) {
                    console.error('Items is not an array:', items);
                    return;
                }

                const today = new Date();
                const soonExpiring = items.filter(item => {
                    const expiry = new Date(item.expirationDate);
                    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    return diffDays <= 3 && diffDays >= 0;
                });

                const message = soonExpiring.length > 0
                    ? soonExpiring.map(item => `- ${item.itemName} (expires on ${item.expirationDate})`).join('\n')
                    : "No grocery items are expiring in the next 3 days.";

                const messageBox = document.getElementById('messageBox');
                messageBox.value = message;

                // Create a hidden form to submit to Formsubmit.co dynamically
                const dynamicForm = document.createElement('form');
                dynamicForm.method = 'POST';
                dynamicForm.action = `https://formsubmit.co/${encodeURIComponent(currentUser.email)}`;
                dynamicForm.style.display = 'none';

                const subjectInput = document.createElement('input');
                subjectInput.type = 'hidden';
                subjectInput.name = '_subject';
                subjectInput.value = 'Grocery Items Expiring Soon!';
                dynamicForm.appendChild(subjectInput);

                const templateInput = document.createElement('input');
                templateInput.type = 'hidden';
                templateInput.name = '_template';
                templateInput.value = 'box';
                dynamicForm.appendChild(templateInput);

                const messageInput = document.createElement('textarea');
                messageInput.name = 'message';
                messageInput.value = message;
                dynamicForm.appendChild(messageInput);

                document.body.appendChild(dynamicForm);
                dynamicForm.submit();
                document.body.removeChild(dynamicForm);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        });
    }

    // Profile update form
    let updateProfileForm = document.getElementById('updateProfileForm');
    if(updateProfileForm) {
        console.log('Profile form found');
        requireAuth();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if(!currentUser) {
            console.error('No current user found');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('Current user:', currentUser);
        
        // Pre-fill the form with current user data
        document.getElementById('firstName').value = currentUser.firstName || '';
        document.getElementById('lastName').value = currentUser.lastName || '';
        document.getElementById('email').value = currentUser.email || '';

        updateProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Profile update form submitted');
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const updateMessage = document.getElementById('updateMessage');

            if(!firstName || !lastName) {
                updateMessage.textContent = "First name and last name are required";
                updateMessage.style.color = "red";
                return;
            }

            try {
                const result = await updateUserProfile(currentUser.id, firstName, lastName);
                if (result.success) {
                    updateMessage.textContent = "Profile updated successfully!";
                    updateMessage.style.color = "green";
                    
                    // Update the stored user data
                    currentUser.firstName = firstName;
                    currentUser.lastName = lastName;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                } else {
                    updateMessage.textContent = result.message || 'Failed to update profile';
                    updateMessage.style.color = "red";
                }
            } catch (error) {
                console.error('Profile update error:', error);
                updateMessage.textContent = 'An error occurred while updating profile';
                updateMessage.style.color = "red";
            }
        });
    }
});

// Helper for Delete button
function deleteItemAndRefresh(id) {
    if(confirm("Are you sure you want to delete this item?")) {
        deleteItem(id);
        window.location.reload();
    }
}

// Add this function after the other user-related functions
async function updateUserProfile(userId, firstName, lastName) {
    try {
        console.log('Updating profile for user:', userId);
        const response = await fetch(`${config.apiUrl}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName })
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Update response:', data);
        return data;
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, message: "Error connecting to server." };
    }
}