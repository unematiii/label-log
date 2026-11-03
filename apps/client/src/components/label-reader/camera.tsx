import {
  Camera,
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { OcrResult, performOcr } from '@bear-block/vision-camera-ocr';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRunOnJS } from 'react-native-worklets-core';
import { useIsFocused } from 'expo-router';

import { ScoredOcrResult } from '@/types';

import { calculateResultScore, type LabelReaderMode } from './helpers';
import {
  RecognitionLanguages,
  SettlingFrameCount,
  TargetFPS,
} from './constants';
import { ScanFeedback, ScanPhase } from './feedback';

const CapturedFeedbackDurationMs = 700;

export interface LabelReaderProps {
  mode?: LabelReaderMode;
  onScanComplete: (result: ScoredOcrResult) => void;
  onAutoDetect?: (result: ScoredOcrResult) => void;
  onSkip?: () => void;
}

export function LabelReaderCamera({
  mode = 'nutrition',
  onScanComplete,
  onAutoDetect,
  onSkip,
}: LabelReaderProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const device = useCameraDevice('back');

  const [scanPhase, setScanPhase] = useState<ScanPhase>('scanning');
  const [hasCandidate, setHasCandidate] = useState(false);
  const isCameraActive = isFocused && scanPhase !== 'processing';

  const bestResultRef = useRef<ScoredOcrResult | null>(null);
  const remainingFramesRef = useRef<number>(SettlingFrameCount);
  const capturedRef = useRef(false);

  useEffect(() => {
    if (scanPhase === 'processing' && bestResultRef.current) {
      onScanComplete(bestResultRef.current);
    }
  }, [onScanComplete, scanPhase]);

  useEffect(() => {
    if (mode !== 'product-name' || scanPhase !== 'settling') return;

    const timeout = setTimeout(
      () => setScanPhase('processing'),
      CapturedFeedbackDurationMs
    );

    return () => clearTimeout(timeout);
  }, [mode, scanPhase]);

  const handleResult = useRunOnJS(
    (result: OcrResult) => {
      if (remainingFramesRef.current === 0 || capturedRef.current) return;

      const candidate = calculateResultScore(result, mode);

      if (candidate) {
        const current = bestResultRef.current;
        if (!current || candidate.score >= current.score) {
          bestResultRef.current = candidate;
        }
        if (candidate.pass) {
          if (mode === 'product-name') {
            if (!current || candidate.score >= current.score) {
              bestResultRef.current = candidate;
            }
            if (!hasCandidate) setHasCandidate(true);
            return;
          }

          if (!current) {
            setScanPhase('settling');
          }

          if (!current || candidate.score >= current.score) {
            bestResultRef.current = candidate;
          }
        }
      }

      if (bestResultRef.current && remainingFramesRef.current >= 0) {
        remainingFramesRef.current -= 1;

        if (remainingFramesRef.current === 0) {
          setScanPhase('processing');
        }
      }
    },
    [hasCandidate, mode]
  );

  const handleCapture = () => {
    if (capturedRef.current || !bestResultRef.current) return;
    capturedRef.current = true;
    setScanPhase('settling');
  };

  const handleAutoDetect = () => {
    if (capturedRef.current || !onAutoDetect) return;
    capturedRef.current = true;
    onAutoDetect(
      bestResultRef.current ?? {
        text: '',
        blocks: [],
        score: 0,
        pass: false,
      }
    );
    setScanPhase('processing');
  };

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      runAtTargetFps(TargetFPS, () => {
        'worklet';
        const result = performOcr(frame, {
          includeBoxes: true,
          includeConfidence: true,
          recognitionLevel: 'accurate',
          recognitionLanguages: RecognitionLanguages,
          usesLanguageCorrection: false,
        });

        if (result) {
          handleResult(result);
        }
      });
    },
    [handleResult]
  );

  if (device == null) return null;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isCameraActive}
        frameProcessor={isCameraActive ? frameProcessor : undefined}
      />

      <ScanFeedback phase={scanPhase} mode={mode} />
      {mode === 'product-name' && scanPhase === 'scanning' ? (
        <View style={styles.captureActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture product name"
            disabled={!hasCandidate || scanPhase !== 'scanning'}
            onPress={handleCapture}
            style={[
              styles.captureButton,
              !hasCandidate && styles.disabledButton,
            ]}
          >
            <Text style={styles.captureButtonText}>Capture product name</Text>
          </Pressable>
          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSkip}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Skip name scan</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {mode === 'nutrition' && scanPhase === 'scanning' && onAutoDetect ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Auto-detect nutrition"
          onPress={handleAutoDetect}
          style={styles.autoDetectButton}
        >
          <Text style={styles.autoDetectButtonText}>Auto-detect</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  captureActions: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 28,
    alignItems: 'center',
    gap: 12,
  },
  captureButton: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: '#ffffff',
  },
  disabledButton: { opacity: 0.55 },
  captureButtonText: { color: '#111111', fontSize: 16, fontWeight: '600' },
  skipButton: { padding: 10 },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  autoDetectButton: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 32,
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#ffffff',
  },
  autoDetectButtonText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
});
