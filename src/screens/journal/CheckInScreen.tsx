import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, Header, AnimatedMoodIcon } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';

const moods = [
  { id: 'great', label: 'Great', icon: '😊', color: theme.COLORS.primary.green },
  { id: 'good', label: 'Good', icon: '🙂', color: theme.COLORS.primary.blue },
  { id: 'okay', label: 'Okay', icon: '😐', color: theme.COLORS.primary.yellow },
  { id: 'bad', label: 'Bad', icon: '😕', color: theme.COLORS.primary.red },
];

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry } = useJournal();
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad'>('good');
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async () => {
    if (!gratitude.trim()) return;
    
    try {
      await addEntry(mood, gratitude.trim(), note.trim() || undefined);
      router.back();
    } catch (error) {
      // Error is handled in JournalContext
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Daily Check-in"
        onBack={() => router.back()}
      />
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Typography variant="h3" style={styles.sectionTitle}>
            How are you feeling today?
          </Typography>
          <View style={styles.moodGrid}>
            {moods.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setMood(m.id as typeof mood)}
                style={styles.moodButton}
              >
                <AnimatedMoodIcon
                  color={m.color}
                  active={mood === m.id}
                >
                  <Typography style={styles.moodIcon}>{m.icon}</Typography>
                </AnimatedMoodIcon>
                <Typography
                  variant="caption"
                  color={mood === m.id ? m.color : theme.COLORS.ui.textSecondary}
                >
                  {m.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.sectionTitle}>
            What are you grateful for?
          </Typography>
          <Input
            multiline
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="Take a moment to reflect on something positive..."
            style={styles.input}
          />
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Additional thoughts? (Optional)
          </Typography>
          <Input
            multiline
            value={note}
            onChangeText={setNote}
            placeholder="Any other thoughts or feelings you'd like to capture..."
            style={styles.input}
          />
        </Card>

        <Button
          title="Save Entry"
          onPress={handleSubmit}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    padding: theme.SPACING.lg,
  },
  card: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.md,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: theme.SPACING.md,
  },
  moodButton: {
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  moodIcon: {
    fontSize: theme.FONTS.sizes.xl,
  },
  input: {
    height: 120,
  },
  button: {
    marginBottom: theme.SPACING.xl,
  },
}); 