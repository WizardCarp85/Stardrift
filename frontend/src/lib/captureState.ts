export type CaptureMode = "idle" | "speak" | "type" | "upload";

export interface CaptureStateDetail {
  mode: CaptureMode;
  isListening?: boolean;
}

const EVENT_NAME = "stardrift-capture-state-change";

export function emitCaptureState(detail: CaptureStateDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function subscribeCaptureState(
  callback: (detail: CaptureStateDetail) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const custom = event as CustomEvent<CaptureStateDetail>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

