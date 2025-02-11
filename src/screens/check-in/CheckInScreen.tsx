import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, AnimatedMoodIcon } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';

const moods = [
  { id: 'great' as const, label: 'Great', icon: '😊', color: theme.COLORS.primary.green },
  { id: 'good' as const, label: 'Good', icon: '🙂', color: theme.COLORS.primary.blue },
  { id: 'okay' as const, label: 'Okay', icon: '😐', color: theme.COLORS.primary.yellow },
  { id: 'bad' as const, label: 'Bad', icon: '😕', color: theme.COLORS.primary.red },
] as const;

type Mood = typeof moods[number]['id'];

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry } = useJournal();
  const { showError } = useAppState();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!selectedMood) {
      showError('Please select a mood before saving');
      return;
    }

    if (!gratitude.trim()) {
      showError('Please enter what you\'re grateful for');
      return;
    }

    try {
      await addEntry(selectedMood, gratitude, note);
      router.back();
    } catch (error) {
      // Error is already handled in JournalContext
      // We can add additional UI handling here if needed
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>
          Daily Check-in
        </Typography>
        <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
          Take a moment to reflect on your day
        </Typography>
      </View>

      <View style={styles.content}>
        <Card style={styles.moodCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            How are you feeling?
          </Typography>
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                onPress={() => setSelectedMood(mood.id)}
                style={styles.moodButton}
              >
                <AnimatedMoodIcon
                  color={mood.color}
                  active={selectedMood === mood.id}
                >
                  <Typography style={styles.moodIcon}>{mood.icon}</Typography>
                </AnimatedMoodIcon>
                <Typography
                  variant="caption"
                  color={selectedMood === mood.id ? mood.color : theme.COLORS.ui.textSecondary}
                >
                  {mood.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.gratitudeCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            What are you grateful for today?
          </Typography>
          <Input
            multiline
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="Take a moment to reflect on something positive..."
            style={styles.gratitudeInput}
          />
        </Card>

        <Card style={styles.noteCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Any additional thoughts?
          </Typography>
          <Input
            multiline
            value={note}
            onChangeText={setNote}
            placeholder="Write any additional thoughts or feelings..."
            style={styles.noteInput}
          />
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          title="Save Check-in"
          onPress={handleSave}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  header: {
    padding: theme.SPACING.lg,
  },
  title: {
    marginBottom: theme.SPACING.xs,
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: 0,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
  },
  moodCard: {
    marginBottom: theme.SPACING.lg,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  moodButton: {
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  moodIcon: {
    fontSize: theme.FONTS.sizes.xl,
  },
  gratitudeCard: {
    marginBottom: theme.SPACING.lg,
  },
  gratitudeInput: {
    height: 100,
  },
  noteCard: {
    marginBottom: theme.SPACING.lg,
  },
  noteInput: {
    height: 100,
  },
  footer: {
    padding: theme.SPACING.lg,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
}); 