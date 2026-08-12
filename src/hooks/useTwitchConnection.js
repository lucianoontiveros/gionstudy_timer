import { useEffect, useRef, useCallback } from "react";
import { twitch_controller } from "../controller/twitch_controller";
import { enviarMensaje } from "../controller/controller_mensajes";

export const useTwitchConnection = (timerHandlers) => {
  const Client = useRef(null);
  const greetedUsers = useRef(new Set());
  const qrValueRef = useRef("");
  const isInitialized = useRef(false);

  const {
    startTimer,
    pauseTimer,
    setMinutes,
    setPomodoros,
    setTotalPomodorosCount,
    resetTimer,
    timeLeft,
    phase,
    pomodorosCompleted,
    handlePhaseSwitch,
    setHasSentInitialMessage,
    setAviso,
    setQrValue
  } = timerHandlers;

  const getChannel = useCallback(() => {
    return import.meta.env.VITE_APP_CHANNEL || "gionstudy";
  }, []);

  // Refs para las funciones que cambian
  const handlersRef = useRef(timerHandlers);
  handlersRef.current = timerHandlers;

  // Twitch controller y comandos - solo se ejecuta una vez
  useEffect(() => {
    if (isInitialized.current) {
      return; // Evitar reconexiones múltiples
    }

    Client.current = twitch_controller();
    if (!Client.current) {
      console.warn('Twitch client not initialized. Skipping Twitch integration.');
      return;
    }

    isInitialized.current = true;
    const channel = getChannel();

    Client.current.on("message", (chan, tags, message, self) => {
      if (self) return;
      const args = message.split(" ");
      const command = args[0].toLowerCase();
      const username = tags.username;
      const isSub = tags.badges?.subscriber;
      const isVip = tags.badges?.vip;
      const isMod = tags.badges?.moderator;

      // Saludo a nuevos usuarios
      const excludedUsers = ['gionstudy', 'lunamoramg', 'cuartodechenz'];
      if (!greetedUsers.current.has(username) && !excludedUsers.includes(username.toLowerCase())) {
        greetedUsers.current.add(username);
        
        // Limitar el tamaño del Set a 1000 usuarios para evitar problemas de memoria
        if (greetedUsers.current.size > 1000) {
          const firstUser = greetedUsers.current.values().next().value;
          greetedUsers.current.delete(firstUser);
        }

        const mensajeGeneral = `¡Qué alegría verte por aquí, ${username}! Espero que tengas una jornada productiva. 📚✨`;
        const mensajeSubs = isSub ? `👑 ¡Mil gracias por apoyar este canal! Gracias a ti, las croquetas para mi perrito Franchu y mis gatitos Mora y Luna están aseguradas. 🐱💕` : `A sacarle provecho a esta sesión de estudio. ¡Mucho ánimo! 💪📖`;
        const mensajeMod = isMod ? `⚔️ ¡Nuestra comunidad está en buenas manos contigo como mod! Gracias por ayudar a que esto sea un espacio increíble. ✨` : "";
        const mensajeVid = isVip && username !== "mohcitrus" ? `💎 ¡Nos encanta verte por aquí! Tu presencia hace que estos días sean aún más especiales. 🌟` : "";

        Client.current.say(chan, mensajeGeneral + mensajeSubs + mensajeMod + mensajeVid);
      }

      if (!message.startsWith("!")) return;

      // Comandos públicos
      if (command === "!sala" || command === "!code" || command === "!room" || command === "!salita") {
        if (qrValueRef.current) {
          Client.current.say(
            chan,
            `🌳CÓDIGO: ${qrValueRef.current.toUpperCase()} - Únete a la sala: https://forestapp.cc/join-room?token=${qrValueRef.current} Por favor desactiva la opción concentración profunda. Si no sabes como hacerlo, te ensañamos. De lo contrario puedes pedirnos una salita con esa funcionalidad activa`
          );
        } else {
          Client.current.say(chan, "No hay un código configurado. Usa !codigo [token] para establecer uno.");
        }
        return;
      }

      // Comandos administrativos (solo mods y usuarios específicos)
      if (tags.username !== "gionstudy" && tags.username !== "cuartodechenz" && !tags.mod) {
        return;
      }

      const currentHandlers = handlersRef.current;

      switch (command) {
        case "!start":
          currentHandlers.startTimer((msg) => {
            if (Client.current) Client.current.say(chan, msg);
          });
          break;
        case "!pause":
          currentHandlers.pauseTimer((msg) => {
            if (Client.current) Client.current.say(chan, msg);
          });
          break;
        case "!min":
          if (args[1] && !isNaN(args[1])) currentHandlers.setMinutes(parseInt(args[1]));
          break;
        case "!pomo":
          if (args[1] && !isNaN(args[1])) currentHandlers.setPomodoros(parseInt(args[1]));
          break;
        case "!pomot":
          if (args[1] && !isNaN(args[1])) currentHandlers.setTotalPomodorosCount(parseInt(args[1]));
          break;
        case "!mode": {
          if (currentHandlers.timeLeft <= 1) {
            // Bloquear cambio de fase pendiente
          }

          currentHandlers.setMode((prevMode) => {
            const updatedMode = prevMode === "auto" ? "manual" : "auto";

            if (updatedMode === "manual") {
              currentHandlers.setIsRunning(false);
              if (Client.current)
                Client.current.say(chan, `/me 🧭 Cambiado a modo MANUAL. Usa !start para reanudar cuando quieras.`);
            } else {
              if (Client.current)
                Client.current.say(chan, `/me 🤖 Cambiado a modo AUTOMÁTICO. Usa !start para iniciar y luego seguirá solo hasta completar el circuito.`);
            }

            currentHandlers.saveState();
            return updatedMode;
          });
          break;
        }
        case "!reset":
          try {
            if (Client.current) {
              Client.current.disconnect();
            }
          } catch (e) {}

          Client.current = twitch_controller();
          if (!Client.current) {
            console.warn('Failed to reconnect Twitch client during reset.');
          }
          currentHandlers.setHasSentInitialMessage(false);
          currentHandlers.resetTimer();

          if (Client.current) {
            Client.current.say(
              chan,
              "🔄 Timer y bot reiniciados. Iniciando en fase INICIANDO."
            );
          }
          break;
        case "!aviso":
          const messageAviso = args.slice(1).join(" ");
          console.log("Aviso actualizado:", messageAviso);
          currentHandlers.setAviso(messageAviso);
          break;
        case "!codigo":
          const token = args.slice(1).join(" ");
          if (!token) {
            Client.current.say(chan, "❌ Debes proporcionar un token válido. Ejemplo: !codigo [token]");
            return;
          }
          qrValueRef.current = token;
          currentHandlers.setQrValue(token);
          break;
        default:
          break;
      }
    });

    return () => {
      if (Client.current) {
        try { Client.current.disconnect(); } catch (e) { /* ignore */ }
      }
      isInitialized.current = false;
    };
  }, [getChannel]);

  return {
    Client,
    qrValueRef
  };
};
