import tmi from "tmi.js";

export const twitch_controller = () => {
  const VITE_APP_USERNAME = import.meta.env.VITE_APP_USERNAME;
  const VITE_APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD;
  const VITE_APP_CHANNELS = import.meta.env.VITE_APP_CHANNELS;

  // Check if required environment variables are available
  if (!VITE_APP_USERNAME || !VITE_APP_PASSWORD || !VITE_APP_CHANNELS) {
    console.warn('Twitch credentials not found in environment variables. Skipping Twitch connection.');
    return null;
  }

  console.log('Configurando cliente de Twitch con:', {
    username: VITE_APP_USERNAME,
    channels: VITE_APP_CHANNELS
  });

  const opts = {
    options: { 
      debug: false,
      updateEmotesetsTimer: 0, // Desactivar carga de emoticones para evitar CORS
      skipUpdatingEmotesets: true, // Omitir actualización de emoticones
    }, 
    identity: {
      username: VITE_APP_USERNAME,
      password: VITE_APP_PASSWORD,
    },
    channels: [VITE_APP_CHANNELS],
    connection: {
      secure: true,
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectDecay: 1.5
    }
  };

  const new_client_twitch = new tmi.Client(opts);
  new_client_twitch.connect().then(() => {
    console.log('Conectado a Twitch correctamente');
  }).catch((error) => {
    console.error('Error al conectar a Twitch:', error);
  });

  return new_client_twitch;
};
