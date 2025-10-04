# Syncfusion DatePicker Setup Guide

## Installation Steps

### 1. Install Syncfusion Packages

Run the following command in the `frontend` directory:

```bash
npm install @syncfusion/ej2-react-calendars @syncfusion/ej2-base --save
```

Or with yarn:
```bash
yarn add @syncfusion/ej2-react-calendars @syncfusion/ej2-base
```

### 2. Import CSS (Choose One Option)

#### Option A: Import in index.js (Recommended)
Add to `frontend/src/index.js`:

```javascript
import '@syncfusion/ej2-base/styles/tailwind.css';
import '@syncfusion/ej2-buttons/styles/tailwind.css';
import '@syncfusion/ej2-inputs/styles/tailwind.css';
import '@syncfusion/ej2-popups/styles/tailwind.css';
import '@syncfusion/ej2-react-calendars/styles/tailwind.css';
```

#### Option B: Import in index.css
Add to `frontend/src/index.css`:

```css
@import '@syncfusion/ej2-base/styles/tailwind.css';
@import '@syncfusion/ej2-buttons/styles/tailwind.css';
@import '@syncfusion/ej2-inputs/styles/tailwind.css';
@import '@syncfusion/ej2-popups/styles/tailwind.css';
@import '@syncfusion/ej2-react-calendars/styles/tailwind.css';
```

### 3. License (Optional)

Syncfusion components require a license for production use. You have two options:

#### Free Community License
- Free for companies with less than $1M revenue
- Register at: https://www.syncfusion.com/sales/communitylicense
- Add license key to `frontend/src/index.js`:

```javascript
import { registerLicense } from '@syncfusion/ej2-base';
registerLicense('YOUR-LICENSE-KEY-HERE');
```

#### Evaluation/Trial
- 30-day trial without license key
- Will show a trial banner/watermark
- Perfect for testing before purchasing

### 4. Verify Installation

After installing, the DatePicker component is ready to use throughout your app!

## Features Included

✅ **Date Format:** DD/MM/YYYY (matching your app's format)  
✅ **Tailwind Styling:** Matches your design system  
✅ **Keyboard Navigation:** Full accessibility support  
✅ **Responsive:** Works on mobile and desktop  
✅ **Min/Max Dates:** Configurable date ranges  
✅ **Disabled Dates:** Can disable specific dates  
✅ **Placeholder Support:** Custom placeholder text  
✅ **Required Validation:** Form validation support  

## Usage Example

```javascript
import SyncfusionDatePicker from '../components/SyncfusionDatePicker';

<SyncfusionDatePicker
  name="dateOfBirth"
  value={formData.dob}
  onChange={handleChange}
  placeholder="Select date of birth"
  required={true}
  className="mt-1 block w-full"
/>
```

## Troubleshooting

### Issue: Styles not loading
- Make sure CSS imports are added
- Check browser console for errors
- Verify package installation

### Issue: License banner showing
- Register for free community license
- Add license key to index.js
- Or ignore for development/testing

### Issue: Date format incorrect
- DatePicker component handles conversion
- Always outputs DD/MM/YYYY format
- Compatible with existing backend

## Complete Package List

```json
{
  "@syncfusion/ej2-react-calendars": "^24.1.41",
  "@syncfusion/ej2-base": "^24.1.41"
}
```

## Next Steps

After installation:
1. Verify CSS is imported
2. Test DatePicker in one page
3. All date inputs are already updated to use SyncfusionDatePicker
4. Check console for any errors
5. Test date selection and form submission

## Support

- Documentation: https://ej2.syncfusion.com/react/documentation/datepicker/getting-started
- Demos: https://ej2.syncfusion.com/react/demos/#/tailwind3/datepicker/default
- Support: https://www.syncfusion.com/support
