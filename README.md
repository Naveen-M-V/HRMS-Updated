# HRMS (Human Resource Management System)

A complete full-stack web application for managing employee profiles, certificates, and compliance tracking with automated notifications.

## 🚀 Features

### Frontend (React)
- **Authentication System**: Login/Signup with JWT tokens
- **Profile Management**: Create, view, edit, and delete employee profiles
- **Certificate Management**: Track certificates with expiry dates and categories
- **Compliance Dashboard**: Real-time analytics and statistics
- **Responsive Design**: Modern UI with Tailwind CSS
- **Navigation**: React Router with protected routes

### Backend (Node.js/Express)
- **RESTful API**: Complete CRUD operations for profiles and certificates
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Multer for profile picture uploads
- **Email Notifications**: Automated certificate expiry alerts
- **Scheduled Tasks**: Daily certificate expiry checks with node-cron
- **Input Validation**: Comprehensive validation and error handling

## 📁 Project Structure

```
hrms/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env.example          # Environment variables template
│   └── uploads/              # File upload directory
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── context/         # Context providers (Auth, Profile, Certificate)
    │   ├── pages/           # Page components
    │   └── data/            # Static data and mappings
    ├── public/              # Static assets
    └── package.json         # Frontend dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/hrms
PORT=5003
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CORS_ORIGIN=http://localhost:3000
```

5. Start the backend server:
```bash
npm start
# or
node server.js
```

The backend will be available at `http://localhost:5003`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Profiles
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:id` - Get profile by ID
- `POST /api/profiles` - Create new profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile
- `POST /api/profiles/:id/upload-picture` - Upload profile picture
- `GET /api/profiles/:id/stats` - Get profile statistics

### Certificates
- `GET /api/certificates` - Get all certificates
- `GET /api/certificates/:id` - Get certificate by ID
- `POST /api/certificates` - Create new certificate
- `PUT /api/certificates/:id` - Update certificate
- `DELETE /api/certificates/:id` - Delete certificate
- `GET /api/profiles/:profileId/certificates` - Get certificates by profile

### Analytics
- `GET /api/certificates/analytics/stats` - Dashboard statistics
- `GET /api/certificates/analytics/by-category` - Certificates by category
- `GET /api/certificates/analytics/by-job-role` - Certificates by job role
- `GET /api/certificates/expiring/:days?` - Expiring certificates
- `GET /api/certificates/expired` - Expired certificates

### Notifications
- `GET /api/notifications/:userId` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `POST /api/notifications/check-expiry` - Manual expiry check

## 🗄️ Database Schema

### User Schema
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (default: 'user'),
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Profile Schema
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  mobile: String,
  jobTitle: String,
  company: String,
  role: String,
  staffType: String,
  address: Object,
  emergencyContact: Object,
  createdOn: Date,
  lastSeen: Date,
  isActive: Boolean,
  emailVerified: Boolean,
  mobileVerified: Boolean
}
```

### Certificate Schema
```javascript
{
  certificate: String (required),
  category: String (required),
  jobRole: String,
  profileId: ObjectId (ref: Profile),
  profileName: String,
  issueDate: String,
  expiryDate: String,
  provider: String,
  status: String,
  active: String,
  cost: String,
  createdOn: Date,
  updatedOn: Date
}
```

## 🔐 Default Credentials

A default admin user is created automatically:
- **Email**: admin@talentshield.com
- **Password**: admin123

## 🚨 Key Integration Features

### Removed Mock Data
- All placeholder/mock data has been removed from frontend contexts
- Frontend now relies entirely on real API calls
- Proper error handling for failed API requests

### Enhanced Backend
- Added missing fields to Certificate schema (category, jobRole)
- Implemented comprehensive input validation
- Added dashboard analytics endpoints
- Improved error handling and security
- Environment variable configuration

### Real-time Features
- Automated certificate expiry checking (daily at 9 AM)
- Email notifications for expiring/expired certificates
- Dashboard analytics with live data

## 🧪 Testing the Integration

1. **Start both servers** (backend on :5003, frontend on :3000)

2. **Test Authentication**:
   - Navigate to login page
   - Use default credentials or create new account
   - Verify JWT token storage and authentication flow

3. **Test Profile Management**:
   - Create new employee profiles
   - Upload profile pictures
   - Edit and delete profiles

4. **Test Certificate Management**:
   - Add certificates with categories and job roles
   - Set expiry dates to test notifications
   - Update and delete certificates

5. **Test Dashboard Analytics**:
   - View real-time certificate statistics
   - Check category and job role breakdowns
   - Verify expiring/expired certificate alerts

## 🔧 Troubleshooting

### Common Issues

1. **Backend won't start (EADDRINUSE)**:
   - Port 5003 is already in use
   - Kill existing process or change PORT in .env

2. **MongoDB connection failed**:
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file

3. **Frontend API calls fail**:
   - Verify backend is running on correct port
   - Check CORS configuration
   - Verify API_BASE_URL in frontend contexts

4. **Email notifications not working**:
   - Configure EMAIL_USER and EMAIL_PASS in .env
   - Use app-specific passwords for Gmail

## 🚀 Production Deployment

### Security Checklist
- [ ] Change JWT_SECRET to a strong, unique value
- [ ] Configure proper email credentials
- [ ] Set up MongoDB with authentication
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production

### Environment Variables
Ensure all sensitive data is in environment variables:
- Database credentials
- JWT secrets
- Email configuration
- API keys

## 📝 Development Notes

### Architecture Decisions
- **Frontend**: React with Context API for state management
- **Backend**: Express.js with MongoDB for scalability
- **Authentication**: JWT tokens with localStorage storage
- **File Uploads**: Multer with local storage
- **Notifications**: Node-cron for scheduled tasks

### Code Quality
- Input validation on both frontend and backend
- Error handling with proper HTTP status codes
- Consistent API response format
- Clean separation of concerns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
