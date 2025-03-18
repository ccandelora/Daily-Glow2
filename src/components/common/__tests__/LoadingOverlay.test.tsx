import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { ActivityIndicator } from 'react-native';

describe('LoadingOverlay Component', () => {
  it('renders correctly without a message', () => {
    const { toJSON, UNSAFE_getAllByType, queryByText } = render(
      <LoadingOverlay />
    );
    
    // Should have an ActivityIndicator
    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(activityIndicators.length).toBe(1);
    
    // Should not have any text message
    expect(queryByText('Loading...')).toBeFalsy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('renders correctly with a message', () => {
    const testMessage = 'Loading your data...';
    const { toJSON, getByText, UNSAFE_getAllByType } = render(
      <LoadingOverlay message={testMessage} />
    );
    
    // Should have an ActivityIndicator
    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(activityIndicators.length).toBe(1);
    
    // Should display the correct message
    expect(getByText(testMessage)).toBeTruthy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });
  
  it('applies the correct styling', () => {
    const { toJSON } = render(<LoadingOverlay />);
    const tree = toJSON();
    
    // Check that the container has the expected styles
    expect(tree).toHaveProperty('props.style');
    
    // Should match snapshot
    expect(tree).toMatchSnapshot();
  });
}); 