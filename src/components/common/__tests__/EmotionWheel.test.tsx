import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmotionWheel } from '../EmotionWheel';
import { primaryEmotions } from '@/constants/emotions';
import { TouchableOpacity } from 'react-native';

describe('EmotionWheel', () => {
  const mockOnSelectEmotion = jest.fn();

  beforeEach(() => {
    mockOnSelectEmotion.mockClear();
  });

  it('renders primary emotions correctly', () => {
    const { getAllByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="primary"
      />
    );

    // Check if all primary emotions are rendered
    expect(getAllByText(/😊 Happy/)).toBeTruthy();
    expect(getAllByText(/😢 Sad/)).toBeTruthy();
    expect(getAllByText(/😠 Angry/)).toBeTruthy();
    expect(getAllByText(/😨 Scared/)).toBeTruthy();
  });

  it('renders secondary emotions when primaryEmotion is provided', () => {
    const { getAllByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
        primaryEmotion="happy"
      />
    );

    // Check if all secondary emotions for "happy" are rendered
    expect(getAllByText(/✨ Optimistic/)).toBeTruthy();
    expect(getAllByText(/😌 Peaceful/)).toBeTruthy();
    expect(getAllByText(/💪 Powerful/)).toBeTruthy();
    expect(getAllByText(/🦋 Proud/)).toBeTruthy();
  });

  it('renders sad secondary emotions correctly', () => {
    const { getAllByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
        primaryEmotion="sad"
      />
    );

    // Check if all secondary emotions for "sad" are rendered
    expect(getAllByText(/🫂 Lonely/)).toBeTruthy();
    expect(getAllByText(/🥺 Vulnerable/)).toBeTruthy();
    expect(getAllByText(/💔 Despair/)).toBeTruthy();
    expect(getAllByText(/😣 Guilty/)).toBeTruthy();
  });

  it('renders angry secondary emotions correctly', () => {
    const { getAllByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
        primaryEmotion="angry"
      />
    );

    // Check if all secondary emotions for "angry" are rendered
    expect(getAllByText(/😤 Frustrated/)).toBeTruthy();
    expect(getAllByText(/🤨 Critical/)).toBeTruthy();
    expect(getAllByText(/🫥 Distant/)).toBeTruthy();
    expect(getAllByText(/😒 Irritated/)).toBeTruthy();
  });

  it('renders scared secondary emotions correctly', () => {
    const { getAllByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
        primaryEmotion="scared"
      />
    );

    // Check if all secondary emotions for "scared" are rendered
    expect(getAllByText(/😕 Confused/)).toBeTruthy();
    expect(getAllByText(/😞 Rejected/)).toBeTruthy();
    expect(getAllByText(/😰 Helpless/)).toBeTruthy();
    expect(getAllByText(/😥 Anxious/)).toBeTruthy();
  });

  it('shows empty wheel when type is secondary but no primaryEmotion is provided', () => {
    const { queryByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
      />
    );

    // No emotions should be rendered
    primaryEmotions.forEach(emotion => {
      expect(queryByText(emotion.label)).toBeNull();
    });
  });

  it('handles emotion selection correctly', () => {
    const { getByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="primary"
      />
    );

    // Click on an emotion
    fireEvent.press(getByText(/😊 Happy/));
    
    // Check if onSelectEmotion was called with the correct emotion
    expect(mockOnSelectEmotion).toHaveBeenCalledTimes(1);
    expect(mockOnSelectEmotion).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'happy',
        label: '😊 Happy'
      })
    );
  });

  it('handles secondary emotion selection correctly', () => {
    const { getByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
        primaryEmotion="happy"
      />
    );

    // Click on a secondary emotion
    fireEvent.press(getByText(/✨ Optimistic/));
    
    // Check if onSelectEmotion was called with the correct emotion
    expect(mockOnSelectEmotion).toHaveBeenCalledTimes(1);
    expect(mockOnSelectEmotion).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'optimistic',
        label: '✨ Optimistic'
      })
    );
  });

  it('applies selected styles to the selected emotion', () => {
    const { UNSAFE_getAllByType } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion="happy"
        type="primary"
      />
    );

    // Find all the TouchableOpacity components
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // Find the one that has the selected style
    const selectedButton = buttons.find(button => 
      button.props.style && 
      Array.isArray(button.props.style) && 
      button.props.style.some((style: any) => 
        style && style.borderWidth === 3
      )
    );
    
    expect(selectedButton).toBeTruthy();
  });

  it('applies custom styles when provided', () => {
    const customStyle = { marginTop: 20 };
    const { toJSON } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="primary"
        style={customStyle}
      />
    );

    // Check if the custom style is applied to the container
    const renderedJSON = toJSON();
    expect(renderedJSON.props.style).toEqual(
      expect.arrayContaining([
        customStyle
      ])
    );
  });

  it('handles unknown emotion IDs gracefully', () => {
    // Mock the primaryEmotions to include an unknown emotion ID
    const originalPrimaryEmotions = [...primaryEmotions];
    const mockPrimaryEmotions = [...originalPrimaryEmotions];
    
    // Add an emotion with an unknown ID
    if (mockPrimaryEmotions[0]?.emotions) {
      mockPrimaryEmotions[0].emotions.push({
        id: 'unknown-emotion',
        label: 'Unknown',
        color: '#ccc'
      });
    }
    
    jest.mock('@/constants/emotions', () => ({
      ...jest.requireActual('@/constants/emotions'),
      primaryEmotions: mockPrimaryEmotions,
    }));

    const { queryByText } = render(
      <EmotionWheel 
        onSelectEmotion={mockOnSelectEmotion} 
        selectedEmotion={undefined}
        type="secondary"
        primaryEmotion="happy"
      />
    );
    
    // The wheel still renders without crashing even with an unknown emotion
    expect(queryByText(/✨ Optimistic/)).toBeTruthy();
  });
}); 