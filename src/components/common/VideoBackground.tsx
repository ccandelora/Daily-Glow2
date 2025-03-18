import React from 'react';
import { StyleSheet } from 'react-native';
import { ResizeMode, Video } from 'expo-av';

export const VideoBackground: React.FC = () => {
  return (
    <Video
      source={require('../../../assets/11985491_1080_1920_30fps.mp4')}
      style={styles.backgroundVideo}
      shouldPlay
      isLooping
      isMuted
      resizeMode={ResizeMode.COVER}
      useNativeControls={false}
    />
  );
};

const styles = StyleSheet.create({
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
}); 