export const TASK_PRESENTATION_DURATION_MS = 7000;

export const createTaskPresentationQueue = ({
  onPresent,
  durationMs = TASK_PRESENTATION_DURATION_MS,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
}) => {
  const pending = [];
  let current = null;
  let timer = null;
  let disposed = false;

  const showNext = () => {
    if (disposed || current || pending.length === 0) return;

    current = pending.shift();
    onPresent(current);
    timer = setTimer(() => {
      timer = null;
      current = null;
      if (pending.length > 0) {
        showNext();
      } else {
        onPresent(null);
      }
    }, durationMs);
  };

  return {
    enqueue(presentation) {
      if (disposed) return;
      const snapshot = Object.freeze({
        username: presentation.username,
        operation: presentation.operation,
        background: presentation.background,
        tasks: Object.freeze(
          presentation.tasks.map((task) => Object.freeze({ ...task }))
        ),
      });
      pending.push(snapshot);
      showNext();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (timer !== null) {
        clearTimer(timer);
        timer = null;
      }
      pending.length = 0;
      current = null;
      onPresent(null);
    },
    get pendingCount() {
      return pending.length;
    },
  };
};
