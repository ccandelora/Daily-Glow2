import React from 'react';
import { render } from '@testing-library/react-native';
import { Logo } from '../Logo';

// Mock the Image component to avoid dealing with assets in tests
jest.mock('react-native/Libraries/Image/Image', () => {
  const MockImage = (props: any) => {
    return null;
  };
  MockImage.getSize = jest.fn();
  MockImage.prefetch = jest.fn();
  MockImage.queryCache = jest.fn();
  return MockImage;
});

describe('Logo', () => {
  it('renders with default props', () => {
    const { toJSON } = render(<Logo />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with small size', () => {
    const { toJSON } = render(<Logo size="small" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with large size', () => {
    const { toJSON } = render(<Logo size="large" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies custom container style', () => {
    const { toJSON } = render(
      <Logo style={{ marginTop: 10, backgroundColor: 'red' }} />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies custom image style', () => {
    const { toJSON } = render(
      <Logo imageStyle={{ marginRight: 20, tintColor: 'blue' }} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
}); 