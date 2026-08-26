import { OcrResult } from '@bear-block/vision-camera-ocr';
import { useCallback, useEffect, useRef, useState } from 'react';

import { extractNutrition } from './client';
import { ExtractNutritionResponse } from './types';
import { normalizeOcrResult } from './helpers';

type ExtractionState =
  | {
      status: 'idle';
      data: null;
      error: null;
    }
  | {
      status: 'processing';
      data: null;
      error: null;
    }
  | {
      status: 'success';
      data: ExtractNutritionResponse;
      error: null;
    }
  | {
      status: 'error';
      data: null;
      error: Error;
    };

const initialState: ExtractionState = {
  status: 'idle',
  data: null,
  error: null,
};

export function useNutritionExtractionApi() {
  const [state, setState] = useState<ExtractionState>(initialState);

  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const cancel = useCallback(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const extract = useCallback(
    async (input: OcrResult): Promise<ExtractNutritionResponse | null> => {
      // Cancel a previous extraction if one is still running.
      controllerRef.current?.abort();

      const controller = new AbortController();
      const requestId = ++requestIdRef.current;

      controllerRef.current = controller;

      setState({
        status: 'processing',
        data: null,
        error: null,
      });

      try {
        const result = await extractNutrition(
          normalizeOcrResult(input),
          controller.signal
        );

        // Ignore a result from an outdated request.
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return null;
        }

        setState({
          status: 'success',
          data: result,
          error: null,
        });

        return result;
      } catch (error) {
        // Cancellation is expected and should not become UI error state.
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return null;
        }

        const normalizedError =
          error instanceof Error
            ? error
            : new Error('Nutrition extraction failed');

        setState({
          status: 'error',
          data: null,
          error: normalizedError,
        });

        return null;
      } finally {
        if (requestId === requestIdRef.current) {
          controllerRef.current = null;
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);

  return {
    ...state,
    extract,
    cancel,
    reset,
    isProcessing: state.status === 'processing',
  };
}
