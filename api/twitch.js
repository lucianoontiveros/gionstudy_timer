const tmi = require('tmi.js');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { username, password, channels } = req.body;

    if (!username || !password || !channels) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }

    const opts = {
      options: { 
        debug: false,
        updateEmotesetsTimer: 0,
        skipUpdatingEmotesets: true,
      }, 
      identity: {
        username,
        password,
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
    
    res.status(200).json({ 
      success: true, 
      message: 'Twitch client connected successfully',
      client: {
        connected: true,
        channels: client.getChannels()
      }
    });

  } catch (error) {
    console.error('Twitch connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Twitch',
      details: error.message 
    });
  }
};
