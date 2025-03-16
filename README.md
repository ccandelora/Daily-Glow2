# Daily Glow: Mindfulness & Gratitude Journal

<p align="center">
  <img src="assets/default_transparent_353x345.png" alt="Daily Glow Logo" width="120" height="120" />
</p>

Daily Glow is a modern, beautifully designed mindfulness and gratitude journaling app that helps users cultivate positive habits and track their emotional well-being. Through daily check-ins, challenges, and achievements, users can develop a more mindful and grateful perspective on life.

## 📋 Dependency Management

### Recent Updates
We've recently performed a dependency cleanup and update process:

1. **Removed Unused Packages:**
   - `@shopify/react-native-skia` - Not used in any visualizations
   - `react-native-app-onboard` - Replaced with `react-native-onboarding-swiper`
   - Other unused packages identified by `npx depcheck`

2. **Updated to Latest Versions:**
   - Minor version updates to Expo SDK 52
   - Security patches and bug fixes for core dependencies
   - Optimized build configuration for EAS

3. **Build System Modernization:**
   - Configured EAS Build for iOS and Android
   - Updated project configuration 
   - Standardized build profiles

### Version Compatibility
For Expo SDK 52, the following package versions are required:
- React: 18.3.1 (React 19 is not yet compatible)
- React Native: 0.76.7
- React Navigation related packages: 
  - react-native-gesture-handler: 2.20.2
  - react-native-safe-area-context: 4.12.0
  - react-native-screens: 4.4.0

### Ongoing Maintenance
To keep dependencies up to date:
```bash
# Check outdated packages
npm outdated

# Identify unused dependencies
npx depcheck

# Update non-breaking changes
npm update

# Check compatibility with Expo SDK
expo doctor
```

## 📱 Screenshots

<p align="center">
  <img src="assets/screenshots/home.png" alt="Home Screen" width="200" />
  <img src="assets/screenshots/check-in.png" alt="Check-in Screen" width="200" />
  <img src="assets/screenshots/achievements.png" alt="Achievements Screen" width="200" />
  <img src="assets/screenshots/insights.png" alt="Insights Screen" width="200" />
</p>

## ✨ Features

### 🚀 Streamlined Onboarding
- Intuitive swiper-based onboarding experience
- Clear introduction to app features and benefits
- Easy-to-follow screens with appealing visuals
- Option to skip or navigate through at your own pace

### 📝 Daily Check-ins
- Track your mood with an intuitive emoji-based system
- Record daily gratitude entries
- Capture both initial and secondary emotions
- Track emotional shifts throughout the day
- Choose morning, afternoon, or evening check-in periods
- Add personal notes and reflections
- Beautiful animations and visual feedback

### 🎯 Daily Challenges
- Receive unique challenges that promote mindfulness
- Multiple challenge types for varied experiences
- Earn points for completing challenges
- Track challenge completion and response history
- Get rewarded with badges and achievements
- Challenges tailored to help build consistent habits

### 🏆 Achievements & Progress
- Earn badges across different categories 
- Level up based on your engagement and points
- Track your daily streaks for morning, afternoon and evening
- Maintain and view streak history
- View detailed statistics of your journey
- Unlock special badges for consistent participation

### 📊 Insights
- Visualize your emotional journey with interactive charts and calendars
- Discover emotional patterns through advanced AI-powered analysis
- Identify emotional triggers and their impact on your well-being
- Review personalized recommendations based on your journal entries
- Track emotional growth and balance over time
- Explore activity correlations to understand what influences your mood
- View emotional word cloud highlighting your most frequent emotions
- Receive future emotional state predictions based on historical patterns
- Filter insights by week, month, or all-time to analyze different time periods

## 🛠 Technical Stack

- **Frontend**: React Native 0.76.7 with TypeScript
- **React**: v18.3.1
- **Navigation**: Expo Router v4 with file-based routing
- **State Management**: React Context API
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth with email verification
- **UI Components**: Custom component library with Expo Vector Icons
- **Animations**: React Native Animated and Reanimated
- **Styling**: StyleSheet with custom theming
- **Onboarding**: react-native-onboarding-swiper
- **Visualizations**: react-native-svg for charts and graphs
- **Notifications**: Expo Notifications
- **Storage**: Expo SecureStore for tokens and sensitive data

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/daily-glow.git
cd daily-glow
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npx expo start
```

5. For a production build:
```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure EAS Build
eas build:configure

# Create a preview build
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## 📱 App Structure

```
/app                 # Expo Router file-based routing
  /(app)             # Main authenticated app screens
  /(auth)            # Authentication screens
  /(onboarding)      # Onboarding experience screens
  _layout.tsx        # Root layout with navigation setup

/src
  /components        # UI components organized by feature
    /common          # Reusable UI components
    /home            # Home screen components 
    /insights        # Insights-related components
    /profile         # User profile components
  /contexts          # React Context providers for state management
  /screens           # Screen components organized by feature
    /achievements    # Achievement-related screens
    /auth            # Authentication screens
    /check-in        # Check-in flow screens
    /home            # Home screen
    /insights        # Insights screens
    /journal         # Journal entry screens
    /onboarding      # Onboarding screens
    /settings        # Settings and profile screens
  /lib               # Core libraries (Supabase)
  /utils             # Utility functions
  /services          # Business logic services
  /constants         # App constants and theme
  /hooks             # Custom React hooks
  /types             # TypeScript type definitions
```

## 🔄 Navigation Flow

- **Authentication**: Users start at the sign-in screen, with options for sign-up and email verification
- **Onboarding**: New users experience a swiper-based onboarding flow explaining key app features
- **Main App**: After authentication and onboarding, users access the main app with bottom tabs for:
  - Home: Daily overview and quick access features
  - Journal: Record and review daily entries
  - Check-in: Daily emotional and gratitude check-in
  - Insights: Analytics and progress tracking
  - Profile: Settings and user information

## 🎨 Design System

The app uses a consistent design system with:
- Carefully chosen color palette for emotions
- Typography scale for readability
- Consistent spacing and layout
- Smooth animations and transitions
- Accessible UI elements
- Visually distinct emotion representations
- Custom icon set for badges and achievements

## 🔒 Database Schema

The app uses Supabase with the following tables and relationships:

### Authentication & Profile
- `auth.users`: Base authentication table managed by Supabase Auth
- `profiles`: Extended user profiles with fields for:
  - display_name
  - avatar_url
  - level
  - points
  - last_check_in
  - has_completed_onboarding

### Journal & Emotions
- `journal_entries`: Records of daily check-ins with:
  - user_id (linked to auth.users)
  - created_at
  - initial_emotion
  - secondary_emotion
  - emotional_shift
  - gratitude
  - note
  - time_period (MORNING, AFTERNOON, EVENING)

### Challenges & Achievements
- `challenges`: Available challenges with title, description, type, points
- `user_challenges`: Links users to completed challenges including:
  - user_id
  - challenge_id
  - status
  - response
  - completed_at
  - points_awarded

### Badges & Rewards
- `badges`: Available badges with name, description, icon_name, category
- `user_badges`: Links users to earned badges

### Streaks & Progress
- `user_streaks`: Tracks user consistency with:
  - user_id
  - morning_streak
  - afternoon_streak
  - evening_streak
  - last check-in timestamps for each period

### Notifications
- `notifications`: System and custom notifications with:
  - user_id
  - type
  - title
  - message
  - read status

### User Data
- `user_data`: Additional user metrics including:
  - total_challenges_completed
  - total_points
  - level

## 🔒 Security

- Secure authentication with Supabase
- Data encryption in transit and at rest
- Row Level Security (RLS) policies to ensure users only access their own data
- Secure token management with Expo SecureStore
- Regular security updates
- Input validation and sanitization
- Protected API endpoints

## 🤝 Contributing

We welcome contributions to Daily Glow! Here's how you can help:

### Types of Contributions

- **Bug Reports**: Create detailed issues with steps to reproduce
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit pull requests with improvements
- **Documentation**: Help improve or translate documentation
- **Design**: Suggest UI/UX improvements

### Development Process

1. **Fork & Clone**
   ```bash
   git clone https://github.com/yourusername/daily-glow.git
   cd daily-glow
   ```

2. **Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

3. **Commit**
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue"
   ```

4. **Test**
   - Run the test suite
   - Test on both iOS and Android
   - Verify accessibility features

5. **Submit**
   - Push your changes
   - Create a Pull Request
   - Wait for review

### Code Style

- Follow TypeScript best practices
- Use functional components
- Write meaningful commit messages
- Include comments for complex logic
- Add tests for new features

## 🔧 Troubleshooting Guide

### Common Issues

#### Build Errors

1. **Metro Bundler Issues**
   ```bash
   # Clear metro bundler cache
   npx expo start --clear
   ```

2. **Dependencies Issues**
   ```bash
   # Reset node modules
   rm -rf node_modules
   npm install
   ```

3. **iOS Build Fails**
   ```bash
   cd ios
   pod install
   cd ..
   ```

#### Runtime Errors

1. **Authentication Issues**
   - Verify `.env` configuration
   - Check Supabase console for errors
   - Ensure proper initialization

2. **Data Loading Issues**
   - Check network connectivity
   - Verify Supabase permissions
   - Check console for errors

3. **UI Rendering Issues**
   - Clear app cache
   - Update Expo Go
   - Check device compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Expo team for the amazing framework
- Supabase team for the backend infrastructure
- React Native Onboarding Swiper for the onboarding experience
- Our contributors and early adopters
- Open source community for inspiration

---

<p align="center">Made with ❤️ for mental well-being</p>

<p align="center">
  <a href="https://github.com/yourusername/daily-glow/issues">Report Bug</a> ·
  <a href="https://github.com/yourusername/daily-glow/issues">Request Feature</a>
</p>
