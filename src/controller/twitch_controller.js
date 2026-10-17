import tmi from "tmi.js";

export const twitch_controller = () => {
  const VITE_APP_USERNAME = import.meta.env.VITE_APP_USERNAME;
  const VITE_APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD;
  const VITE_APP_CHANNELS = import.meta.env.VITE_APP_CHANNELS;

  // Check if required environment variables are available
  if (!VITE_APP_USERNAME || !VITE_APP_PASSWORD || !VITE_APP_CHANNELS) {
    console.error('❌ Twitch credentials not found in environment variables.');
    console.error('📋 Required variables:');
    console.error('   - VITE_APP_USERNAME: ' + (VITE_APP_USERNAME || 'MISSING'));
    console.error('   - VITE_APP_PASSWORD: ' + (VITE_APP_PASSWORD ? 'PRESENT' : 'MISSING'));
    console.error('   - VITE_APP_CHANNELS: ' + (VITE_APP_CHANNELS || 'MISSING'));
    return null;
  }

  // Validate credentials format
  if (!VITE_APP_PASSWORD.startsWith('oauth:')) {
    console.error('❌ Invalid password format. Must start with "oauth:"');
    return null;
  }

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
      reconnect: false
    }
  };

  const new_client_twitch = new tmi.Client(opts);
  return new_client_twitch;
};
