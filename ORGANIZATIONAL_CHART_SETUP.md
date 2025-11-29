# Organizational Chart Feature Implementation

## Overview

This document outlines the implementation of the Organizational Chart feature for the HRMS system. The feature provides a visual representation of the company's reporting structure with interactive hierarchy navigation.

## Architecture

### Backend Components

#### 1. Database Schema
- **Model**: `EmployeeHub` (extended with existing `managerId` field)
- **Self-referencing relationship**: `managerId` references `EmployeeHub._id`
- **Indexes added**:
  - `managerId` - for direct report lookups
  - `{ managerId: 1, isActive: 1, status: 1 }` - compound index for performance
  - `department` - for department filtering
  - `team` - for team filtering

#### 2. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/org-chart` | Fetch complete organizational hierarchy |
| GET | `/api/employees/direct-reports/:managerId` | Get direct reports for a manager |
| PATCH | `/api/employees/:employeeId/manager` | Update employee's manager |

#### 3. Controller Functions

- `getOrganizationalChart()` - Builds nested tree structure
- `getDirectReports()` - Fetches immediate subordinates
- `updateEmployeeManager()` - Updates reporting relationships with circular reference prevention

### Frontend Components

#### 1. Pages
- `OrganizationalChart.js` - Main chart visualization page

#### 2. Features
- **Interactive Tree View**: Expandable/collapsible nodes
- **Employee Cards**: Display avatar, name, role, department, team
- **Search & Filter**: Real-time search by name, role, department
- **Zoom Controls**: Zoom in/out/reset functionality
- **Employee Details Modal**: Click any employee for details
- **Manager Update**: Change reporting relationships
- **Visual Connectors**: Lines showing reporting structure

#### 3. UI Components Used
- React with Tailwind CSS
- Heroicons for icons
- Custom UI components (Select, ConfirmDialog)
- Responsive design

## Installation & Setup

### 1. Backend Setup

#### Database Migration
```bash
cd backend
node scripts/addOrgChartIndexes.js
```

This will:
- Add necessary indexes for performance
- Optionally create sample hierarchical data

#### Verify Routes
The routes are automatically added to `backend/routes/employeeHubRoutes.js`:
```javascript
// Organizational Chart routes
router.get('/org-chart', employeeHubController.getOrganizationalChart);
router.get('/direct-reports/:managerId', employeeHubController.getDirectReports);
router.patch('/:employeeId/manager', employeeHubController.updateEmployeeManager);
```

### 2. Frontend Setup

#### Components Added
- `frontend/src/pages/OrganizationalChart.js` - Main component
- Navigation link in `ModernSidebar.js` under Employees Hub
- Route added to `App.js`

#### Dependencies
No additional dependencies required. Uses existing:
- React 18+
- Axios for API calls
- Heroicons
- Tailwind CSS

## Usage

### 1. Access the Feature
1. Login as admin
2. Navigate to **Employees Hub** → **Organizational Chart**

### 2. Navigation
- **Expand/Collapse**: Click the arrow next to employee count
- **Search**: Use the search bar to find employees
- **Filter**: Filter by department
- **Zoom**: Use zoom controls for large organizations

### 3. Employee Management
- **View Details**: Click any employee card to see details
- **Update Manager**: In details modal, click "Update Manager"
- **Navigate**: Click "View Full Profile" to go to Employee Hub

## Features in Detail

### 1. Hierarchical Tree Structure
- Root nodes: Employees without managers (CEO, Directors)
- Child nodes: Direct reports with visual connectors
- Recursive rendering for unlimited hierarchy levels
- Automatic level-based styling (root nodes highlighted)

### 2. Search and Filtering
- **Real-time search**: Name, role, department, team
- **Department filter**: Dropdown with available departments
- **Combined filtering**: Search + department filter work together

### 3. Employee Cards
- **Avatar**: Profile photo or colored initials
- **Information**: Name, role, department, team
- **Direct reports count**: Shows number of subordinates
- **Manager info**: Shows who they report to

### 4. Interactive Features
- **Expand/Collapse**: Click to show/hide direct reports
- **Zoom controls**: 50% to 200% zoom range
- **Employee selection**: Click to view details
- **Manager updates**: Change reporting relationships

### 5. Performance Optimizations
- **Database indexes**: Optimized queries for large datasets
- **Recursive tree building**: Efficient hierarchy construction
- **Circular reference prevention**: Validates manager assignments
- **Lazy loading**: Only renders visible nodes

## API Response Format

### Get Organizational Chart
```json
{
  "success": true,
  "data": [
    {
      "id": "64a7b8c9d1e2f3g4h5i6j7k8",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "jobTitle": "CEO",
      "department": "Executive",
      "team": "Leadership",
      "email": "john@company.com",
      "avatar": null,
      "initials": "JD",
      "color": "#3B82F6",
      "managerId": null,
      "managerName": null,
      "directReports": [...],
      "directReportsCount": 5
    }
  ],
  "totalEmployees": 150,
  "hierarchyLevels": 4
}
```

### Update Manager
```json
{
  "success": true,
  "message": "Employee manager updated successfully",
  "data": {
    "id": "64a7b8c9d1e2f3g4h5i6j7k8",
    "managerId": "64a7b8c9d1e2f3g4h5i6j7k9",
    "manager": {
      "firstName": "Jane",
      "lastName": "Smith",
      "jobTitle": "CTO"
    }
  }
}
```

## Error Handling

### Backend Errors
- **404**: Employee/Manager not found
- **400**: Circular reporting attempt
- **500**: Server errors with detailed messages

### Frontend Errors
- Network errors with retry suggestions
- Validation errors with user-friendly messages
- Loading states for all async operations

## Security Considerations

### Authentication
- Admin-only access (protected routes)
- Session-based authentication
- Role-based permissions

### Data Validation
- Circular reference prevention
- Manager existence validation
- Employee status validation

### Input Sanitization
- MongoDB injection protection via Mongoose
- XSS prevention in React
- CSRF protection via session management

## Testing

### Sample Data Creation
Run the migration script with sample data option:
```bash
node scripts/addOrgChartIndexes.js
# Press 'y' when prompted for sample data
```

### Manual Testing Checklist
- [ ] Load organizational chart
- [ ] Expand/collapse nodes
- [ ] Search functionality
- [ ] Department filtering
- [ ] Zoom controls
- [ ] Employee details modal
- [ ] Manager update feature
- [ ] Navigation to full profile
- [ ] Responsive design

### Performance Testing
- Test with 100+ employees
- Verify deep hierarchies (5+ levels)
- Check search response time
- Validate zoom performance

## Troubleshooting

### Common Issues

#### 1. Empty Chart
**Cause**: No employees with manager relationships
**Solution**: Create sample data or assign managers to employees

#### 2. Slow Loading
**Cause**: Missing database indexes
**Solution**: Run the migration script

#### 3. Circular Reference Error
**Cause**: Attempting to create invalid reporting loops
**Solution**: Choose a different manager

#### 4. Access Denied
**Cause**: Non-admin user trying to access
**Solution**: Login as admin user

### Debug Mode
Add debug logging by setting environment variable:
```bash
DEBUG=org-chart npm start
```

## Future Enhancements

### Planned Features
- **Export Options**: PDF/PNG export of chart
- **Bulk Updates**: Multiple manager assignments
- **Historical Tracking**: Manager change history
- **Integration**: Sync with other HR systems
- **Mobile App**: Native mobile visualization

### Performance Improvements
- **Virtual Scrolling**: For very large organizations
- **Caching**: Redis caching for frequent queries
- **WebSocket**: Real-time updates
- **Lazy Loading**: Progressive data loading

## Support

For issues or questions:
1. Check this documentation
2. Review console errors
3. Verify database indexes
4. Test with sample data

---

**Implementation Date**: November 2025  
**Version**: 1.0  
**Compatibility**: HRMS v1.14+
