import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TASK_PRESENTATION_DURATION_MS,
  createTaskPresentationQueue,
} from "./task_presentation_queue.js";
import {
  selectTaskBackground,
  TASK_BACKGROUNDS,
} from "./task_backgrounds.js";

const createFakeTimers = () => {
  let nextId = 0;
  const timers = new Map();
  return {
    timers,
    setTimer(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    advance(id) {
      const timer = timers.get(id);
      assert.ok(timer);
      timers.delete(id);
      timer.callback();
    },
  };
};

test("queues immutable presentations serially without extending the active timer", () => {
  const fakeTimers = createFakeTimers();
  const shown = [];
  const queue = createTaskPresentationQueue({
    onPresent: (presentation) => shown.push(presentation),
    setTimer: fakeTimers.setTimer,
    clearTimer: fakeTimers.clearTimer,
  });

  const firstTasks = [{ id: "first", description: "First task", status: "pending" }];
  queue.enqueue({
    username: "alice",
    operation: "added",
    tasks: firstTasks,
    background: "/img/first.png",
  });
  firstTasks[0].description = "Mutated after enqueue";
  const activeTimerId = fakeTimers.timers.keys().next().value;

  queue.enqueue({
    username: "bob",
    operation: "completed",
    tasks: [{ id: "second", description: "Second task", status: "completed" }],
    background: "/img/second.png",
  });

  assert.equal(shown.length, 1);
  assert.equal(shown[0].tasks[0].description, "First task");
  assert.equal(queue.pendingCount, 1);
  assert.equal(fakeTimers.timers.size, 1);
  assert.equal(
    fakeTimers.timers.get(activeTimerId).delay,
    TASK_PRESENTATION_DURATION_MS
  );

  fakeTimers.advance(activeTimerId);
  assert.equal(shown.length, 2);
  assert.equal(shown[1].username, "bob");
  assert.equal(queue.pendingCount, 0);

  const secondTimerId = fakeTimers.timers.keys().next().value;
  fakeTimers.advance(secondTimerId);
  assert.equal(shown[shown.length - 1], null);
  queue.dispose();
});

test("disposes active and pending presentations and cancels the timer", () => {
  const fakeTimers = createFakeTimers();
  const shown = [];
  const queue = createTaskPresentationQueue({
    onPresent: (presentation) => shown.push(presentation),
    setTimer: fakeTimers.setTimer,
    clearTimer: fakeTimers.clearTimer,
  });
  queue.enqueue({ username: "alice", operation: "added", tasks: [], background: null });
  queue.enqueue({ username: "bob", operation: "deleted", tasks: [], background: null });

  queue.dispose();
  assert.equal(fakeTimers.timers.size, 0);
  assert.equal(shown[shown.length - 1], null);
  assert.equal(queue.pendingCount, 0);
});

test("selects valid public backgrounds and avoids the previous one", () => {
  assert.ok(TASK_BACKGROUNDS.length > 1);
  assert.ok(
    TASK_BACKGROUNDS.every(
      (background) =>
        !background.endsWith("/kero_break.png") &&
        !background.endsWith("/kero_produc.png")
    )
  );
  const imageDirectory = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../public/img"
  );
  for (const background of TASK_BACKGROUNDS) {
    const fileName = decodeURIComponent(background.replace(/^\/img\//, ""));
    assert.ok(existsSync(resolve(imageDirectory, fileName)), background);
  }

  const previous = TASK_BACKGROUNDS[0];
  const selected = selectTaskBackground(previous, () => 0);
  assert.notEqual(selected, previous);
  assert.ok(selected.startsWith("/img/"));
  assert.equal(selectTaskBackground(null, () => 0), TASK_BACKGROUNDS[0]);
  assert.equal(
    selectTaskBackground(previous, () => 0, TASK_BACKGROUNDS.slice(1)),
    previous
  );
  assert.equal(
    selectTaskBackground(null, () => 0, TASK_BACKGROUNDS),
    null
  );
});
