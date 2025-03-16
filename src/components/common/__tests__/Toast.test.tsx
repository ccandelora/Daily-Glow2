import React from 'react';
import { render } from '@testing-library/react-native';
import { Toast } from '@/components/common/Toast';

describe('Toast Component', () => {
  const mockOnHide = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly when visible', () => {
    const { toJSON, getByText } = render(
      <Toast 
        message="Test Toast Message" 
        visible={true} 
        onHide={mockOnHide}
      />
    );
    
    // Message should be displayed
    expect(getByText('Test Toast Message')).toBeTruthy();
    
    // Should match snapshot
    expect(toJSON()).toMatchSnapshot();
  });

  it('does not call onHide immediately when rendered', () => {
    render(
      <Toast 
        message="Test Toast Message" 
        visible={true} 
        onHide={mockOnHide}
      />
    );
    
    // onHide should not be called immediately
    expect(mockOnHide).not.toHaveBeenCalled();
  });

  it('applies success background color when type is success', () => {
    const { toJSON } = render(
      <Toast 
        message="Success Message" 
        visible={true}
        type="success"
      />
    );
    
    // Get the snapshot which should include the success color
    const snapshot = toJSON();
    expect(snapshot).toMatchSnapshot();
  });

  it('applies error background color when type is error', () => {
    const { toJSON } = render(
      <Toast 
        message="Error Message" 
        visible={true}
        type="error"
      />
    );
    
    // Get the snapshot which should include the error color
    const snapshot = toJSON();
    expect(snapshot).toMatchSnapshot();
  });

  it('applies info background color when type is info (default)', () => {
    const { toJSON } = render(
      <Toast 
        message="Info Message" 
        visible={true}
      />
    );
    
    // Get the snapshot which should include the info color
    const snapshot = toJSON();
    expect(snapshot).toMatchSnapshot();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 50 };
    const { toJSON } = render(
      <Toast 
        message="Custom Style Toast" 
        visible={true}
        style={customStyle}
      />
    );
    
    // Get the snapshot which should include the custom style
    const snapshot = toJSON();
    expect(snapshot).toMatchSnapshot();
  });
}); 