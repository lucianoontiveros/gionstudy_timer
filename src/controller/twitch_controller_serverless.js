// Versión compatible con Vercel Functions
const tmi = require('tmi.js');

export const twitch_controller_serverless = async (req, res) => {
  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Obtener credenciales de variables de entorno del servidor
    const username = process.env.TWITCH_USERNAME;
    const password = process.env.TWITCH_PASSWORD;
    const channels = process.env.TWITCH_CHANNELS;

    if (!username || !password || !channels) {
      console.warn('Twitch credentials not found in server environment variables');
      return res.status(500).json({ 
        error: 'Twitch credentials not configured',
        message: 'Please set TWITCH_USERNAME, TWITCH_PASSWORD, and TWITCH_CHANNELS environment variables'
      });
    }

    console.log('Configurando cliente de Twitch con:', {
      username: username,
      channels: channels
    });

    const opts = {
      options: { 
        debug: false,
        updateEmotesetsTimer: 0,
        skipUpdatingEmotesets: true,
      }, 
      identity: {
        username: username,
        password: password,
      },
      channels: [channels],
      connection: {
        secure: true,
        reconnect: true,
        maxReconnectAttempts: 5,
        reconnectDecay: 1.5
      }
    };

    const client = new tmi.Client(opts);
    
    await client.connect();
    
    // Almacenar cliente globalmente para uso en otros endpoints
    global.twitchClient = client;
    
    res.status(200).json({ 
      success: true, 
      message: 'Twitch client connected successfully',
      connected: true,
      channels: client.getChannels()
    });

  } catch (error) {
    console.error('Error al conectar a Twitch:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Twitch',
      details: error.message 
    });
  }
};

// Endpoint para enviar mensajes
export const send_message = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { channel, message } = req.body;
    
    if (!global.twitchClient) {
      return res.status(400).json({ error: 'No active Twitch connection' });
    }

    if (!channel || !message) {
      return res.status(400).json({ error: 'Channel and message are required' });
    }

    await global.twitchClient.say(channel, message);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully',
      channel: channel,
      message: message
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
};
