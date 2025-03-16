import React from 'react';
import { render } from '@testing-library/react-native';
import { VideoBackground } from '../VideoBackground';

// Mock the expo-av Video component
jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: {
    COVER: 'cover',
  },
}));

describe('VideoBackground', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<VideoBackground />);
    expect(toJSON()).toMatchSnapshot();
  });
}); 