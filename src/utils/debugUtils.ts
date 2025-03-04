import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

/**
 * Utility function to test deep linking
 */
export const testDeepLinking = async () => {
  try {
    // Log the app scheme
    const scheme = Constants.expoConfig?.scheme || 'daily-glow';
    console.log('App scheme:', scheme);
    
    // Test creating a URL with Linking.createURL
    try {
      const url = Linking.createURL('confirm-email');
      console.log('Linking.createURL result:', url);
    } catch (error) {
      console.error('Error with Linking.createURL:', error);
    }
    
    // Test if Linking.openURL works
    try {
      const canOpen = await Linking.canOpenURL(`${scheme}://confirm-email`);
      console.log(`Can open ${scheme}://confirm-email:`, canOpen);
    } catch (error) {
      console.error('Error with Linking.canOpenURL:', error);
    }
    
    // Log the current URL
    try {
      const initialUrl = await Linking.getInitialURL();
      console.log('Initial URL:', initialUrl);
    } catch (error) {
      console.error('Error getting initial URL:', error);
    }
    
    // Log all available Linking methods
    console.log('Available Linking methods:', Object.keys(Linking));
    
    return true;
  } catch (error) {
    console.error('Error in testDeepLinking:', error);
    return false;
  }
};

/**
 * Utility function to simulate a deep link
 */
export const simulateDeepLink = async (path: string) => {
  try {
    const scheme = Constants.expoConfig?.scheme || 'daily-glow';
    
    // Clean the path - remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Try different URL formats
    const urls = [
      `${scheme}://${cleanPath}`,                // daily-glow://auth/callback
      `${scheme}:///${cleanPath}`,               // daily-glow:///auth/callback
      Linking.createURL(cleanPath)               // exp://192.168.x.x:port/--/auth/callback or daily-glow://auth/callback
    ];
    
    console.log('Attempting to simulate deep links with the following URLs:');
    urls.forEach(url => console.log(' - ' + url));
    
    // Try each URL format
    for (const url of urls) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        console.log(`Can open ${url}: ${canOpen}`);
        
        if (canOpen) {
          console.log('Opening URL:', url);
          await Linking.openURL(url);
          console.log('Deep link simulation successful with:', url);
          return true;
        }
      } catch (error) {
        console.log(`Error with URL ${url}:`, error);
        // Continue to next URL format
      }
    }
    
    console.warn('None of the URL formats could be opened');
    return false;
  } catch (error) {
    console.error('Error in simulateDeepLink:', error);
    return false;
  }
}; 