import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Define theme types
type ThemeType = 'light' | 'dark' | 'system';

// Define the context interface
interface ThemeContextType {
  theme: ThemeType;
  colorScheme: ColorSchemeName;
  setTheme: (theme: ThemeType) => void;
  isDarkMode: boolean;
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  colorScheme: Appearance.getColorScheme(),
  setTheme: () => {},
  isDarkMode: Appearance.getColorScheme() === 'dark',
});

// Create a hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Create the theme provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>('system');
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setColorScheme(colorScheme);
      }
    });

    return () => {
      // Clean up the subscription
      subscription.remove();
    };
  }, [theme]);

  // Update color scheme when theme changes
  useEffect(() => {
    if (theme === 'system') {
      setColorScheme(Appearance.getColorScheme());
    } else {
      setColorScheme(theme);
    }
  }, [theme]);

  // Determine if we're in dark mode
  const isDarkMode = colorScheme === 'dark';

  // Create the context value
  const contextValue: ThemeContextType = {
    theme,
    colorScheme,
    setTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export theme-related utilities
export const colors = {
  light: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    text: '#333333',
    background: '#FFFFFF',
    card: '#F9F9F9',
    border: '#E0E0E0',
  },
  dark: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    text: '#F0F0F0',
    background: '#121212',
    card: '#1E1E1E',
    border: '#2C2C2C',
  },
};

// Helper function to get current theme colors
export function getThemeColors() {
  const { isDarkMode } = useTheme();
  return isDarkMode ? colors.dark : colors.light;
} 