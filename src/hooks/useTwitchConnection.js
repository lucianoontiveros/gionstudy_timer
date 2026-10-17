import { useEffect, useRef, useState } from "react";
import { twitch_controller } from "../controller/twitch_controller";
import { rememberChatMessage } from "../controller/chat_message_deduplicator";
import { handleTaskCommand } from "../controller/task_commands";
import { createTaskStore } from "../controller/task_store";

const AUTH_FAILURE_PATTERN =
  /login unsuccessful|login authentication failed|error logging in|improperly formatted auth/i;
const INVALID_USERNAME_PATTERN = /invalid nick/i;
const MAX_RECONNECT_DELAY = 30000;

const isAuthenticationFailure = (reason) => {
  const message = typeof reason === "string" ? reason : reason?.message;
  return typeof message === "string" && AUTH_FAILURE_PATTERN.test(message);
};

const isInvalidUsername = (reason) => {
  const message = typeof reason === "string" ? reason : reason?.message;
  return typeof message === "string" && INVALID_USERNAME_PATTERN.test(message);
};

export const useTwitchConnection = (timerHandlers, onTaskPresentation) => {
  const Client = useRef(null);
  const greetedUsers = useRef(new Set());
  const handledTaskMessages = useRef(new Set());
  const qrValueRef = useRef("");
  const handlersRef = useRef(timerHandlers);
  const taskPresentationRef = useRef(onTaskPresentation);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  handlersRef.current = timerHandlers;
  taskPresentationRef.current = onTaskPresentation;

  useEffect(() => {
    let active = true;
    let connectInProgress = false;
    let retryBlocked = false;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    const taskStore = createTaskStore();

    const client = twitch_controller();
    Client.current = client;

    if (!client) {
      setConnectionStatus("configuration-error");
      return () => {
        active = false;
        Client.current = null;
      };
    }

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const requireAuthorization = () => {
      if (retryBlocked) return;

      retryBlocked = true;
      clearReconnectTimer();
      setConnectionStatus("authorization-required");
      console.error(
        "Twitch rejected the chat credentials. A new authorization is required."
      );
    };

    const stopForInvalidUsername = () => {
      retryBlocked = true;
      clearReconnectTimer();
      setConnectionStatus("configuration-error");
      console.error(
        "Twitch rejected the configured bot username. Check VITE_APP_USERNAME."
      );
    };

    let connect;
    const scheduleReconnect = () => {
      if (!active || retryBlocked || reconnectTimer !== null) return;

      const exponent = Math.min(reconnectAttempts, 20);
      const delay = Math.min(1000 * 1.5 ** exponent, MAX_RECONNECT_DELAY);
      reconnectAttempts = Math.min(reconnectAttempts + 1, 20);
      setConnectionStatus("reconnecting");

      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const onConnected = () => {
      if (!active) return;

      clearReconnectTimer();
      reconnectAttempts = 0;
      setConnectionStatus("connected");
    };

    const onDisconnected = (reason) => {
      if (!active) return;

      if (isAuthenticationFailure(reason)) {
        requireAuthorization();
        return;
      }

      if (isInvalidUsername(reason)) {
        stopForInvalidUsername();
        return;
      }

      scheduleReconnect();
    };

    const onError = () => {
      if (active) {
        console.warn(
          "Twitch chat reported a connection error; waiting for its disconnect event."
        );
      }
    };

    const onMessage = (chan, tags, message, self) => {
      if (self) return;

      const args = message.trim().split(/\s+/);
      const command = args[0].toLowerCase();
      const username = tags.username;
      const isSub = tags.badges?.subscriber;
      const isVip = tags.badges?.vip;
      const isMod = tags.badges?.moderator;

      const excludedUsers = ["gionstudy", "lunamoramg", "cuartodechenz"];
      if (
        !greetedUsers.current.has(username) &&
        !excludedUsers.includes(username.toLowerCase())
      ) {
        greetedUsers.current.add(username);

        if (greetedUsers.current.size > 1000) {
          const firstUser = greetedUsers.current.values().next().value;
          greetedUsers.current.delete(firstUser);
        }

        const mensajeGeneral = `¡Qué alegría verte por aquí, ${username}! Espero que tengas una jornada productiva. 📚✨`;
        const mensajeSubs = isSub
          ? "👑 ¡Mil gracias por apoyar este canal! Gracias a ti, las croquetas para mi perrito Franchu y mis gatitos Mora y Luna están aseguradas. 🐱💕"
          : "A sacarle provecho a esta sesión de estudio. ¡Mucho ánimo! 💪📖";
        const mensajeMod = isMod
          ? "⚔️ ¡Nuestra comunidad está en buenas manos contigo como mod! Gracias por ayudar a que este sea un espacio increíble. ✨"
          : "";
        const mensajeVid =
          isVip && username !== "mohcitrus"
            ? "💎 ¡Nos encanta verte por aquí! Tu presencia hace que estos días sean aún más especiales. 🌟"
            : "";

        client.say(chan, mensajeGeneral + mensajeSubs + mensajeMod + mensajeVid);
      }

      if (
        ["!tarea", "!add", "!list", "!edit", "!complete", "!del", "!done"].includes(
          command
        )
      ) {
        if (rememberChatMessage(handledTaskMessages.current, tags.id)) return;

        const result = handleTaskCommand(message, username, taskStore);
        if (!result) return;

        for (const reply of result.replies) {
          client.say(chan, reply).catch(() => {
            console.warn("Could not send a task command response to Twitch chat.");
          });
        }
        if (result.presentation) {
          taskPresentationRef.current?.(result.presentation);
        }
        return;
      }

      if (!message.startsWith("!")) return;

      if (
        command === "!sala" ||
        command === "!code" ||
        command === "!room" ||
        command === "!salita"
      ) {
        if (qrValueRef.current) {
          client.say(
            chan,
            `🌳CÓDIGO: ${qrValueRef.current.toUpperCase()} - Únete a la sala: https://forestapp.cc/join-room?token=${qrValueRef.current} Por favor desactiva la opción concentración profunda. Si no sabes como hacerlo, te ensañamos. De lo contrario puedes pedirnos una salita con esa funcionalidad activa`
          );
        } else {
          client.say(
            chan,
            "No hay un código configurado. Usa !codigo [token] para establecer uno."
          );
        }
        return;
      }

      if (
        tags.username !== "gionstudy" &&
        tags.username !== "cuartodechenz" &&
        !tags.mod
      ) {
        return;
      }

      const currentHandlers = handlersRef.current;

      switch (command) {
        case "!start":
          currentHandlers.startTimer((msg) => client.say(chan, msg));
          break;
        case "!pause":
          currentHandlers.pauseTimer((msg) => client.say(chan, msg));
          break;
        case "!min":
          if (args[1] && !isNaN(args[1])) {
            currentHandlers.setMinutes(parseInt(args[1]));
          }
          break;
        case "!pomo":
          if (args[1] && !isNaN(args[1])) {
            currentHandlers.setPomodoros(parseInt(args[1]));
          }
          break;
        case "!pomot":
          if (args[1] && !isNaN(args[1])) {
            currentHandlers.setTotalPomodorosCount(parseInt(args[1]));
          }
          break;
        case "!mode": {
          currentHandlers.setMode((prevMode) => {
            const updatedMode = prevMode === "auto" ? "manual" : "auto";

            if (updatedMode === "manual") {
              currentHandlers.setIsRunning(false);
              client.say(
                chan,
                "/me 🧭 Cambiado a modo MANUAL. Usa !start para reanudar cuando quieras."
              );
            } else {
              client.say(
                chan,
                "/me 🤖 Cambiado a modo AUTOMÁTICO. Usa !start para iniciar y luego seguirá solo hasta completar el circuito."
              );
            }

            currentHandlers.saveState();
            return updatedMode;
          });
          break;
        }
        case "!reset":
          currentHandlers.setHasSentInitialMessage(false);
          currentHandlers.resetTimer();
          client.say(
            chan,
            "🔄 Timer reiniciado. Iniciando en fase INICIANDO."
          );
          break;
        case "!aviso": {
          const messageAviso = args.slice(1).join(" ");
          console.log("Aviso actualizado:", messageAviso);
          currentHandlers.setAviso(messageAviso);
          break;
        }
        case "!codigo": {
          const token = args.slice(1).join(" ");
          if (!token) {
            client.say(
              chan,
              "❌ Debes proporcionar un token válido. Ejemplo: !codigo [token]"
            );
            return;
          }
          qrValueRef.current = token;
          currentHandlers.setQrValue(token);
          break;
        }
        default:
          break;
      }
    };

    connect = async () => {
      if (!active || retryBlocked || connectInProgress) return;

      connectInProgress = true;
      setConnectionStatus(reconnectAttempts === 0 ? "connecting" : "reconnecting");

      try {
        await client.connect();
      } catch (error) {
        if (active) {
          if (isAuthenticationFailure(error)) {
            requireAuthorization();
          } else if (isInvalidUsername(error)) {
            stopForInvalidUsername();
          } else {
            console.warn(
              "Twitch chat connection failed; an automatic retry is scheduled."
            );
            scheduleReconnect();
          }
        }
      } finally {
        connectInProgress = false;
      }
    };

    client.on("connected", onConnected);
    client.on("disconnected", onDisconnected);
    client.on("error", onError);
    client.on("message", onMessage);

    connect();

    return () => {
      active = false;
      clearReconnectTimer();
      client.removeListener("connected", onConnected);
      client.removeListener("disconnected", onDisconnected);
      client.removeListener("error", onError);
      client.removeListener("message", onMessage);

      if (client.readyState() !== "CLOSED" && client.readyState() !== "CLOSING") {
        client.disconnect().catch(() => {
          console.warn("Twitch chat connection did not close cleanly.");
        });
      }

      if (Client.current === client) {
        Client.current = null;
      }
    };
  }, []);

  return {
    Client,
    qrValueRef,
    connectionStatus
  };
};
