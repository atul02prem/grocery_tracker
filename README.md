# Grocery Item Tracker

A web application to track grocery items and their expiration dates.

## Features

- User authentication (signup/login)
- Add, edit, and delete grocery items
- Track purchase and expiration dates
- Get notifications for items expiring soon
- Email alerts for expiring items

## Local Development

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start the server:
```bash
node server.js
```

3. Open http://localhost:3000 in your browser

## Deployment

The application can be deployed to Render.com:

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Use the following settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
4. Deploy!

## Environment Variables

- `PORT`: The port number for the server (default: 3000)
- `NODE_ENV`: The environment (development/production) 