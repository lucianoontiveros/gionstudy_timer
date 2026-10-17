export const TASK_STORAGE_KEY = "gionstudyTasks";
export const MAX_TASKS_PER_USER = 10;
export const MAX_TASK_DESCRIPTION_LENGTH = 120;

const USERNAME_PATTERN = /^[a-z0-9_]{1,25}$/;
const TASK_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const NEW_TASK_ID_PATTERN = /^[a-z0-9]{4}$/;

const failure = (error) => ({ ok: false, error });

export const normalizeTaskUsername = (username) => {
  if (typeof username !== "string") return null;
  const normalized = username.trim().replace(/^@/, "").toLowerCase();
  return USERNAME_PATTERN.test(normalized) ? normalized : null;
};

const isValidTimestamp = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const normalizeDescription = (description) => description.trim().replace(/\s+/g, " ");

const isValidTask = (task, username) =>
  task !== null &&
  typeof task === "object" &&
  !Array.isArray(task) &&
  typeof task.id === "string" &&
  TASK_ID_PATTERN.test(task.id) &&
  task.ownerId === username &&
  typeof task.description === "string" &&
  task.description.trim().length > 0 &&
  task.description.length <= MAX_TASK_DESCRIPTION_LENGTH &&
  (task.status === "pending" || task.status === "completed") &&
  isValidTimestamp(task.createdAt) &&
  (task.updatedAt === undefined || isValidTimestamp(task.updatedAt));

const createTaskId = () => {
  const randomValue = globalThis.crypto?.getRandomValues
    ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 36 ** 4);
  return (randomValue % 36 ** 4).toString(36).padStart(4, "0");
};

const getLocalStorage = () => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

export const createTaskStore = (
  storage = getLocalStorage(),
  idGenerator = createTaskId
) => {
  const readUsers = () => {
    if (!storage) return failure("storage-unavailable");

    let serialized;
    try {
      serialized = storage.getItem(TASK_STORAGE_KEY);
    } catch {
      return failure("storage-read-failed");
    }

    if (serialized === null) {
      return { ok: true, users: Object.create(null) };
    }

    let document;
    try {
      document = JSON.parse(serialized);
    } catch {
      return failure("corrupt-data");
    }

    if (
      document === null ||
      typeof document !== "object" ||
      Array.isArray(document) ||
      document.version !== 1 ||
      document.users === null ||
      typeof document.users !== "object" ||
      Array.isArray(document.users)
    ) {
      return failure("invalid-data");
    }

    const users = Object.create(null);
    const allTaskIds = new Set();
    for (const [username, tasks] of Object.entries(document.users)) {
      if (
        normalizeTaskUsername(username) !== username ||
        !Array.isArray(tasks) ||
        tasks.length > MAX_TASKS_PER_USER
      ) {
        return failure("invalid-data");
      }

      const ids = new Set();
      for (const task of tasks) {
        if (
          !isValidTask(task, username) ||
          ids.has(task.id) ||
          allTaskIds.has(task.id)
        ) {
          return failure("invalid-data");
        }
        ids.add(task.id);
        allTaskIds.add(task.id);
      }
      users[username] = tasks.map((task) => ({ ...task }));
    }

    const shortIds = new Set(
      Object.values(users)
        .flat()
        .map((task) => task.id)
        .filter((id) => id.length <= 4)
    );
    let migrated = false;
    for (const tasks of Object.values(users)) {
      for (const task of tasks) {
        if (task.id.length <= 4) continue;

        let id;
        for (let attempt = 0; attempt < 32; attempt += 1) {
          id = idGenerator();
          if (
            typeof id === "string" &&
            NEW_TASK_ID_PATTERN.test(id) &&
            !shortIds.has(id)
          ) {
            break;
          }
        }
        if (
          typeof id !== "string" ||
          !NEW_TASK_ID_PATTERN.test(id) ||
          shortIds.has(id)
        ) {
          return failure("id-generation-failed");
        }

        task.id = id;
        shortIds.add(id);
        migrated = true;
      }
    }

    if (migrated) {
      const writeResult = writeUsers(users);
      if (!writeResult.ok) return writeResult;
    }

    return { ok: true, users };
  };

  const writeUsers = (users) => {
    if (!storage) return failure("storage-unavailable");
    try {
      storage.setItem(TASK_STORAGE_KEY, JSON.stringify({ version: 1, users }));
      return { ok: true };
    } catch {
      return failure("storage-write-failed");
    }
  };

  const getUserTasks = (username) => {
    const normalized = normalizeTaskUsername(username);
    if (!normalized) return failure("invalid-user");

    const result = readUsers();
    if (!result.ok) return result;
    return { ok: true, username: normalized, tasks: result.users[normalized] || [] };
  };

  const mutateUserTasks = (username, mutate) => {
    const normalized = normalizeTaskUsername(username);
    if (!normalized) return failure("invalid-user");

    const result = readUsers();
    if (!result.ok) return result;

    const tasks = result.users[normalized] || [];
    const mutation = mutate(tasks, result.users, normalized);
    if (!mutation.ok) return mutation;

    const users = Object.assign(Object.create(null), result.users);
    if (mutation.tasks.length > 0) {
      users[normalized] = mutation.tasks;
    } else {
      delete users[normalized];
    }

    const writeResult = writeUsers(users);
    if (!writeResult.ok) return writeResult;
    return {
      ok: true,
      username: normalized,
      tasks: mutation.tasks.map((task) => ({ ...task })),
      task: mutation.task ? { ...mutation.task } : undefined,
    };
  };

  return {
    list: getUserTasks,
    add(username, description) {
      if (typeof description !== "string" || !description.trim()) {
        return failure("empty-description");
      }
      const normalizedDescription = normalizeDescription(description);
      if (normalizedDescription.length > MAX_TASK_DESCRIPTION_LENGTH) {
        return failure("description-too-long");
      }

      return mutateUserTasks(username, (tasks, users, ownerId) => {
        if (tasks.length >= MAX_TASKS_PER_USER) {
          return failure("task-limit-reached");
        }

        let id;
        const existingIds = new Set(
          Object.values(users).flatMap((userTasks) =>
            userTasks.map((task) => task.id)
          )
        );
        for (let attempt = 0; attempt < 32; attempt += 1) {
          id = idGenerator();
          if (
            typeof id === "string" &&
            NEW_TASK_ID_PATTERN.test(id) &&
            !existingIds.has(id)
          ) {
            break;
          }
        }
        if (
          typeof id !== "string" ||
          !NEW_TASK_ID_PATTERN.test(id) ||
          existingIds.has(id)
        ) {
          return failure("id-generation-failed");
        }

        const task = {
          id,
          ownerId,
          description: normalizedDescription,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        return { ok: true, tasks: [...tasks, task], task };
      });
    },
    edit(username, id, description) {
      if (typeof description !== "string" || !description.trim()) {
        return failure("empty-description");
      }
      const normalizedDescription = normalizeDescription(description);
      if (normalizedDescription.length > MAX_TASK_DESCRIPTION_LENGTH) {
        return failure("description-too-long");
      }

      return mutateUserTasks(username, (tasks) => {
        const index = tasks.findIndex((task) => task.id === id);
        if (index === -1) return failure("task-not-found");

        const task = {
          ...tasks[index],
          description: normalizedDescription,
          updatedAt: new Date().toISOString(),
        };
        const updatedTasks = [...tasks];
        updatedTasks[index] = task;
        return { ok: true, tasks: updatedTasks, task };
      });
    },
    complete(username, id) {
      return mutateUserTasks(username, (tasks) => {
        const index = tasks.findIndex((task) => task.id === id);
        if (index === -1) return failure("task-not-found");
        if (tasks[index].status === "completed") {
          return failure("task-already-completed");
        }

        const task = {
          ...tasks[index],
          status: "completed",
          updatedAt: new Date().toISOString(),
        };
        const updatedTasks = [...tasks];
        updatedTasks[index] = task;
        return { ok: true, tasks: updatedTasks, task };
      });
    },
    completeFirst(username) {
      return mutateUserTasks(username, (tasks) => {
        const index = tasks.findIndex((task) => task.status === "pending");
        if (index === -1) return failure("no-pending-tasks");

        const task = {
          ...tasks[index],
          status: "completed",
          updatedAt: new Date().toISOString(),
        };
        const updatedTasks = [...tasks];
        updatedTasks[index] = task;
        return { ok: true, tasks: updatedTasks, task };
      });
    },
    remove(username, id) {
      return mutateUserTasks(username, (tasks) => {
        const index = tasks.findIndex((task) => task.id === id);
        if (index === -1) return failure("task-not-found");

        const task = tasks[index];
        return {
          ok: true,
          tasks: tasks.filter((candidate) => candidate.id !== id),
          task,
        };
      });
    },
  };
};
