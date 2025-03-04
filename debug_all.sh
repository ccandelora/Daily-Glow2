#!/bin/bash

# Master script to run all debugging tools in sequence
# This script helps diagnose and fix issues with the Daily Glow app

echo "===== Daily Glow Master Debug Tool ====="
echo "This script will run all debugging tools in sequence"

# Check if Supabase credentials are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "⚠️  Supabase credentials not set. Please set them now:"
  read -p "SUPABASE_URL: " SUPABASE_URL
  read -p "SUPABASE_KEY: " SUPABASE_KEY
  
  export SUPABASE_URL=$SUPABASE_URL
  export SUPABASE_KEY=$SUPABASE_KEY
  
  echo "Credentials set for this session."
fi

# Function to ask for confirmation
confirm() {
  read -p "$1 (y/n): " response
  case "$response" in
    [yY][eE][sS]|[yY]) 
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

# 1. Check onboarding status
echo -e "\n1️⃣  Checking onboarding status..."
if confirm "Run fix_onboarding.js?"; then
  node fix_onboarding.js
fi

# 2. Check badge status
echo -e "\n2️⃣  Checking badge status..."
if confirm "Run debug_badges.js?"; then
  node debug_badges.js
fi

# 3. Fix welcome badges
echo -e "\n3️⃣  Fixing welcome badges..."
if confirm "Run fix_welcome_badges.js?"; then
  node fix_welcome_badges.js
fi

# 4. Reset onboarding for testing
echo -e "\n4️⃣  Reset onboarding status..."
if confirm "Do you want to reset onboarding status for testing?"; then
  read -p "Enter user ID to reset (leave empty for all users): " USER_ID
  
  # Edit the script to set the user ID
  if [ -n "$USER_ID" ]; then
    # Use sed to replace the USER_ID_TO_RESET line
    sed -i.bak "s/const USER_ID_TO_RESET = '';/const USER_ID_TO_RESET = '$USER_ID';/" reset_onboarding_for_testing.js
    echo "Set USER_ID_TO_RESET to $USER_ID"
  else
    # Use sed to ensure USER_ID_TO_RESET is empty
    sed -i.bak "s/const USER_ID_TO_RESET = '.*';/const USER_ID_TO_RESET = '';/" reset_onboarding_for_testing.js
    echo "Set USER_ID_TO_RESET to empty (will reset all users)"
  fi
  
  # Run the script
  node reset_onboarding_for_testing.js
  
  # Restore the original file
  mv reset_onboarding_for_testing.js.bak reset_onboarding_for_testing.js
fi

# 5. Run the app with debug tools
echo -e "\n5️⃣  Run the app with debug tools..."
if confirm "Do you want to run the app with debug tools enabled?"; then
  ./run_with_debug.sh
fi

echo -e "\n✅ Debug session complete!" 