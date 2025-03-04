#!/bin/bash

# Script to run the Daily Glow app with debug tools enabled
# This script sets up the environment for debugging and runs the app

echo "===== Daily Glow Debug Mode ====="

# Clear Metro bundler cache
echo "🧹 Clearing Metro bundler cache..."
rm -rf node_modules/.cache

# Clear watchman watches
echo "🔄 Resetting Watchman..."
watchman watch-del-all

# Set environment variables for development
echo "🔧 Setting environment variables..."
export NODE_ENV=development
export EXPO_DEBUG=true
export DEBUG=true
export EXPO_DEBUG_LOGS=true

# Check if we should reset onboarding
read -p "❓ Reset onboarding status before starting? (y/n): " reset_onboarding
if [[ $reset_onboarding == "y" || $reset_onboarding == "Y" ]]; then
  echo "🔄 Resetting onboarding status..."
  # This is a placeholder - in a real implementation, you would call the reset script
  # node reset_onboarding_for_testing.js
  echo "⚠️ To fully reset onboarding, use the Debug Tools in the app"
fi

# Choose platform
echo "📱 Select platform to run:"
echo "1) iOS Simulator"
echo "2) Android Emulator"
echo "3) Web"
read -p "Enter choice (1-3): " platform_choice

# Run the app on the selected platform
case $platform_choice in
  1)
    echo "🚀 Running app on iOS simulator..."
    npm run ios
    ;;
  2)
    echo "🚀 Running app on Android emulator..."
    npm run android
    ;;
  3)
    echo "🚀 Running app on web..."
    npm run web
    ;;
  *)
    echo "🚀 Running app on iOS simulator (default)..."
    npm run ios
    ;;
esac

echo ""
echo "===== Debug Instructions ====="
echo "1️⃣ Access debug tools by tapping the version number in Settings"
echo "2️⃣ Use 'Check Onboarding Status' to verify database and local storage state"
echo "3️⃣ Use 'Reset Onboarding' to clear onboarding status"
echo "4️⃣ Check console logs for detailed debugging information"
echo "5️⃣ If you encounter badge issues, they may appear in the logs"
echo ""
echo "✅ App started with debug tools enabled" 