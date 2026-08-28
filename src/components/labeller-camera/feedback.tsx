import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export type ScanPhase = 'scanning' | 'settling' | 'processing';

interface ScanFeedbackProps {
  phase: ScanPhase;
}

const Messages = {
  scanning: 'Position the nutrition label in view',
  settling: {
    title: 'Label found',
    caption: 'Hold steady',
  },
  processing: 'Reading nutrition values…',
} satisfies Record<ScanPhase, string | { title: string; caption: string }>;

export function ScanFeedback({ phase }: ScanFeedbackProps) {
  const successProgress = useSharedValue(0);

  useEffect(() => {
    if (phase === 'settling') {
      successProgress.value = 0;
      successProgress.value = withSpring(1, {
        damping: 10,
        stiffness: 180,
        mass: 0.7,
      });
    } else {
      successProgress.value = 0;
    }

    return () => cancelAnimation(successProgress);
  }, [phase, successProgress]);

  const successStyle = useAnimatedStyle(() => ({
    opacity: successProgress.value,
    transform: [{ scale: 0.6 + successProgress.value * 0.4 }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[styles.scanFrame, phase !== 'scanning' && styles.successFrame]}
      />
      {phase === 'scanning' && (
        <View style={styles.message}>
          <Text style={styles.messageText}>{Messages[phase]}</Text>
        </View>
      )}

      {phase === 'settling' && (
        <Animated.View style={[styles.feedback, successStyle]}>
          <View style={styles.checkCircle}>
            <Text style={styles.check}>✓</Text>
          </View>

          <Text style={styles.successText}>{Messages[phase].title}</Text>
          <Text style={styles.secondaryText}>{Messages[phase].caption}</Text>
        </Animated.View>
      )}

      {phase === 'processing' && (
        <View style={styles.feedback}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.successText}>{Messages[phase]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scanFrame: {
    position: 'absolute',
    top: '18%',
    left: 24,
    right: 24,
    bottom: '18%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 18,
  },
  successFrame: {
    borderColor: '#34c759',
    borderWidth: 3,
  },
  message: {
    position: 'absolute',
    top: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  messageText: {
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
  },
  feedback: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34c759',
    marginBottom: 14,
  },
  check: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
  },
  successText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
  secondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
});
