module.exports = {
  createCommonComponentMocks: () => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    
    return {
      Typography: ({ children, variant, style, glow, color, ...props }: { 
        children: React.ReactNode; 
        variant?: string; 
        style?: any; 
        glow?: string; 
        color?: string; 
        [key: string]: any;
      }) => 
        React.createElement(View, { 
          testID: `typography-${variant || 'default'}`, 
          style,
          ...props
        }, React.createElement(Text, null, children)),
      
      Button: ({ title, onPress, variant, style, ...props }: { 
        title: string; 
        onPress?: () => void; 
        variant?: string; 
        style?: any; 
        [key: string]: any;
      }) => 
        React.createElement(TouchableOpacity, { 
          testID: `button-${title}`, 
          onPress,
          style,
          ...props
        }, React.createElement(Text, null, title)),
      
      Input: ({ label, value, onChangeText, placeholder, secureTextEntry, multiline, style, ...props }: { 
        label?: string; 
        value?: string; 
        onChangeText?: (text: string) => void; 
        placeholder?: string; 
        secureTextEntry?: boolean; 
        multiline?: boolean; 
        style?: any; 
        [key: string]: any;
      }) =>
        React.createElement(View, { 
          testID: `input-${label || placeholder}`,
          style,
          ...props
        }, [
          label && React.createElement(Text, { key: 'label' }, label),
          React.createElement('input', { 
            key: 'input',
            value, 
            onChange: (e: any) => onChangeText && onChangeText(e.target.value),
            placeholder,
            type: secureTextEntry ? 'password' : 'text',
            multiline: multiline ? 'true' : 'false'
          })
        ]),
      
      Card: ({ children, style, variant, ...props }: { 
        children: React.ReactNode; 
        style?: any; 
        variant?: string; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: `card-${variant || 'default'}`,
          style,
          ...props
        }, children),
      
      EmotionWheel: ({ onSelect, selectedEmotion, ...props }: { 
        onSelect?: (emotion: { id: string }) => void; 
        selectedEmotion?: string; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'emotion-wheel',
          ...props
        }, [
          React.createElement(TouchableOpacity, {
            key: 'happy',
            testID: 'select-emotion-happy',
            onPress: () => onSelect?.({ id: 'happy' })
          }),
          React.createElement(TouchableOpacity, {
            key: 'sad',
            testID: 'select-emotion-sad',
            onPress: () => onSelect?.({ id: 'sad' })
          })
        ]),
      
      VideoBackground: ({ children, ...props }: {
        children?: React.ReactNode;
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'mock-video-background',
          ...props
        }, children),
      
      AnimatedBackground: ({ children, ...props }: {
        children?: React.ReactNode;
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'mock-animated-background',
          ...props
        }, children),
      
      AnimatedModal: ({ visible, onClose, children, ...props }: { 
        visible?: boolean; 
        onClose?: () => void; 
        children?: React.ReactNode; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'mock-animated-modal',
          visible: visible ? 'true' : 'false',
          ...props
        }, [
          children,
          React.createElement(TouchableOpacity, {
            key: 'close-button',
            testID: 'modal-close-button',
            onPress: onClose
          })
        ]),
      
      LoadingIndicator: ({ size, color, ...props }: { 
        size?: string | number; 
        color?: string; 
        [key: string]: any; 
      }) =>
        React.createElement(View, {
          testID: 'loading-indicator',
          ...props
        }),
      
      Header: ({ title, showBackButton, onBack, ...props }: { 
        title?: string; 
        showBackButton?: boolean; 
        onBack?: () => void; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'header',
          ...props
        }, [
          showBackButton && React.createElement(TouchableOpacity, {
            key: 'back-button',
            testID: 'header-back-button',
            onPress: onBack
          }),
          React.createElement(Text, { key: 'title' }, title)
        ]),
      
      DailyChallenge: ({ onComplete, style, ...props }: { 
        onComplete?: () => void; 
        style?: any; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: 'daily-challenge',
          style,
          ...props
        }, [
          React.createElement(TouchableOpacity, {
            key: 'complete-button',
            testID: 'complete-challenge-button',
            onPress: onComplete
          }, 'Complete Challenge')
        ]),
      
      DeepLinkHandler: ({ ...props }: { [key: string]: any }) =>
        React.createElement(View, {
          testID: 'deep-link-handler',
          ...props
        }),
        
      Logo: ({ size, style, ...props }: { 
        size?: string; 
        style?: any; 
        [key: string]: any;
      }) =>
        React.createElement(View, {
          testID: `logo-${size || 'default'}`,
          style,
          ...props
        })
    };
  },
  
  createAnimationMocks: () => {
    const React = require('react');
    const { View } = require('react-native');
    
    return {
      View: React.forwardRef((props: any, ref: any) => 
        React.createElement(View, { ...props, ref, testID: 'animated-view' })),
      Text: React.forwardRef((props: any, ref: any) =>
        React.createElement('Text', { ...props, ref, testID: 'animated-text' })),
      Image: React.forwardRef((props: any, ref: any) =>
        React.createElement('Image', { ...props, ref, testID: 'animated-image' })),
      createAnimatedComponent: (Component: any) => React.forwardRef((props: any, ref: any) =>
        React.createElement(Component, { ...props, ref, testID: 'animated-component' })),
      timing: jest.fn(() => ({ start: jest.fn((cb: any) => cb && cb()) })),
      spring: jest.fn(() => ({ start: jest.fn((cb: any) => cb && cb()) })),
      sequence: jest.fn((animations: any) => ({ start: jest.fn((cb: any) => cb && cb()) })),
      parallel: jest.fn((animations: any) => ({ start: jest.fn((cb: any) => cb && cb()) })),
      loop: jest.fn((animation: any) => ({ start: jest.fn() })),
      useAnimatedValue: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => 0),
        addListener: jest.fn(),
        removeAllListeners: jest.fn()
      }))
    };
  }
}; 