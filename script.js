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

// ------------------------------
// User Authentication Functions
// ------------------------------
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}
function signupUser(user) {
    let users = getUsers();
    if(users.find(u => u.email === user.email)) {
        return { success: false, message: "Email already registered." };
    }
    users.push(user);
    saveUsers(users);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return { success: true };
}
function loginUser(email, password) {
    let users = getUsers();
    let user = users.find(u => u.email === email && u.password === password);
    if(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true };
    }
    return { success: false, message: "Invalid email or password." };
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

function getItems() {
    const email = getCurrentUserEmail();
    if(!email) return [];
    return JSON.parse(localStorage.getItem(`groceryItems_${email}`)) || [];
}

function saveItems(items) {
    const email = getCurrentUserEmail();
    if(!email) return;
    localStorage.setItem(`groceryItems_${email}`, JSON.stringify(items));
}

function addItem(item) {
    let items = getItems();
    item.id = Date.now(); // Unique ID
    items.push(item);
    saveItems(items);
}

function updateItem(updatedItem) {
    let items = getItems();
    items = items.map(item => item.id == updatedItem.id ? updatedItem : item);
    saveItems(items);
}

function deleteItem(id) {
    let items = getItems();
    items = items.filter(item => item.id != id);
    saveItems(items);
}

// ------------------------------
// Notification Functions
// ------------------------------
function displayNotifications() {
    let items = getItems();
    let notifications = items.filter(item => {
        let expDate = new Date(item.expirationDate);
        let now = new Date();
        let diffTime = expDate - now;
        let diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 3 && diffDays >= 0;
    });
    let notificationArea = document.getElementById('notificationArea');
    if(notificationArea) {
        notificationArea.innerHTML = '';
        if(notifications.length > 0) {
            notifications.forEach(item => {
                let div = document.createElement('div');
                div.className = 'notification';
                div.textContent = `${item.itemName} is expiring soon on ${item.expirationDate}`;
                notificationArea.appendChild(div);
            });
        }
    }
}

// ------------------------------
// Page Event Listeners
// ------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Logout button (applies to all pages with nav)
    let logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logoutUser();
            window.location.href = 'index.html';
        });
    }

    // Login page
    let loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let email = document.getElementById('email').value;
            let password = document.getElementById('password').value;
            let result = loginUser(email, password);
            let loginMessage = document.getElementById('loginMessage');
            if(result.success) {
                window.location.href = 'dashboard.html';
            } else {
                loginMessage.textContent = result.message;
            }
        });
    }

    // Signup page
    let signupForm = document.getElementById('signupForm');
    if(signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let user = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            let result = signupUser(user);
            let signupMessage = document.getElementById('signupMessage');
            if(result.success) {
                window.location.href = 'dashboard.html';
            } else {
                signupMessage.textContent = result.message;
            }
        });
    }

    // Add Item page
    let addItemForm = document.getElementById('addItemForm');
    if(addItemForm) {
        requireAuth();
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let itemName = document.getElementById('itemName').value;
            let purchaseDate = document.getElementById('purchaseDate').value;
            let expirationDate = document.getElementById('expirationDate').value;
            let addItemMessage = document.getElementById('addItemMessage');

            if(!itemName || !purchaseDate || !expirationDate) {
                addItemMessage.textContent = "All fields are required.";
                return;
            }

            if(new Date(purchaseDate) > new Date(expirationDate)) {
                addItemMessage.textContent = "Expiration date cannot be before purchase date.";
                return;
            }

            let item = { itemName, purchaseDate, expirationDate };
            addItem(item);
            addItemMessage.textContent = "Item added successfully!";
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000); // Delay to show success message
        });
    }

    // Edit Item page
    let editItemForm = document.getElementById('editItemForm');
    if(editItemForm) {
        requireAuth();
        let params = getQueryParams();
        let itemId = params.id;
        let items = getItems();
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
        let items = getItems();
        let tbody = document.querySelector('#itemsTable tbody');
        tbody.innerHTML = '';
        items.forEach(item => {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.itemName}</td>
                <td>${item.purchaseDate}</td>
                <td>${item.expirationDate}</td>
                <td>
                    <a href="edit-item.html?id=${item.id}">Edit</a>
                    <button onclick="deleteItemAndRefresh(${item.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        displayNotifications();
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

        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const items = getItems();
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