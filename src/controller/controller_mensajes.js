

export const enviarMensaje = (message, pomodorosCompleted, sendMessage) => {
    let mensaje = "";
    switch (message) {
        case "INICIANDO":
            mensaje = "¡Estamos a punto de comenzar! 🎉 No olvides organizar tu espacio y preparar todo lo necesario para el tema que vas a tratar. ¡A por ello! 📝";
            break;
        case "💻PRODUCTIVO📋":
            mensaje = `¡Vamos con todo! 🚀 Actualmente estamos trabajando en el pomo ${pomodorosCompleted}. ¡Sigue así, lo estás haciendo genial! 💪`;
            break;
        case "🍵DESCANSO🍙":
            mensaje = `Es hora de un merecido descanso ☕. El pomo ${pomodorosCompleted} está a punto de comenzar. Relájate y recarga energías, ¡Vamos a jugar! 🌟`;
            break;
        case "🌳HEMOS TERMINADO🌳":
            mensaje = `¡Lo logramos! 🎉 Hemos completado todos los pomos y el stream está llegando a su fin. Es momento de relajarnos un poco jugando. Si aún tienes cosas pendientes, ¡no te preocupes! En unos minutos haremos un raid a otro canal de Study With Me para que sigas con tu flujo de estudio. 📚✨`;
            break;
        case "🌳SE VIENE RAID🌳":
            mensaje = `Gracias por la compañía, aquí se completó nuestra jornada📚✨`;
            break;
        default:
            mensaje = "Ups, parece que algo no ha salido bien. 🤔 No reconozco este mensaje, pero todo está bajo control. ¡Nos vemos en breve!";
            break;
    }
    sendMessage("gionstudy", mensaje);
};
