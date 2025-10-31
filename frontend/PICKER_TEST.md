# MUI Date/Time Picker Troubleshooting Guide

## If pickers are not showing up on some pages:

### 1. Clear Browser Cache
- Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
- Clear cached images and files
- Reload the page with `Ctrl + F5` (hard refresh)

### 2. Restart Development Server
```bash
cd frontend
npm start
```

### 3. Clear npm cache and reinstall (if still not working)
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### 4. Check Browser Console
- Press `F12` to open Developer Tools
- Look for any errors in the Console tab
- Common errors:
  - "Cannot find module" - Missing import
  - "dayjs is not defined" - Missing dayjs import
  - "LocalizationProvider" error - MUI package issue

## Pages with MUI Pickers:

✅ **ClockIns.js** - Edit Time Entry Modal (Date + Time)
✅ **TimeHistory.js** - Filters & Assign Shift (Date + Time)
✅ **RotaShiftManagement.jsx** - Filters & Assign Shift (Date + Time)
✅ **EmployeeTimesheetModal.js** - Week Navigation (Date)
✅ **AddTimeEntryModal.js** - Clock In/Out (Date + Time)
✅ **EditUserProfile.js** - Date of Birth & Start Date
✅ **UserCertificateCreate.js** - Issue Date & Expiry Date

## Verify Installation:

Check that these packages are in package.json:
- @mui/material
- @mui/x-date-pickers
- dayjs

## Test Component:

If you want to test if pickers work, add this to any page:

```javascript
import MUIDatePicker from '../components/MUIDatePicker';
import MUITimePicker from '../components/MUITimePicker';
import dayjs from 'dayjs';

// In your component:
const [testDate, setTestDate] = useState(dayjs());
const [testTime, setTestTime] = useState(dayjs());

// In your JSX:
<MUIDatePicker
  label="Test Date"
  value={testDate}
  onChange={(date) => setTestDate(date)}
/>

<MUITimePicker
  label="Test Time"
  value={testTime}
  onChange={(time) => setTestTime(time)}
/>
```

## Common Issues:

1. **Picker shows but doesn't open calendar**
   - Check if there are multiple LocalizationProvider wrappers
   - Each MUIDatePicker/MUITimePicker has its own provider

2. **Value not updating**
   - Make sure onChange returns dayjs object
   - Format correctly: `date.format('YYYY-MM-DD')` for dates
   - Format correctly: `time.format('HH:mm')` for times

3. **Styling issues**
   - MUI pickers use Material-UI styling
   - May need to adjust container widths
   - Check for CSS conflicts

## Need Help?

If pickers still don't work after trying above:
1. Check browser console for errors
2. Verify all imports are correct
3. Ensure dev server is running
4. Try in incognito/private browsing mode
