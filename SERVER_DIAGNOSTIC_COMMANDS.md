# 🔍 Server Diagnostic Commands

Run these commands on your server to find out what's happening:

## 1️⃣ **Check All PM2 Processes**

```bash
pm2 list
```

**What to look for:**
- If you see any processes listed
- What they're named (might not be "hrms")
- Their status (online/stopped/errored)

**Possible outputs:**

**A) PM2 has processes:**
```
┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ backend  │ fork        │ 15      │ online  │ 0%       │
│ 1   │ frontend │ fork        │ 0       │ stopped │ 0%       │
└─────┴──────────┴─────────────┴─────────┴─────────┴──────────┘
```
→ Backend is running as "backend", not "hrms"

**B) PM2 is empty:**
```
No processes running
```
→ Backend not running in PM2

---

## 2️⃣ **Check if Node is Running**

```bash
ps aux | grep node
```

**What to look for:**
- Any node processes
- Which file they're running (server.js?)
- Their process ID (PID)

**Example output:**
```
root  1234  0.5  2.1  /usr/bin/node /root/hrms/backend/server.js
```
→ Backend is running directly with node (not PM2)

---

## 3️⃣ **Check if Port 5003 is Open**

```bash
netstat -tlnp | grep 5003
# OR
ss -tlnp | grep 5003
# OR
lsof -i :5003
```

**What to look for:**
- If something is listening on port 5003
- What process is using it

**Example output:**
```
tcp  0  0  0.0.0.0:5003  0.0.0.0:*  LISTEN  1234/node
```
→ Node is running on port 5003 (PID 1234)

---

## 4️⃣ **Check Backend Directory**

```bash
cd ~/hrms/backend
ls -la
```

**What to look for:**
- Is server.js there?
- Is .env file there?
- Is node_modules folder there?

---

## 5️⃣ **Check if Backend is Accessible**

```bash
curl http://localhost:5003
# OR
curl http://localhost:5003/api/health
```

**What to look for:**
- Does it respond?
- What's the response?

---

## 6️⃣ **Check PM2 Ecosystem File**

```bash
cd ~/hrms/backend
cat ecosystem.config.js
```

**What to look for:**
- How is the app configured?
- What's the app name?

---

## 7️⃣ **Check System Services**

```bash
systemctl status hrms
# OR
systemctl status backend
# OR
systemctl status node
```

**What to look for:**
- Is there a systemd service running the backend?

---

## 📋 **Run ALL These Commands and Share Results:**

```bash
echo "=== PM2 STATUS ==="
pm2 list

echo ""
echo "=== NODE PROCESSES ==="
ps aux | grep node | grep -v grep

echo ""
echo "=== PORT 5003 ==="
netstat -tlnp | grep 5003

echo ""
echo "=== BACKEND DIRECTORY ==="
cd ~/hrms/backend && ls -la

echo ""
echo "=== BACKEND FILES ==="
cd ~/hrms/backend && ls server.js .env 2>&1

echo ""
echo "=== TEST BACKEND ==="
curl http://localhost:5003 2>&1

echo ""
echo "=== PM2 SAVE LIST ==="
pm2 save --force
```

---

## 🚀 **Common Scenarios & Solutions:**

### **Scenario A: PM2 Shows Different Name**

```bash
pm2 list
# Shows: "backend" or "server" instead of "hrms"

# Solution: Use the correct name
pm2 logs backend --lines 50
pm2 restart backend
```

### **Scenario B: Backend Running Without PM2**

```bash
ps aux | grep node
# Shows: node server.js is running

# Solution: Stop it and start with PM2
pkill -f "node.*server.js"
cd ~/hrms/backend
pm2 start server.js --name hrms
pm2 save
```

### **Scenario C: Nothing Running**

```bash
pm2 list  # Empty
ps aux | grep node  # Nothing

# Solution: Start the backend
cd ~/hrms/backend
pm2 start server.js --name hrms
pm2 save
```

### **Scenario D: Port Already in Use**

```bash
netstat -tlnp | grep 5003
# Shows something else on port 5003

# Solution: Kill old process
kill -9 <PID>
# Then start PM2
pm2 start server.js --name hrms
```

---

## 🔧 **How to Properly Start Backend:**

### **Method 1: Using PM2 (Recommended)**

```bash
# Go to backend directory
cd ~/hrms/backend

# Start with PM2
pm2 start server.js --name hrms

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you

# Check status
pm2 list
pm2 logs hrms --lines 50
```

### **Method 2: Using Ecosystem File**

```bash
cd ~/hrms/backend

# If ecosystem.config.js exists:
pm2 start ecosystem.config.js

# Save
pm2 save

# Check
pm2 list
```

### **Method 3: Direct Node (Not Recommended for Production)**

```bash
cd ~/hrms/backend
node server.js
# This will show logs directly in terminal
# Press Ctrl+C to stop
```

---

## ✅ **Expected Output After Successful Start:**

```bash
pm2 list

# Should show:
┌─────┬──────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name │ mode    │ ↺       │ status  │ cpu      │
├─────┼──────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ hrms │ fork    │ 0       │ online  │ 0%       │
└─────┴──────┴─────────┴─────────┴─────────┴──────────┘

pm2 logs hrms --lines 30

# Should show:
✅ Loaded environment: production from .env
✅ All required environment variables are present
Connected to MongoDB
Creating 6 super admin accounts...
✅ Super admin created: dean.cumming@vitrux.co.uk
Server running on port 5003
```

---

## 📝 **Next Steps:**

1. **Run the diagnostic commands above**
2. **Share the output** so I can see what's happening
3. **Start the backend properly** based on the scenario
4. **Verify it's working**

**Copy and paste this into your SSH terminal:**

```bash
echo "=== PM2 LIST ===" && pm2 list && echo "" && echo "=== NODE PROCESSES ===" && ps aux | grep node | grep -v grep && echo "" && echo "=== PORT 5003 ===" && netstat -tlnp | grep 5003 && echo "" && echo "=== BACKEND EXISTS ===" && ls ~/hrms/backend/server.js
```

**Then share the output!**
