import {
  Camera,
  useFrameProcessor,
  useCameraDevice,
  useCameraPermission,
  runAtTargetFps,
} from 'react-native-vision-camera';
import { OcrResult, performOcr } from '@bear-block/vision-camera-ocr';
import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRunOnJS } from 'react-native-worklets-core';

import { ScoredOcrResult } from '@/types';

import { calculateResultScore } from './helpers';
import {
  RecognitionLanguages,
  SettlingFrameCount,
  TargetFPS,
} from './constants';
import { ScanFeedback, ScanPhase } from './feedback';

export interface NutritionFactLabellerCameraProps {
  onScanComplete: (result: ScoredOcrResult) => void;
}

export function NutritionFactLabellerCamera({
  onScanComplete,
}: NutritionFactLabellerCameraProps) {
  const { hasPermission, requestPermission } = useCameraPermission();
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const device = useCameraDevice('back');

  const [scanPhase, setScanPhase] = useState<ScanPhase>('scanning');
  const isCameraActive = scanPhase !== 'processing';

  const bestResultRef = useRef<ScoredOcrResult | null>(null);
  const remainingFramesRef = useRef<number>(SettlingFrameCount);

  useEffect(() => {
    if (scanPhase === 'processing' && bestResultRef.current) {
      onScanComplete(bestResultRef.current);
    }
  }, [onScanComplete, scanPhase]);

  const handleResult = useRunOnJS((result: OcrResult) => {
    if (remainingFramesRef.current == 0) return;

    const candidate = calculateResultScore(result);

    if (candidate) {
      const current = bestResultRef.current;
      if (candidate.pass) {
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
  }, []);

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

      <ScanFeedback phase={scanPhase} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
