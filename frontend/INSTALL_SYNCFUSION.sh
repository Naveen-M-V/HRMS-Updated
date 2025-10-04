#!/bin/bash
# Complete Syncfusion Installation Script

echo "Installing ALL required Syncfusion packages..."

npm install \
  @syncfusion/ej2-react-calendars \
  @syncfusion/ej2-calendars \
  @syncfusion/ej2-base \
  @syncfusion/ej2-buttons \
  @syncfusion/ej2-inputs \
  @syncfusion/ej2-popups \
  @syncfusion/ej2-lists \
  --save

echo ""
echo "✅ Installation complete!"
echo ""
echo "Now run: npm run build"
