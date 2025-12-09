# Fix: Employment Tab Blank Page & Server Not Reflecting Changes

## ✅ WHAT WAS FIXED

Added the missing `role` field to the Employment tab in EditEmployeeProfile.js:
- Added role selector dropdown (employee, manager, senior-manager, hr, admin, super-admin)
- Added role to formData state initialization

---

## 🚀 HOW TO DEPLOY

### Quick Deploy Commands (Copy & Paste)

```bash
# 1. SSH to server
ssh root@65.21.71.57

# 2. Stop backend
pm2 stop hrms-backend

# 3. Pull code
cd /root/hrms-updated
git pull origin main

# 4. Build frontend
cd frontend
npm run build

# 5. Copy to nginx (CRITICAL STEP!)
rm -rf /var/www/hrms-frontend/*
cp -r build/* /var/www/hrms-frontend/

# 6. Verify copied
ls -lh /var/www/hrms-frontend/

# 7. Restart backend
pm2 restart hrms-backend

# 8. Check status
pm2 status
pm2 logs hrms-backend --lines 20
```

### After deploying, clear browser cache:
- Press **Ctrl + Shift + R** (hard reload)
- Or Right-click reload → "Empty Cache and Hard Reload"

---

## 🔍 WHY WASN'T IT REFLECTING?

### Problem 1: Build not copied to nginx
- You built locally, but didn't copy `build/` to `/var/www/hrms-frontend/`
- Nginx serves from `/var/www/hrms-frontend/`, not from `/root/hrms-updated/frontend/build/`

### Problem 2: Browser cache
- Old JavaScript files cached
- Need hard reload (Ctrl + Shift + R)

### Problem 3: Backend not restarted
- Code pulled but process still running old code
- Need `pm2 restart hrms-backend`

---

## ✅ VERIFY DEPLOYMENT

```bash
# Check frontend files exist
ls -lh /var/www/hrms-frontend/static/js/
# Should show main.*.js files with today's date

# Check backend is running
pm2 status
# Should show hrms-backend as "online" with recent restart time

# Check no errors
pm2 logs hrms-backend --err --lines 20
```

---

## 🎯 EXPECTED RESULT

After deployment + hard reload:
1. ✅ Employment tab loads (not blank)
2. ✅ Shows all employment fields
3. ✅ Shows NEW "Role / Authority Level" dropdown
4. ✅ Can edit and save employee role

---

**Critical Step:** Always run `cp -r build/* /var/www/hrms-frontend/` after building!
