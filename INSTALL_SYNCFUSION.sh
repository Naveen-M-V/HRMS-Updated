#!/bin/bash
# Syncfusion Installation Script

echo "Installing Syncfusion DatePicker packages..."
cd frontend
npm install @syncfusion/ej2-react-calendars @syncfusion/ej2-base --save

echo ""
echo "✅ Packages installed successfully!"
echo ""
echo "⚠️  IMPORTANT: Add these CSS imports to frontend/src/index.js:"
echo ""
echo "import '@syncfusion/ej2-base/styles/tailwind.css';"
echo "import '@syncfusion/ej2-buttons/styles/tailwind.css';"
echo "import '@syncfusion/ej2-inputs/styles/tailwind.css';"
echo "import '@syncfusion/ej2-popups/styles/tailwind.css';"
echo "import '@syncfusion/ej2-react-calendars/styles/tailwind.css';"
echo ""
echo "Then rebuild: npm run build"
