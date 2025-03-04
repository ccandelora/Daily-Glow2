# Daily Glow: Mindfulness & Gratitude Journal

<p align="center">
  <img src="assets/icon.png" alt="Daily Glow Logo" width="120" height="120" />
</p>

Daily Glow is a modern, beautifully designed mindfulness and gratitude journaling app that helps users cultivate positive habits and track their emotional well-being. Through daily check-ins, challenges, and achievements, users can develop a more mindful and grateful perspective on life.

## 📱 Screenshots

<p align="center">
  <img src="assets/screenshots/home.png" alt="Home Screen" width="200" />
  <img src="assets/screenshots/check-in.png" alt="Check-in Screen" width="200" />
  <img src="assets/screenshots/achievements.png" alt="Achievements Screen" width="200" />
  <img src="assets/screenshots/insights.png" alt="Insights Screen" width="200" />
</p>

## ✨ Features

### 📝 Daily Check-ins
- Track your mood with an intuitive emoji-based system
- Record daily gratitude entries
- Add personal notes and reflections
- Beautiful animations and visual feedback

### 🎯 Daily Challenges
- Receive two unique challenges each day
- Earn points for completing challenges
- Track your progress and streaks
- Get rewarded with badges and achievements

### 🏆 Achievements & Progress
- Earn badges for consistent journaling
- Level up based on your engagement
- Track your daily streaks
- View detailed statistics of your journey

### 📊 Insights
- Visualize your mood patterns
- Track gratitude consistency
- Monitor your progress over time
- Gain personal insights into your well-being

## 🛠 Technical Stack

- **Frontend**: React Native with TypeScript
- **State Management**: React Context API
- **Navigation**: Expo Router
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **UI Components**: Custom component library
- **Animations**: React Native Animated

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

## 📱 App Structure

```
/src
  /components
    /common          # Reusable UI components
    /journal        # Journal-related components
    /achievements   # Achievement components
  /contexts         # React Context providers
  /screens          # App screens
  /lib              # Utility functions and services
  /constants        # Theme and configuration
```

## 🎨 Design System

The app uses a consistent design system with:
- Carefully chosen color palette for emotions
- Typography scale for readability
- Consistent spacing and layout
- Smooth animations and transitions
- Accessible UI elements

## 🔒 Security

- Secure authentication with Supabase
- Data encryption in transit and at rest
- Row Level Security (RLS) policies
- Regular security updates

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

### Pull Request Guidelines

1. Update documentation for changes
2. Add tests if applicable
3. Follow existing code style
4. Keep changes focused and atomic
5. Reference issues being fixed

## 🔧 Troubleshooting Guide

### Debugging Tools

We've created several debugging tools to help diagnose and fix issues:

1. **Run with Debug Mode**
   ```bash
   # Make the script executable
   chmod +x run_with_debug.sh
   
   # Run the app in debug mode
   ./run_with_debug.sh
   ```

2. **Master Debug Script**
   ```bash
   # Make the script executable
   chmod +x debug_all.sh
   
   # Run all debugging tools in sequence
   ./debug_all.sh
   ```

3. **Individual Debug Scripts**
   ```bash
   # Fix onboarding issues
   node fix_onboarding.js
   
   # Reset onboarding for testing
   node reset_onboarding_for_testing.js
   
   # Debug badge issues
   node debug_badges.js
   
   # Fix missing welcome badges
   node fix_welcome_badges.js
   ```

4. **In-App Debug Tools**
   - Go to Settings screen
   - Tap on the version number
   - Use the debug options that appear

For detailed documentation on the onboarding system and debugging tools, see [README_ONBOARDING.md](README_ONBOARDING.md).

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

### Development Tips

1. **Performance**
   - Use React DevTools
   - Monitor re-renders
   - Profile with Performance Monitor

2. **Debugging**
   - Enable remote debugging
   - Use console.log strategically
   - Utilize React Native Debugger

3. **Testing**
   - Run on multiple devices
   - Test offline functionality
   - Verify data persistence

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Expo team for the amazing framework
- Supabase team for the backend infrastructure
- Our contributors and early adopters
- Open source community for inspiration

---

<p align="center">Made with ❤️ for mental well-being</p>

<p align="center">
  <a href="https://github.com/yourusername/daily-glow/issues">Report Bug</a> ·
  <a href="https://github.com/yourusername/daily-glow/issues">Request Feature</a>
</p>
