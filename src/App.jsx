import { useState, useEffect } from "react";
import "./index.css";
import { formatTime } from "./components/utils/formatTime";
import News from "./components/News";
import Qrcode from "./components/Qrcode";
import TaskPresentation from "./components/TaskPresentation";
import { useTimer } from "./hooks/useTimer";
import { useTwitchConnection } from "./hooks/useTwitchConnection";
import { useTaskPresentationQueue } from "./hooks/useTaskPresentationQueue";

const App = () => {
  const [aviso, setAviso] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [location] = useState("Buenos Aires, Argentina");

  // Timer hook
  const timer = useTimer();
  const { timeLeft, phase, pomodorosCompleted, totalPomodoros, mode, backgroundImage } = timer;

  // Override setAviso y setQrValue en el timer
  timer.setAviso = setAviso;
  timer.setQrValue = setQrValue;

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      setCurrentDate(now.toLocaleDateString("es-AR", options));
    };

    updateDateTime();
    const id = setInterval(updateDateTime, 1000);
    return () => clearInterval(id);
  }, []);

  const {
    presentation,
    enqueuePresentation,
    markBackgroundUnavailable,
  } = useTaskPresentationQueue();
  const { connectionStatus } = useTwitchConnection(timer, enqueuePresentation);

  const connectionStatusLabels = {
    connecting: "Conectando",
    connected: "Conectado",
    reconnecting: "Reconectando",
    disconnected: "Desconectado",
    "authorization-required": "Autorización requerida",
    "configuration-error": "Configuración requerida",
  };

  return (
    <div className="container">
      <div
        className={`twitch-status twitch-status--${connectionStatus}`}
        role="status"
        aria-live="polite"
      >
        <span className="twitch-status__indicator" aria-hidden="true" />
        Twitch: {connectionStatusLabels[connectionStatus]}
      </div>
      <div className="element_1">
        <Qrcode token={qrValue} />
      </div>
      <div className="element_2">
        <News message={aviso} />
      </div>
      <div className="element_3">
        <div className={`consola elemente_3_a ${backgroundImage}`}></div>
        <div className="elemente_3_b">
          <div className="item_timer_1">
            <h1>{formatTime(timeLeft)}</h1>
          </div>
          <div className="item_timer_2">
            <div className="item_timer_2_a">
              <h3>{mode}</h3>
            </div>
            <div className="item_timer_2_b">
              <h2>
                {pomodorosCompleted}/{totalPomodoros}
              </h2>
            </div>
          </div>
        </div>
      </div>
      <div className="element_4">
        <div className="element_4_a">
          <h2> {phase}</h2>
        </div>
      </div>
      <div className="localization">
        <span className="localization-text">
          {currentDate} | {currentTime} | {location}
        </span>
      </div>
      <TaskPresentation
        key={
          presentation
            ? `${presentation.username}-${presentation.operation}-${presentation.background}`
            : "no-task-presentation"
        }
        presentation={presentation}
        onBackgroundError={markBackgroundUnavailable}
      />
    </div>
  );
};

export default App;