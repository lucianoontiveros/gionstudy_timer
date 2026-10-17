# 🔧 Configuración de Twitch API - Guía Completa

## Configuración y diagnóstico de Twitch

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

## 🔍 Diagnóstico

### **Error: `Not connected to server`**
- **Causa posible**: interrupción de red, cierre del WebSocket o indisponibilidad temporal de Twitch.
- **Solución**: el timer reintenta automáticamente con espera progresiva (hasta 30 segundos entre intentos) mientras la fuente siga activa. No vuelvas a autorizar por este error.

### **Error: `Login authentication failed`**
- **Causa**: Twitch rechazó las credenciales IRC. La conexión se detiene y el indicador muestra **Autorización requerida**.
- **Solución**: verifica que el token corresponda al usuario del bot y que siga siendo válido/revocación no haya ocurrido. Actualiza `VITE_APP_PASSWORD` y reconstruye o reinicia la aplicación con el entorno actualizado. El timer no puede renovar este token: la configuración actual solo contiene un token de acceso IRC, no un flujo OAuth con refresh token.

### **Error: No se encuentra variables**
- **Causa**: Archivo `.env` no configurado
- **Solución**: Completa las variables requeridas

Las variables `VITE_*` se incorporan al JavaScript que ejecuta el navegador. No guardes el `.env` en el repositorio ni compartas el bundle si contiene credenciales; utiliza una cuenta de bot y un token con los permisos mínimos necesarios.

## 🧪 Verificar la conexión

Después de configurar, reinicia tu servidor y revisa el indicador discreto **Twitch** en la esquina superior derecha:

Debe cambiar de **Conectando** a **Conectado**. Ante una interrupción transitoria mostrará **Reconectando** y volverá a **Conectado** si se recupera el chat. Los comandos y los timers continúan con el mismo estado durante la reconexión.

## 🚀 **Verificación Final**

1. **Reinicia el servidor**: `npm run dev`
2. **Abre la consola del navegador** para ver errores de conexión sin credenciales.
3. **Comprueba el indicador** de estado.
4. **Prueba un comando** como `!start` en el chat.
5. **Recarga o cambia de escena en OBS** y comprueba que el estado vuelva a **Conectado** sin reiniciar el timer.

## 📞 **Soporte**

Si el problema persiste:
1. Verifica que el token sea válido
2. Confirma que el canal exista
3. Revisa permisos del bot
4. Contacta a soporte de Twitch si es necesario
