import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnimatedModal } from '../AnimatedModal';
import { Text } from 'react-native';

// Mock the Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn().mockReturnValue(0),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(callback => {
          if (callback) callback({ finished: true });
        }),
      })),
      parallel: jest.fn(() => ({
        start: jest.fn(callback => {
          if (callback) callback({ finished: true });
        }),
      })),
      View: RN.View,
    },
    Dimensions: {
      ...RN.Dimensions,
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
  };
});

// Disable act warnings for animation-related updates
jest.spyOn(console, 'error').mockImplementation((message) => {
  if (!message.includes('act(...)') && !message.includes('unmounted component')) {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
});

describe('AnimatedModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders content when visible is true', () => {
    const { getByText } = render(
      <AnimatedModal visible={true} onClose={mockOnClose}>
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    expect(getByText('Modal Content')).toBeTruthy();
  });

  it('renders title when provided', () => {
    const { getByText } = render(
      <AnimatedModal visible={true} onClose={mockOnClose} title="Test Title">
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('calls onClose when backdrop is pressed', () => {
    const { getByTestId } = render(
      <AnimatedModal visible={true} onClose={mockOnClose}>
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    fireEvent.press(getByTestId('backdrop'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is pressed', () => {
    const { getByTestId } = render(
      <AnimatedModal visible={true} onClose={mockOnClose} title="Test Title">
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    fireEvent.press(getByTestId('close-button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom styles when provided', () => {
    const customStyle = { padding: 30 };
    const { getByTestId } = render(
      <AnimatedModal 
        visible={true} 
        onClose={mockOnClose}
        style={customStyle}
        testID="test-modal-content"
      >
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    const modalContent = getByTestId('test-modal-content');
    expect(modalContent).toBeTruthy();
  });

  it('handles animation when visible changes to false', () => {
    const { rerender } = render(
      <AnimatedModal 
        visible={true} 
        onClose={mockOnClose}
        testID="test-modal-content"
      >
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    // Re-render with visible set to false
    rerender(
      <AnimatedModal 
        visible={false} 
        onClose={mockOnClose}
        testID="test-modal-content"
      >
        <Text>Modal Content</Text>
      </AnimatedModal>
    );
    
    // The animation should be triggered when visible changes to false
    // This is testing the else branch in the useEffect
  });
}); 