import { useState } from "react";
import PropTypes from "prop-types";
import "./taskPresentation.css";

const OPERATION_LABELS = {
  added: "agregó una tarea",
  edited: "editó una tarea",
  completed: "completó una tarea",
  deleted: "eliminó una tarea",
};

const TaskPresentation = ({ presentation, onBackgroundError }) => {
  const [failedBackground, setFailedBackground] = useState(null);
  if (!presentation) return null;

  const hasBackground =
    presentation.background &&
    failedBackground !== presentation.background &&
    !presentation.background.endsWith("/kero_break.png") &&
    !presentation.background.endsWith("/kero_produc.png");

  return (
    <section
      className="task-presentation"
      aria-label={`Tareas de ${presentation.username}`}
      aria-live="polite"
    >
      {hasBackground && (
        <img
          className="task-presentation__background"
          src={presentation.background}
          alt=""
          aria-hidden="true"
          onError={() => {
            setFailedBackground(presentation.background);
            onBackgroundError(presentation.background);
          }}
        />
      )}
      <div className="task-presentation__content">
        <div className="task-presentation__details">
          <h2 className="task-presentation__heading">
            @{presentation.username} {OPERATION_LABELS[presentation.operation]}
          </h2>
          {presentation.tasks.length > 0 ? (
            <ul className="task-presentation__list">
              {presentation.tasks.map((task) => (
                <li
                  className={`task-presentation__task${task.status === "completed" ? " task-presentation__task--completed" : ""}`}
                  key={task.id}
                >
                  <span className="task-presentation__task-id">{task.id}</span>
                  <span>{task.description}</span>
                  <span className="task-presentation__task-state">
                    {task.status === "completed" ? "Completada" : "Pendiente"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="task-presentation__empty">No quedan tareas.</p>
          )}
        </div>
      </div>
    </section>
  );
};

TaskPresentation.propTypes = {
  presentation: PropTypes.shape({
    username: PropTypes.string.isRequired,
    operation: PropTypes.oneOf(Object.keys(OPERATION_LABELS)).isRequired,
    background: PropTypes.string,
    tasks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        status: PropTypes.oneOf(["pending", "completed"]).isRequired,
      })
    ).isRequired,
  }),
  onBackgroundError: PropTypes.func.isRequired,
};

export default TaskPresentation;
