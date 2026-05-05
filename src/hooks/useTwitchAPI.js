import { useState, useCallback, useRef } from 'react';

export const useTwitchAPI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  const connectTwitch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/twitch.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: import.meta.env.VITE_APP_USERNAME,
          password: import.meta.env.VITE_APP_PASSWORD,
          channels: import.meta.env.VITE_APP_CHANNELS
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        console.log('Connected to Twitch successfully');
      } else {
        throw new Error(data.error || 'Failed to connect to Twitch');
      }
    } catch (err) {
      console.error('Twitch connection error:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (channel, message) => {
    if (!isConnected) {
      throw new Error('Not connected to Twitch');
    }

    try {
      const response = await fetch('/api/send-message.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channel, message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      return data;
    } catch (err) {
      console.error('Send message error:', err);
      throw err;
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    connectTwitch,
    sendMessage,
    disconnect
  };
};
