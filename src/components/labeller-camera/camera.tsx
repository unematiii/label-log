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

import { calculateResultScore } from './helpers';
import { ScoredOcrResult } from './types';
import { ScanFeedback, ScanPhase } from './feedback';

export function NutritionFactLabellerCamera() {
    const { hasPermission, requestPermission } = useCameraPermission();
    useEffect(() => {
        if (!hasPermission) requestPermission();
    }, [hasPermission, requestPermission]);

    const device = useCameraDevice('back');

    const remainingFramesRef = useRef<number>(3);
    const [scanPhase, setScanPhase] = useState<ScanPhase>('scanning');

    const bestResultRef = useRef<ScoredOcrResult | null>(null);
    const [lastResult, setResult] = useState<null | ScoredOcrResult>(
        bestResultRef.current
    );

    const handleResult = useRunOnJS((result: OcrResult) => {
        const candidate = calculateResultScore(result);

        if (candidate) {
            const current = bestResultRef.current;
            if (candidate.pass) {
                if (!current) {
                    setScanPhase('settling');
                }

                if (!current || candidate.score >= current.score) {
                    bestResultRef.current = candidate;
                    setResult(candidate);
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

            runAtTargetFps(3, () => {
                'worklet';
                const result = performOcr(frame, {
                    includeBoxes: true,
                    includeConfidence: true,
                    recognitionLevel: 'accurate',
                    recognitionLanguages: ['en-US', 'et-EE', 'nl-NL'],
                    usesLanguageCorrection: true,
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
                isActive={true}
                frameProcessor={frameProcessor}
            />

            <ScanFeedback phase={scanPhase} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});
