# MongoDB Setup Guide for Windows

## Option 1: Install MongoDB Community Server (Recommended)

### Step 1: Download MongoDB
1. Go to [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Select:
   - Version: Latest (e.g., 7.0.x)
   - Platform: Windows
   - Package: msi
3. Download and run the installer

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Choose "Complete" setup
3. Install MongoDB Compass (GUI tool) - optional but helpful
4. Complete the installation

### Step 3: Start MongoDB Service
After installation, MongoDB should start automatically. If not:

#### Method A: Using Windows Services
1. Open Windows Services (press Win + R, type `services.msc`)
2. Find "MongoDB Server"
3. Right-click → Start

#### Method B: Using Command Line
```cmd
# Navigate to MongoDB installation directory (usually)
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB
mongod
```

### Step 4: Verify Installation
Open Command Prompt and run:
```cmd
mongod --version
```

### Step 5: Create Database
The database will be created automatically when you first connect to it. No manual setup needed.

## Option 2: Use MongoDB Atlas (Cloud Database)

### Step 1: Create Free Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account

### Step 3: Create Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (free tier)
3. Select a cloud provider and region
4. Leave cluster name as default or change it
5. Click "Create Cluster"

### Step 4: Create Database User
1. Go to "Database Access" → "Add New Database User"
2. Enter username and password
3. Give "Read and write to any database" permission
4. Click "Add User"

### Step 5: Configure Network Access
1. Go to "Network Access" → "Add IP Address"
2. Choose "Allow access from anywhere" (0.0.0.0/0)
3. Click "Confirm"

### Step 6: Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password

### Step 7: Update Environment Files
Update the `MONGODB_URI` in your `.env.local` files:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrms_local?retryWrites=true&w=majority
```

## Quick Test

After setting up MongoDB, test the connection:

```cmd
# If using local MongoDB
mongo hrms_local

# If using MongoDB Atlas
# Use MongoDB Compass to connect with your connection string
```

## Troubleshooting

### Local MongoDB Issues
- **Service not starting**: Check Windows Services
- **Port 27017 in use**: Kill existing MongoDB processes or change port
- **Permission denied**: Run Command Prompt as Administrator

### MongoDB Atlas Issues
- **Connection refused**: Check IP whitelist
- **Authentication failed**: Verify username/password
- **Network timeout**: Check firewall settings

## Recommendation

For local development, **Option 1 (Local MongoDB)** is recommended because:
- Faster connection speeds
- No internet dependency
- Easier debugging
- Free and unlimited storage

Choose MongoDB Atlas only if:
- You need cloud access from multiple machines
- You want to test cloud features
- Local installation is not possible
