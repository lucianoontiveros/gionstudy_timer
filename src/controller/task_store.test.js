import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASKS_PER_USER,
  TASK_STORAGE_KEY,
  createTaskStore,
} from "./task_store.js";

const createMemoryStorage = (initialValue = null) => {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, TASK_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, TASK_STORAGE_KEY);
      value = nextValue;
    },
    read() {
      return value;
    },
  };
};

test("stores tasks independently per normalized Twitch user", () => {
  const store = createTaskStore(createMemoryStorage());
  const aliceTask = store.add("Alice", "Read chapter one");
  const bobTask = store.add("bob", "Write notes");

  assert.equal(aliceTask.ok, true);
  assert.equal(bobTask.ok, true);
  assert.equal(store.list("@ALICE").tasks.length, 1);
  assert.equal(store.list("bob").tasks.length, 1);
  assert.equal(store.list("carol").tasks.length, 0);
  assert.equal(store.edit("bob", aliceTask.task.id, "Take Alice's task").error, "task-not-found");
  assert.equal(store.remove("bob", aliceTask.task.id).error, "task-not-found");
});

test("safely stores Twitch names that overlap with JavaScript object properties", () => {
  const store = createTaskStore(createMemoryStorage());
  const result = store.add("__proto__", "Prototype-safe task");

  assert.equal(result.ok, true);
  assert.equal(store.list("__proto__").tasks[0].description, "Prototype-safe task");
  assert.equal(store.list("constructor").tasks.length, 0);
});

test("assigns globally unique IDs and records the owning Twitch user", () => {
  const storage = createMemoryStorage();
  const generatedIds = ["sam1", "sam1", "oth1"];
  const store = createTaskStore(storage, () => generatedIds.shift());
  const first = store.add("alice", "Alice task");
  const second = store.add("bob", "Bob task");

  assert.equal(first.task.id, "sam1");
  assert.equal(second.task.id, "oth1");
  assert.ok(first.task.id.length <= 4);
  assert.ok(second.task.id.length <= 4);
  assert.equal(first.task.ownerId, "alice");
  assert.equal(second.task.ownerId, "bob");
});

test("migrates existing long task IDs to unique IDs of at most four characters", () => {
  const storage = createMemoryStorage(
    JSON.stringify({
      version: 1,
      users: {
        alice: [
          {
            id: "longtask1",
            ownerId: "alice",
            description: "First legacy task",
            status: "pending",
            createdAt: new Date().toISOString(),
          },
          {
            id: "keep",
            ownerId: "alice",
            description: "Keep short task ID",
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    })
  );
  const store = createTaskStore(storage, () => "new1");

  const tasks = store.list("alice").tasks;
  assert.deepEqual(tasks.map((task) => task.id), ["new1", "keep"]);
  assert.ok(tasks.every((task) => task.id.length <= 4));
  assert.deepEqual(
    JSON.parse(storage.read()).users.alice.map((task) => task.id),
    ["new1", "keep"]
  );
});

test("recovers saved tasks when the page creates a new store instance", () => {
  const storage = createMemoryStorage();
  const firstStore = createTaskStore(storage);
  const created = firstStore.add("alice", "Persist this task");
  const reloadedStore = createTaskStore(storage);

  assert.equal(reloadedStore.list("alice").tasks[0].id, created.task.id);
  assert.equal(
    reloadedStore.list("alice").tasks[0].description,
    "Persist this task"
  );
});

test("rejects empty and overlong descriptions", () => {
  const store = createTaskStore(createMemoryStorage());
  assert.equal(store.add("alice", "   ").error, "empty-description");
  assert.equal(
    store.add("alice", "a".repeat(MAX_TASK_DESCRIPTION_LENGTH + 1)).error,
    "description-too-long"
  );
  assert.equal(store.list("alice").tasks.length, 0);
});

test("keeps ten tasks and replaces the oldest completed task when adding at capacity", () => {
  const store = createTaskStore(createMemoryStorage());
  const tasks = [];
  for (let index = 0; index < MAX_TASKS_PER_USER; index += 1) {
    const result = store.add("alice", `Task ${index}`);
    assert.equal(result.ok, true);
    tasks.push(result.task);
  }

  assert.equal(store.complete("alice", tasks[0].id).ok, true);
  const added = store.add("alice", "Replacement task");
  assert.equal(added.ok, true);
  assert.equal(added.replacedTask.id, tasks[0].id);
  assert.equal(added.tasks.length, MAX_TASKS_PER_USER);
  assert.equal(added.tasks.some((task) => task.id === tasks[0].id), false);
  assert.equal(added.tasks.at(-1).description, "Replacement task");
});

test("does not allow adding above the limit when all tasks are pending", () => {
  const store = createTaskStore(createMemoryStorage());
  for (let index = 0; index < MAX_TASKS_PER_USER; index += 1) {
    assert.equal(store.add("alice", `Task ${index}`).ok, true);
  }

  assert.equal(store.add("alice", "Task eleven").error, "task-limit-reached");
  assert.equal(store.list("alice").tasks.length, MAX_TASKS_PER_USER);
});

test("edits and completes only existing tasks", () => {
  const store = createTaskStore(createMemoryStorage());
  const created = store.add("alice", "Draft");
  const edited = store.edit("alice", created.task.id, "Revised draft");

  assert.equal(edited.task.description, "Revised draft");
  assert.ok(edited.task.updatedAt);
  assert.equal(store.complete("alice", "missing-id").error, "task-not-found");
  assert.equal(store.complete("alice", created.task.id).tasks[0].status, "completed");
  assert.equal(
    store.complete("alice", created.task.id).error,
    "task-already-completed"
  );
});

test("completes the first pending task in insertion order", () => {
  const store = createTaskStore(createMemoryStorage());
  const first = store.add("alice", "First").task;
  const second = store.add("alice", "Second").task;
  store.complete("alice", first.id);

  const completed = store.completeFirst("alice");
  assert.equal(completed.task.id, second.id);
  assert.equal(completed.tasks[0].status, "completed");
  assert.equal(completed.tasks[1].status, "completed");
  assert.equal(store.completeFirst("alice").error, "no-pending-tasks");
});

test("does not overwrite corrupt data or hide storage errors", () => {
  const corruptStorage = createMemoryStorage("{not-json");
  const corruptStore = createTaskStore(corruptStorage);
  assert.equal(corruptStore.add("alice", "Task").error, "corrupt-data");
  assert.equal(corruptStorage.read(), "{not-json");

  const readFailure = createTaskStore({
    getItem() {
      throw new Error("read blocked");
    },
    setItem() {
      assert.fail("must not write after a read failure");
    },
  });
  assert.equal(readFailure.list("alice").error, "storage-read-failed");

  const writeFailure = createTaskStore({
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("quota exceeded");
    },
  });
  assert.equal(writeFailure.add("alice", "Task").error, "storage-write-failed");
  assert.equal(createTaskStore(null).list("alice").error, "storage-unavailable");
});

test("rejects malformed persisted schemas without replacing them", () => {
  const storage = createMemoryStorage(
    JSON.stringify({
      version: 1,
      users: {
        alice: Array.from({ length: MAX_TASKS_PER_USER + 1 }, (_, index) => ({
          id: `task-${index}`,
          ownerId: "alice",
          description: "Task",
          status: "pending",
          createdAt: new Date().toISOString(),
        })),
      },
    })
  );
  const originalValue = storage.read();
  const store = createTaskStore(storage);

  assert.equal(store.list("alice").error, "invalid-data");
  assert.equal(store.add("alice", "New task").error, "invalid-data");
  assert.equal(storage.read(), originalValue);
});
