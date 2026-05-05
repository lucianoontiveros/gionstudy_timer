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

  console.log('🔧 Configurando cliente de Twitch con:', {
    username: VITE_APP_USERNAME,
    channels: VITE_APP_CHANNELS,
    hasPassword: !!VITE_APP_PASSWORD,
    passwordLength: VITE_APP_PASSWORD.length
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
  
  // Add event listeners for better debugging
  new_client_twitch.on('connected', (address, port) => {
    console.log('✅ Conectado a Twitch correctamente');
    console.log(`📍 Servidor: ${address}:${port}`);
  });

  new_client_twitch.on('disconnected', (reason) => {
    console.log('❌ Desconectado de Twitch:', reason);
  });

  new_client_twitch.on('error', (error) => {
    console.error('🚨 Error en cliente Twitch:', error);
  });

  // Attempt connection with detailed error handling
  new_client_twitch.connect().then(() => {
    console.log('🎉 Conexión establecida exitosamente');
  }).catch((error) => {
    console.error('❌ Error al conectar a Twitch:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code || 'N/A');
    
    // Specific error handling
    if (error.message.includes('auth')) {
      console.error('🔑 Error de autenticación - Verifica tus credenciales');
    } else if (error.message.includes('Not connected to server')) {
      console.error('🌐 Error de red - Verifica tu conexión');
    } else if (error.message.includes('Login authentication failed')) {
      console.error('🚫 Fallo de login - Token OAuth inválido o expirado');
    }
  });

  return new_client_twitch;
};
