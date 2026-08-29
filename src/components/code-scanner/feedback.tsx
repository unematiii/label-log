import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { CameraOverlay } from '@/components/camera-overlay';

export type CodeScanPhase =
  'scanning' | 'checking' | 'found' | 'not-found' | 'error';

type CodeScanFeedbackProps = {
  phase: CodeScanPhase;
};

const messages = {
  scanning: {
    title: 'Position the barcode in view',
    caption: null,
  },
  checking: {
    title: 'Checking catalogue…',
    caption: null,
  },
  found: {
    title: 'Product found',
    caption: 'Opening product',
  },
  'not-found': {
    title: 'New product',
    caption: 'Scan its nutrition label next',
  },
  error: {
    title: 'Encountered an error while looking for the product',
    caption: 'Please try again',
  },
} satisfies Record<CodeScanPhase, { title: string; caption: string | null }>;

export function CodeScanFeedback({ phase }: CodeScanFeedbackProps) {
  const resultProgress = useSharedValue(0);
  const isResult = phase === 'found' || phase === 'not-found';

  useEffect(() => {
    if (isResult) {
      resultProgress.value = 0;
      resultProgress.value = withSpring(1, {
        damping: 10,
        stiffness: 180,
        mass: 0.7,
      });
    } else {
      resultProgress.value = 0;
    }

    return () => cancelAnimation(resultProgress);
  }, [isResult, resultProgress]);

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultProgress.value,
    transform: [{ scale: 0.6 + resultProgress.value * 0.4 }],
  }));
  const message = messages[phase];

  return (
    <CameraOverlay>
      <View
        style={[
          styles.scanFrame,
          phase === 'found' && styles.foundFrame,
          phase === 'not-found' && styles.notFoundFrame,
          phase === 'error' && styles.errorFrame,
        ]}
      />

      {phase === 'scanning' && (
        <View style={styles.message}>
          <Text style={styles.messageText}>{message.title}</Text>
        </View>
      )}

      {phase === 'checking' && (
        <View style={styles.feedback}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.title}>{message.title}</Text>
        </View>
      )}

      {isResult && (
        <Animated.View style={[styles.feedback, resultStyle]}>
          <View
            style={[
              styles.resultCircle,
              phase === 'not-found' && styles.notFoundCircle,
            ]}
          >
            <Text style={styles.resultSymbol}>
              {phase === 'found' ? '✓' : '+'}
            </Text>
          </View>
          <Text style={styles.title}>{message.title}</Text>
          {message.caption && (
            <Text style={styles.caption}>{message.caption}</Text>
          )}
        </Animated.View>
      )}

      {phase === 'error' && (
        <View style={styles.feedback}>
          <Text style={styles.errorSymbol}>!</Text>
          <Text style={styles.title}>{message.title}</Text>
          <Text style={styles.caption}>{message.caption}</Text>
        </View>
      )}
    </CameraOverlay>
  );
}

const styles = StyleSheet.create({
  scanFrame: {
    position: 'absolute',
    top: 76,
    left: 24,
    right: 24,
    bottom: 76,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 18,
  },
  foundFrame: {
    borderColor: '#34c759',
    borderWidth: 3,
  },
  notFoundFrame: {
    borderColor: '#0a84ff',
    borderWidth: 3,
  },
  errorFrame: {
    borderColor: '#ff453a',
    borderWidth: 3,
  },
  message: {
    position: 'absolute',
    top: 16,
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
  resultCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34c759',
    marginBottom: 14,
  },
  notFoundCircle: {
    backgroundColor: '#0a84ff',
  },
  resultSymbol: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
  },
  errorSymbol: {
    color: '#ffffff',
    backgroundColor: '#ff453a',
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 70,
    marginBottom: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
  caption: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    marginTop: 5,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowRadius: 4,
  },
});
