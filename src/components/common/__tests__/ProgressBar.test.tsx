import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '../ProgressBar';
import theme from '@/constants/theme';
import { View } from 'react-native';

describe('ProgressBar Component', () => {
  test('renders correctly with default props', () => {
    const { toJSON } = render(<ProgressBar progress={0.5} />);
    expect(toJSON()).toMatchSnapshot('default-progress-bar');
  });

  test('applies correct progress width', () => {
    const testCases = [
      { progress: 0, expectedWidth: '0%' },
      { progress: 0.25, expectedWidth: '25%' },
      { progress: 0.5, expectedWidth: '50%' },
      { progress: 0.75, expectedWidth: '75%' },
      { progress: 1, expectedWidth: '100%' },
    ];

    testCases.forEach(({ progress, expectedWidth }) => {
      const { toJSON } = render(<ProgressBar progress={progress} />);
      expect(toJSON()).toMatchSnapshot(`progress-bar-width-${expectedWidth}`);
    });
  });

  test('clamps progress values outside 0-1 range', () => {
    // Test with progress < 0
    const { toJSON: toJSONNegative } = render(<ProgressBar progress={-0.5} />);
    expect(toJSONNegative()).toMatchSnapshot('progress-bar-negative-value');
    
    // Test with progress > 1
    const { toJSON: toJSONOver } = render(<ProgressBar progress={1.5} />);
    expect(toJSONOver()).toMatchSnapshot('progress-bar-over-value');
  });

  test('applies custom color', () => {
    const customColor = '#FF0000';
    const { toJSON } = render(<ProgressBar progress={0.5} color={customColor} />);
    expect(toJSON()).toMatchSnapshot(`progress-bar-color-${customColor}`);
  });

  test('applies custom height', () => {
    const customHeight = 8;
    const { toJSON } = render(<ProgressBar progress={0.5} height={customHeight} />);
    expect(toJSON()).toMatchSnapshot(`progress-bar-height-${customHeight}`);
  });

  test('applies custom style', () => {
    const customStyle = { marginTop: 10, marginBottom: 10 };
    const { toJSON } = render(<ProgressBar progress={0.5} style={customStyle} />);
    expect(toJSON()).toMatchSnapshot('progress-bar-custom-style');
  });
}); 