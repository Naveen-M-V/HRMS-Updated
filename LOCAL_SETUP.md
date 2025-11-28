# HRMS Local Development Setup

## Overview
This guide will help you set up the HRMS application for local development on localhost.

## Prerequisites

### 1. MongoDB Setup
You have two options for MongoDB:

#### Option A: Local MongoDB (Recommended for Development)
1. Install MongoDB Community Server on your machine
2. Start MongoDB service
3. Create a database named `hrms_local`

#### Option B: MongoDB Atlas (Cloud Database)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database named `hrms_local`
4. Get your connection string and update the `.env.local` file

### 2. Node.js
Ensure you have Node.js (v14 or higher) installed on your machine.

## Setup Steps

### 1. Environment Configuration
The project now includes `.env.local` files for localhost development:

- **Root**: `/.env.local`
- **Backend**: `/backend/.env.local` 
- **Frontend**: `/frontend/.env.local`

#### Key Environment Variables:
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Backend port (5003)
- `JWT_SECRET`: Secret for JWT tokens
- `SESSION_SECRET`: Secret for sessions
- `EMAIL_*`: Email configuration (optional for development)

### 2. Database Setup
If using local MongoDB:
```bash
# Start MongoDB service
mongod

# Create database (optional - will be created automatically)
# The database will be created when you first start the application
```

If using MongoDB Atlas:
1. Update `MONGODB_URI` in the `.env.local` files with your Atlas connection string
2. Example format: `mongodb+srv://username:password@cluster.mongodb.net/hrms_local?retryWrites=true&w=majority`

### 3. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies  
```bash
cd frontend
npm install
```

### 4. Start the Application

#### Option A: Use the Startup Scripts
- **Windows**: Run `start-local.bat`
- **Mac/Linux**: Run `start-local.sh`

#### Option B: Start Manually
Start Backend:
```bash
cd backend
npm start
```

Start Frontend (in a new terminal):
```bash
cd frontend
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5003

## Database Schema Compatibility

### ✅ Your Existing DB Schemas Will Work
Your MongoDB schemas are **database-agnostic** and will work perfectly with localhost:

- **Profile Schema**: Employee profiles with all fields intact
- **User Schema**: Authentication and user management
- **Certificate Schema**: Certificate tracking and management
- **Notification Schema**: In-app notifications
- **All other schemas**: Job roles, teams, rotas, etc.

### What Changes When Moving to Localhost:
1. **Database Location**: From staging server to your local MongoDB instance
2. **Data**: You'll start with a fresh database (no staging data)
3. **Configuration**: Environment variables point to localhost instead of staging

### Data Migration (Optional):
If you want to copy data from staging to localhost:
1. Export data from staging MongoDB
2. Import into your local `hrms_local` database
3. All your schemas and logic will work identically

## Email Configuration (Development)

For development, you can:
1. Use the test email settings in `.env.local`
2. Set `MOCK_EMAIL_SENDING=true` to disable actual email sending
3. Configure with a real Gmail account for testing

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (if using local)
- Check the `MONGODB_URI` in `.env.local`
- Verify network access (if using MongoDB Atlas)

### Port Conflicts
- Backend uses port 5003
- Frontend uses port 3000
- Change ports in `.env.local` if needed

### Environment Variables Not Loading
- Ensure `.env.local` files are in the correct directories
- Check that the files are named exactly `.env.local`
- Restart servers after making changes

## Development Features Enabled

The following development features are enabled in `.env.local`:
- Debug logging
- Test routes
- Mock email sending
- Enhanced error messages
- CORS for localhost

## Next Steps

1. Set up MongoDB (local or Atlas)
2. Configure email settings (optional)
3. Install dependencies
4. Start the application
5. Access http://localhost:3000 to begin development

Your existing database schemas and application logic will work seamlessly with the localhost setup!
