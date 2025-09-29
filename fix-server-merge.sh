#!/bin/bash

echo "=== Fixing Git Merge Conflict on Production Server ==="
echo "Current directory: $(pwd)"

# Step 1: Stash any local changes
echo "Step 1: Stashing local changes..."
git stash

# Step 2: Pull latest changes
echo "Step 2: Pulling latest changes from main..."
git pull origin main

# Step 3: Update .gitignore to prevent future issues
echo "Step 3: Updating .gitignore..."
cat >> .gitignore << EOF

# Cache files
frontend/node_modules/.cache/
frontend/.eslintcache
*.cache
.cache/

# Node modules (if not already ignored)
node_modules/
frontend/node_modules/

# Build files
frontend/build/
backend/uploads/temp/

# Environment files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

EOF

# Step 4: Remove cache files from git tracking
echo "Step 4: Removing cache files from git tracking..."
git rm -r --cached frontend/node_modules/.cache/ 2>/dev/null || echo "Cache directory not tracked"
git rm -r --cached frontend/node_modules/ 2>/dev/null || echo "Node modules not tracked"
git rm --cached frontend/.eslintcache 2>/dev/null || echo "ESLint cache not tracked"

# Step 5: Clean up any large files
echo "Step 5: Cleaning up large files..."
find . -name "*.cache" -type f -delete 2>/dev/null || true
find . -name ".eslintcache" -type f -delete 2>/dev/null || true

# Step 6: Commit .gitignore changes
echo "Step 6: Committing .gitignore updates..."
git add .gitignore
git commit -m "Update .gitignore to exclude cache files and prevent merge conflicts" || echo "No changes to commit"

# Step 7: Install/update dependencies if needed
echo "Step 7: Checking dependencies..."
cd backend
npm install --production
cd ../frontend
npm install --production
cd ..

# Step 8: Restart PM2 services
echo "Step 8: Restarting PM2 services..."
pm2 restart all

# Step 9: Show PM2 status
echo "Step 9: Checking PM2 status..."
pm2 status

echo "=== Fix completed! ==="
echo "Your HRMS application should now be running with the latest changes."
echo "The admin profile editing issue should be resolved."
