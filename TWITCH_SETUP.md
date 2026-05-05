# 🔧 Configuración de Twitch API - Guía Completa

## 🚨 **Problema Actual: Error `Not connected to server`**

Tu archivo `.env` contiene valores placeholder que deben ser reemplazados con tus credenciales reales.

## 📋 **Pasos para Configurar Credenciales**

### **1. Generar Token OAuth de Twitch**

#### Método A: Via Twitch Chat OAuth Generator
1. Ve a: https://twitchapps.com/tmi/
2. Click "Connect"
3. Inicia sesión con tu cuenta de Twitch
4. Copia el token generado (empieza con `oauth:`)

#### Método B: Manualmente
1. Ve a: https://dev.twitch.tv/console/apps
2. Crea una nueva aplicación
3. Obtén Client ID y Client Secret
4. Genera token OAuth

### **2. Configurar Variables de Entorno**

Edita tu archivo `.env` con tus credenciales reales:

```bash
# Twitch API Configuration
VITE_APP_USERNAME=tu_usuario_real
VITE_APP_PASSWORD=oauth:tu_token_oauth_real
VITE_APP_CHANNELS=tu_canal_real
```

**Ejemplo:**
```bash
VITE_APP_USERNAME=gionstudy
VITE_APP_PASSWORD=oauth:abcdef1234567890abcdef1234567890abcdef12
VITE_APP_CHANNELS=gionstudy
```

### **3. Verificar Canales**

Asegúrate de que:
- El canal existe en Twitch
- Tienes permisos para enviar mensajes al canal
- El nombre del canal está en minúsculas

## 🔍 **Troubleshooting**

### **Error: `Not connected to server`**
- **Causa**: Credenciales inválidas o token expirado
- **Solución**: Regenera token OAuth

### **Error: `Login authentication failed`**
- **Causa**: Token OAuth incorrecto
- **Solución**: Verifica formato `oauth:xxxxxxxx`

### **Error: No se encuentra variables**
- **Causa**: Archivo `.env` no configurado
- **Solución**: Completa las variables requeridas

## 🧪 **Test de Conexión**

Después de configurar, reinicia tu servidor y revisa la consola:

```javascript
// Deberías ver:
✅ Configurando cliente de Twitch con: {username: "tu_usuario", channels: "tu_canal"}
🎉 Conexión establecida exitosamente
✅ Conectado a Twitch correctamente
📍 Servidor: irc.chat.twitch.tv:443
```

## 🚀 **Verificación Final**

1. **Reinicia el servidor**: `npm run dev`
2. **Abre la consola del navegador**
3. **Busca los mensajes de conexión**
4. **Prueba enviar un mensaje** con `!start` en el chat

## 📞 **Soporte**

Si el problema persiste:
1. Verifica que el token sea válido
2. Confirma que el canal exista
3. Revisa permisos del bot
4. Contacta a soporte de Twitch si es necesario
