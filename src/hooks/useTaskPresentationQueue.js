import { useCallback, useEffect, useRef, useState } from "react";
import { selectTaskBackground } from "../controller/task_backgrounds";
import { createTaskPresentationQueue } from "../controller/task_presentation_queue";

export const useTaskPresentationQueue = () => {
  const [presentation, setPresentation] = useState(null);
  const queueRef = useRef(null);
  const previousBackgroundRef = useRef(null);
  const unavailableBackgroundsRef = useRef(new Set());

  useEffect(() => {
    const queue = createTaskPresentationQueue({ onPresent: setPresentation });
    queueRef.current = queue;

    return () => {
      queue.dispose();
      queueRef.current = null;
    };
  }, []);

  const enqueuePresentation = useCallback((event) => {
    const background = selectTaskBackground(
      previousBackgroundRef.current,
      Math.random,
      unavailableBackgroundsRef.current
    );
    if (background) previousBackgroundRef.current = background;

    queueRef.current?.enqueue({ ...event, background });
  }, []);

  const markBackgroundUnavailable = useCallback((background) => {
    unavailableBackgroundsRef.current.add(background);
  }, []);

  return { presentation, enqueuePresentation, markBackgroundUnavailable };
};
