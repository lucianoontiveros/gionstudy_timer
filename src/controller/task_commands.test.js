import assert from "node:assert/strict";
import { test } from "node:test";
import { handleTaskCommand } from "./task_commands.js";
import { createTaskStore } from "./task_store.js";

const createMemoryStore = () => {
  let value = null;
  const storage = {
    getItem() {
      return value;
    },
    setItem(_key, nextValue) {
      value = nextValue;
    },
  };
  return createTaskStore(storage);
};

test("supports add, list, edit, complete and delete commands", () => {
  const store = createMemoryStore();
  const added = handleTaskCommand("!tarea agregar Leer un capítulo", "Alice", store);

  assert.match(added.replies[0], /tarea [a-z0-9]+ agregada/);
  assert.equal(added.presentation.operation, "added");
  assert.equal(added.presentation.tasks[0].description, "Leer un capítulo");

  const id = added.presentation.tasks[0].id;
  const listed = handleTaskCommand("!tarea listar", "alice", store);
  assert.match(listed.replies.join(" "), new RegExp(id));
  assert.equal(listed.presentation, undefined);

  const edited = handleTaskCommand(
    `!tarea editar ${id} Leer dos capítulos`,
    "alice",
    store
  );
  assert.equal(edited.presentation.operation, "edited");
  assert.equal(edited.presentation.tasks[0].description, "Leer dos capítulos");

  const completed = handleTaskCommand(
    `!tarea completar ${id}`,
    "alice",
    store
  );
  assert.equal(completed.presentation.operation, "completed");
  assert.equal(completed.presentation.tasks[0].status, "completed");

  const deleted = handleTaskCommand(`!tarea eliminar ${id}`, "alice", store);
  assert.equal(deleted.presentation.operation, "deleted");
  assert.equal(deleted.presentation.tasks.length, 0);
});

test("returns usage, validation and ownership errors without presentations", () => {
  const store = createMemoryStore();
  const empty = handleTaskCommand("!tarea agregar   ", "alice", store);
  assert.match(empty.replies[0], /no puede estar vacía/);
  assert.equal(empty.presentation, undefined);

  const unknown = handleTaskCommand(
    "!tarea editar missing New description",
    "alice",
    store
  );
  assert.match(unknown.replies[0], /No encontré esa tarea/);

  const added = handleTaskCommand("!tarea agregar Private task", "alice", store);
  const id = added.presentation.tasks[0].id;
  const otherUser = handleTaskCommand(`!tarea eliminar ${id}`, "bob", store);
  assert.match(otherUser.replies[0], /No encontré esa tarea/);
  assert.equal(store.list("alice").tasks.length, 1);

  assert.match(
    handleTaskCommand("!tarea unknown", "alice", store).replies[0],
    /usa !add/
  );
});

test("supports short task aliases and !done completes the first pending task", () => {
  const store = createMemoryStore();
  const firstAdded = handleTaskCommand("!add First task", "alice", store);
  const secondAdded = handleTaskCommand("!add Second task", "alice", store);
  const firstId = firstAdded.presentation.tasks[0].id;
  const secondId = secondAdded.presentation.tasks[1].id;

  assert.ok(firstId.length <= 4);
  assert.ok(secondId.length <= 4);
  assert.match(handleTaskCommand("!list", "alice", store).replies.join(" "), /First task/);

  const edited = handleTaskCommand(`!edit ${firstId} Updated first`, "alice", store);
  assert.equal(edited.presentation.tasks[0].description, "Updated first");

  const done = handleTaskCommand("!done", "alice", store);
  assert.match(done.replies[0], new RegExp(`tarea ${firstId} completada`));
  assert.equal(done.presentation.tasks[0].status, "completed");
  assert.equal(done.presentation.tasks[1].status, "pending");

  const completed = handleTaskCommand(`!complete ${secondId}`, "alice", store);
  assert.equal(completed.presentation.tasks[1].status, "completed");
  assert.equal(
    handleTaskCommand("!done", "alice", store).replies[0],
    "@alice, No tienes tareas pendientes para completar."
  );

  const deleted = handleTaskCommand(`!del ${firstId}`, "alice", store);
  assert.equal(deleted.presentation.tasks.length, 1);
});
