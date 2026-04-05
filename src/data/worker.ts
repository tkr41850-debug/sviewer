import { parseAndProcess } from './parser';
import type { ParseResult } from './types';

interface ParseMessage {
  type: 'PARSE';
  text: string;
}

interface WorkerSuccessResult {
  type: 'success';
  result: ParseResult;
}

interface WorkerErrorResult {
  type: 'error';
  error: string;
}

type WorkerResult = WorkerSuccessResult | WorkerErrorResult;

self.onmessage = (e: MessageEvent<ParseMessage>) => {
  if (e.data.type === 'PARSE') {
    try {
      const result = parseAndProcess(e.data.text);
      const response: WorkerResult = { type: 'success', result };
      self.postMessage(response);
    } catch (err) {
      const response: WorkerResult = {
        type: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(response);
    }
  }
};
