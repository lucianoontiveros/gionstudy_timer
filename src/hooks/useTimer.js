import { useState, useEffect, useRef, useCallback } from "react";
import { formatTime } from "../components/utils/formatTime";
import campana from "../components/utils/campana.mp3";

const DURATIONS = {
  INICIANDO: 10 * 60,
  PRODUCTIVO: 90 * 60,
  DESCANSO: 10 * 60,
  TERMINADO: 0,
};

export const useTimer = () => {
  const [timeLeft, setTimeLeft] = useState(DURATIONS.INICIANDO);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("INICIANDO");
  const [pomodorosCompleted, setPomodorosCompleted] = useState(1);
  const [totalPomodoros, setTotalPomodoros] = useState(7);
  const [mode, setMode] = useState("auto");
  const [backgroundImage, setBackgroundImage] = useState("descanso");

  // refs
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const startTimestampRef = useRef(null);
  const endTimestampRef = useRef(null);
  const remainingBeforeStartRef = useRef(DURATIONS.INICIANDO);
  const isRunningRef = useRef(isRunning);
  const modeRef = useRef(mode);
  const hasSentInitialMessage = useRef(false);
  const hasAutoStartedRef = useRef(false);

  // Inicializar audio una vez
  useEffect(() => {
    audioRef.current = new Audio(campana);
    audioRef.current.preload = "auto";
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Actualizar referencias de estados
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Efecto para cargar el estado guardado al inicio
  useEffect(() => {
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (Date.now() - state.timestamp < 3600000) {
        setTimeLeft(state.timeLeft);
        setIsRunning(state.isRunning);
        setPhase(state.phase);
        setPomodorosCompleted(state.pomodorosCompleted);
        setTotalPomodoros(state.totalPomodoros);
        setMode(state.mode);
        setBackgroundImage(state.backgroundImage);
        remainingBeforeStartRef.current = state.remainingBeforeStart;
        hasAutoStartedRef.current = state.hasAutoStarted;
        isRunningRef.current = state.isRunning;
        modeRef.current = state.mode;
      } else {
        localStorage.removeItem('pomodoroState');
      }
    }
  }, []);

  // Función para guardar el estado
  const saveState = useCallback(() => {
    const stateToSave = {
      timeLeft,
      isRunning,
      phase,
      pomodorosCompleted,
      totalPomodoros,
      mode,
      backgroundImage,
      remainingBeforeStart: remainingBeforeStartRef.current,
      hasAutoStarted: hasAutoStartedRef.current,
      timestamp: Date.now()
    };
    localStorage.setItem('pomodoroState', JSON.stringify(stateToSave));
  }, [timeLeft, isRunning, phase, pomodorosCompleted, totalPomodoros, mode, backgroundImage]);

  // Efecto para guardar el estado cuando cambie
  useEffect(() => {
    saveState();
  }, [saveState, timeLeft, isRunning, phase, pomodorosCompleted, totalPomodoros, mode]);

  // Efecto para limpiar el estado cuando se complete la sesión
  useEffect(() => {
    if (phase === "🌳HEMOS TERMINADO🌳" && timeLeft === 0) {
      localStorage.removeItem('pomodoroState');
    }
  }, [phase, timeLeft]);

  // Helper: establecer endTimestamp y startTimestamp
  const startWithRemaining = useCallback((remainingSeconds) => {
    const now = Date.now();
    startTimestampRef.current = now;
    endTimestampRef.current = now + remainingSeconds * 1000;
    remainingBeforeStartRef.current = remainingSeconds;
  }, []);

  // Calcular remaining usando timestamps
  const computeRemaining = useCallback(() => {
    if (!endTimestampRef.current) return Math.max(0, Math.ceil(remainingBeforeStartRef.current));
    const ms = endTimestampRef.current - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }, []);

  // Manejo de cambio de fase
  const handlePhaseSwitch = useCallback((onPhaseMessage) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.debug("audio play failed:", e?.message || e);
      });
    }

    hasSentInitialMessage.current = false;

    let nextPhase = phase;
    let nextRemaining = 0;
    let incrementPomodoro = false;

    switch (phase) {
      case "INICIANDO":
        nextPhase = "💻PRODUCTIVO📋";
        nextRemaining = DURATIONS.PRODUCTIVO;
        break;
      case "💻PRODUCTIVO📋": {
        const newPomodoroCount = pomodorosCompleted + 1;
        if (newPomodoroCount > totalPomodoros) {
          nextPhase = "🌳HEMOS TERMINADO🌳";
          nextRemaining = DURATIONS.DESCANSO;
          incrementPomodoro = false;
        } else {
          nextPhase = "🍵DESCANSO🍙";
          nextRemaining = DURATIONS.DESCANSO;
          incrementPomodoro = true;
        }
        break;
      }
      case "🍵DESCANSO🍙":
        nextPhase = "💻PRODUCTIVO📋";
        nextRemaining = DURATIONS.PRODUCTIVO;
        break;
      case "🌳HEMOS TERMINADO🌳":
        nextPhase = "🌳HEMOS TERMINADO🌳";
        nextRemaining = DURATIONS.TERMINADO;
        break;
      default:
        break;
    }

    setPhase(nextPhase);
    setBackgroundImage(nextPhase === "💻PRODUCTIVO📋" ? "productivo" : "descanso");
    if (incrementPomodoro) setPomodorosCompleted((p) => p + 1);

    if (modeRef.current === "auto" && hasAutoStartedRef.current && nextRemaining > 0) {
      remainingBeforeStartRef.current = nextRemaining;
      startWithRemaining(nextRemaining);
      setIsRunning(true);
      isRunningRef.current = true;

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          const remaining = computeRemaining();
          remainingBeforeStartRef.current = remaining;
          setTimeLeft(remaining);
          if (remaining <= 0) {
            handlePhaseSwitch(onPhaseMessage);
          }
        }, 1000);
      }
    } else {
      remainingBeforeStartRef.current = nextRemaining;
      setTimeLeft(nextRemaining);
      setIsRunning(false);
      isRunningRef.current = false;

      if (nextPhase === "🌳HEMOS TERMINADO🌳") {
        hasAutoStartedRef.current = false;
      }
    }

    saveState();
  }, [computeRemaining, pomodorosCompleted, totalPomodoros, phase, startWithRemaining, saveState]);

  // Efecto principal que administra el interval
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isRunning) return;

    if (!endTimestampRef.current) {
      startWithRemaining(remainingBeforeStartRef.current || DURATIONS.INICIANDO);
    }

    timerRef.current = setInterval(() => {
      const remaining = computeRemaining();
      remainingBeforeStartRef.current = remaining;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handlePhaseSwitch();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, computeRemaining, handlePhaseSwitch, startWithRemaining]);

  // Start timer
  const startTimer = useCallback((onStartMessage) => {
    if (isRunningRef.current) return;

    let defaultRemaining = remainingBeforeStartRef.current;
    if (!defaultRemaining || defaultRemaining <= 0) {
      defaultRemaining = phase === "🍵DESCANSO🍙" ? DURATIONS.DESCANSO : phase === "💻PRODUCTIVO📋" ? DURATIONS.PRODUCTIVO : DURATIONS.INICIANDO;
      remainingBeforeStartRef.current = defaultRemaining;
      setTimeLeft(defaultRemaining);
    }

    startWithRemaining(remainingBeforeStartRef.current);
    setIsRunning(true);
    isRunningRef.current = true;

    if (modeRef.current === "auto") {
      hasAutoStartedRef.current = true;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      const remaining = computeRemaining();
      remainingBeforeStartRef.current = remaining;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        handlePhaseSwitch();
      }
    }, 1000);

    if (onStartMessage && phase !== "🌳HEMOS TERMINADO🌳") {
      let phaseMessage = "";
      if (phase === "💻PRODUCTIVO📋") {
        phaseMessage = "fase de PRODUCTIVIDAD";
      } else if (phase === "🍵DESCANSO🍙") {
        phaseMessage = "tiempo de DESCANSO";
      } else if (phase === "INICIANDO") {
        phaseMessage = "fase de INICIO";
      }

      if (phaseMessage) {
        onStartMessage(`⏱️ ¡Temporizador iniciado! ${phaseMessage} en marcha.`);
      }
    }

    saveState();
  }, [computeRemaining, phase, startWithRemaining, handlePhaseSwitch, saveState]);

  // Pause timer
  const pauseTimer = useCallback((onPauseMessage) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const remaining = computeRemaining();
    remainingBeforeStartRef.current = remaining;

    endTimestampRef.current = null;
    startTimestampRef.current = null;

    if (isRunningRef.current) {
      setIsRunning(false);
      isRunningRef.current = false;

      if (onPauseMessage) {
        const remainingStr = formatTime(remaining);
        onPauseMessage(`⏸️ Temporizador pausado con ${remainingStr} restantes. Usa !start para reanudar.`);
      }
    }

    saveState();
  }, [computeRemaining, saveState]);

  // set minutes desde comando
  const setMinutes = (minutes) => {
    const seconds = minutes * 60;
    remainingBeforeStartRef.current = seconds;
    setTimeLeft(seconds);
    if (isRunningRef.current) {
      startWithRemaining(seconds);
    }
    saveState();
  };

  const setPomodoros = (count) => {
    setPomodorosCompleted(count);
    saveState();
  };

  const setTotalPomodorosCount = (count) => {
    setTotalPomodoros(count);
    saveState();
  };

  const resetTimer = useCallback(() => {
    localStorage.removeItem("pomodoroState");

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    startTimestampRef.current = null;
    endTimestampRef.current = null;
    remainingBeforeStartRef.current = DURATIONS.INICIANDO;

    setPhase("INICIANDO");
    setTimeLeft(DURATIONS.INICIANDO);
    setPomodorosCompleted(1);
    setTotalPomodoros(4);
    hasAutoStartedRef.current = false;

    setIsRunning(false);
    isRunningRef.current = false;
  }, []);

  const setIsRunningWrapper = useCallback((val) => {
    setIsRunning(val);
    isRunningRef.current = val;
  }, []);

  return {
    timeLeft,
    isRunning,
    phase,
    pomodorosCompleted,
    totalPomodoros,
    mode,
    backgroundImage,
    setMode,
    setIsRunning: setIsRunningWrapper,
    saveState,
    setAviso: (aviso) => {}, // Delegado a App.jsx
    setQrValue: (value) => {}, // Delegado a App.jsx
    startTimer,
    pauseTimer,
    setMinutes,
    setPomodoros,
    setTotalPomodorosCount,
    resetTimer,
    handlePhaseSwitch,
    hasSentInitialMessage,
    setHasSentInitialMessage: (val) => { hasSentInitialMessage.current = val; }
  };
};
