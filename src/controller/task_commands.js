import {
  MAX_TASK_DESCRIPTION_LENGTH,
  MAX_TASKS_PER_USER,
  normalizeTaskUsername,
} from "./task_store.js";

const MAX_CHAT_REPLY_LENGTH = 430;

const errorMessages = {
  "invalid-user": "No pude identificar tu usuario de Twitch.",
  "empty-description": "La descripción no puede estar vacía.",
  "description-too-long": `La descripción no puede superar ${MAX_TASK_DESCRIPTION_LENGTH} caracteres.`,
  "task-limit-reached": `Ya tienes ${MAX_TASKS_PER_USER} tareas pendientes. Completa una antes de agregar otra.`,
  "task-not-found": "No encontré esa tarea entre las tuyas.",
  "task-already-completed": "Esa tarea ya está completada.",
  "no-pending-tasks": "No tienes tareas pendientes para completar.",
  "id-generation-failed": "No pude generar un identificador único para la tarea.",
  "storage-unavailable": "No está disponible el almacenamiento local de tareas.",
  "storage-read-failed": "No pude leer las tareas guardadas en este navegador.",
  "storage-write-failed": "No pude guardar las tareas. Comprueba el almacenamiento del navegador.",
  "corrupt-data": "Los datos de tareas están dañados; no se modificaron.",
  "invalid-data": "Los datos guardados de tareas no son válidos; no se modificaron.",
};

const taskId = (value) => value?.trim().toLowerCase();

const listReplies = (username, tasks) => {
  if (tasks.length === 0) {
    return [`@${username}, no tienes tareas (0/${MAX_TASKS_PER_USER}). Usa !add <descripción>.`];
  }

  const replies = [`@${username}, tus tareas (${tasks.length}/${MAX_TASKS_PER_USER}):`];
  let chunk = "";

  for (const task of tasks) {
    const line = `${task.status === "completed" ? "✓" : "·"} ${task.id} ${task.description}`;
    const candidate = chunk ? `${chunk} | ${line}` : line;
    if (candidate.length > MAX_CHAT_REPLY_LENGTH && chunk) {
      replies.push(chunk);
      chunk = line;
    } else {
      chunk = candidate;
    }
  }

  if (chunk) replies.push(chunk);
  return replies;
};

export const handleTaskCommand = (message, username, store) => {
  const match =
    /^!(tarea|add|list|edit|complete|del|done)(?:\s+([\s\S]*))?$/i.exec(
      message.trim()
    );
  if (!match) return null;

  const command = match[1].toLowerCase();
  let action;
  let rest = match[2] || "";
  if (command === "tarea") {
    const [subcommand, ...args] = rest.trim().split(/\s+/);
    action = subcommand?.toLowerCase();
    rest = args.join(" ");
  } else {
    action = {
      add: "agregar",
      list: "listar",
      edit: "editar",
      complete: "completar",
      del: "eliminar",
      done: "done",
    }[command];
  }

  const normalizedUser = normalizeTaskUsername(username);
  if (!normalizedUser) {
    return { replies: ["No pude identificar tu usuario de Twitch."] };
  }

  let result;
  let operation;
  let reply;

  switch (action) {
    case "agregar":
      result = store.add(normalizedUser, rest);
      operation = "added";
      reply = (task, tasks, replacedTask) =>
        `@${normalizedUser}, tarea ${task.id} agregada (${tasks.length}/${MAX_TASKS_PER_USER}).${
          replacedTask
            ? ` Se retiró la tarea completada ${replacedTask.id} para dejarle espacio.`
            : ""
        }`;
      break;
    case "editar": {
      const [id, ...descriptionParts] = rest.trim().split(/\s+/);
      if (!id || !descriptionParts.length) {
        return {
          replies: [`@${normalizedUser}, uso: !edit <id> <descripción>.`],
        };
      }
      result = store.edit(normalizedUser, taskId(id), descriptionParts.join(" "));
      operation = "edited";
      reply = (task) => `@${normalizedUser}, tarea ${task.id} actualizada.`;
      break;
    }
    case "completar":
      if (!rest.trim() || /\s/.test(rest.trim())) {
        return {
          replies: [`@${normalizedUser}, uso: !complete <id>.`],
        };
      }
      result = store.complete(normalizedUser, taskId(rest));
      operation = "completed";
      reply = (task) => `@${normalizedUser}, tarea ${task.id} completada.`;
      break;
    case "done":
      if (rest.trim()) {
        return { replies: [`@${normalizedUser}, uso: !done.`] };
      }
      result = store.completeFirst(normalizedUser);
      operation = "completed";
      reply = (task) =>
        `@${normalizedUser}, tarea ${task.id} completada con !done.`;
      break;
    case "eliminar":
      if (!rest.trim() || /\s/.test(rest.trim())) {
        return {
          replies: [`@${normalizedUser}, uso: !del <id>.`],
        };
      }
      result = store.remove(normalizedUser, taskId(rest));
      operation = "deleted";
      reply = (task) => `@${normalizedUser}, tarea ${task.id} eliminada.`;
      break;
    case "listar": {
      if (rest.trim()) {
        return {
          replies: [`@${normalizedUser}, uso: !list.`],
        };
      }
      result = store.list(normalizedUser);
      if (!result.ok) {
        return { replies: [`@${normalizedUser}, ${errorMessages[result.error] || "no pude consultar tus tareas."}`] };
      }
      return { replies: listReplies(normalizedUser, result.tasks) };
    }
    default:
      return {
        replies: [
          `@${normalizedUser}, usa !add <descripción>, !list, !edit <id> <texto>, !complete <id>, !del <id> o !done. También puedes usar !tarea.`,
        ],
      };
  }

  if (!result.ok) {
    return {
      replies: [
        `@${normalizedUser}, ${errorMessages[result.error] || "no pude completar la operación."}`,
      ],
    };
  }

  return {
    replies: [reply(result.task, result.tasks, result.replacedTask)],
    presentation: {
      username: normalizedUser,
      operation,
      tasks: result.tasks,
    },
  };
};
