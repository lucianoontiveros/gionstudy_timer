# 🕒 Timer Interactivo para Twitch - Cuarto de Chenz

## 🎯 Objetivo del Proyecto
Este proyecto implementa un temporizador Pomodoro interactivo para el canal de Twitch "Cuarto de Chenz". Permite a los espectadores interactuar con el temporizador a través de comandos en el chat, facilitando sesiones de estudio o trabajo en grupo.

## 🌟 Características Principales

### Temporizador Pomodoro Mejorado
- **Fases del Temporizador**:
  - `INICIANDO`: Estado inicial del temporizador (10 minutos)
  - `💻PRODUCTIVO📋`: Fase de trabajo (90 minutos por defecto)
  - `🍵DESCANSO🍙`: Fase de descanso (10 minutos por defecto)
  - `🌳HEMOS TERMINADO🌳`: Estado final al completar todos los pomodoros

- **Configuración Actual**:
  - **Total de Pomodoros**: 7 pomodoros por sesión
  - **Tiempo Productivo**: 90 minutos por pomodoro
  - **Tiempo de Descanso**: 10 minutos
  - **Tiempo de Inicio**: 10 minutos

- **Modos de Operación**:
  - **Automático**: Avanza automáticamente entre fases
  - **Manual**: Requiere confirmación para cambiar entre fases

- **Visualización en Tiem Real**:
  - Muestra la fecha y hora actual en Córdoba, Argentina
  - Indicador visual de la fase actual
  - Contador de pomodoros completados

### Interacción por Chat
Los espectadores pueden interactuar con el temporizador mediante comandos en el chat de Twitch.

# 📁 Estructura del Proyecto
- **App.jsx**: Contiene la lógica principal del temporizador, gestión de estados y control de flujo de la aplicación.
- **Qrcode.jsx**: Genera y muestra códigos QR interactivos.
- **qrcode.css**: Estilos para el componente de código QR.
- **News.jsx**: Muestra noticias o mensajes relevantes en la interfaz.
- **news.css**: Estilos para el componente de noticias.
- **index.css**: Estilos globales y variables de diseño.
- **/controller/twitch_controller.js**: Maneja la conexión con la API de Twitch.
- **/controller/controller_mensajes.js**: Gestiona los mensajes enviados al chat de Twitch.

# 🎮 Comandos del Chat

La aplicación responde a los siguientes comandos en el chat de Twitch:

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `!start` | Inicia el temporizador para la fase actual | `!start` |
| `!pause` | Pausa el temporizador | `!pause` |
| `!min [minutos]` | Establece la duración del temporizador en minutos | `!min 25` |
| `!pomo [número]` | Establece el número de pomodoros completados | `!pomo 2` |
| `!pomot [total]` | Establece el total de pomodoros a completar | `!pomot 4` |
| `!mode` | Cambia entre modo automático y manual | `!mode` |
| `!reset` | Reinicia a la fase PRODUCTIVO | `!reset` |
| `!aviso [mensaje]` | Muestra un mensaje en la aplicación | `!aviso Próximo descanso a las 15:00` |
| `!codigo [token]` | Actualiza el código QR | `!codigo ABC123` |
| `!sala` o `!room` | Muestra información de la sala de estudio | `!sala` |

## Funcionalidades

1. **Temporizador Pomodoro**: 
   - Permite establecer un temporizador para sesiones de trabajo y descansos.
   - Fases de trabajo: "INICIANDO", "PRODUCTIVO", "DESCANSO", y "TERMINADO".

2. **Contador de Pomodoros**: 
   - Lleva un registro de la cantidad de pomodoros completados y permite establecer un objetivo total.

3. **Modo de operación**: 
   - Soporta modos "auto" y "manual" para el control del temporizador.

4. **Notificaciones**: 
   - Envía mensajes de estado a los usuarios en diferentes fases del temporizador.

5. **Interfaz de usuario dinámica**: 
   - Muestra mensajes en tiempo real utilizando un efecto de escritura.

6. **Código QR**: 
   - Genera un código QR basado en un token proporcionado.

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React**: Biblioteca de JavaScript para construir interfaces de usuario interactivas.
- **Vite**: Entorno de desarrollo ultrarrápido con HMR (Hot Module Replacement).
- **tmi.js**: Biblioteca para interactuar con la API de chat de Twitch.
- **CSS Modules**: Para estilos modulares y mantenibles.

### Plugins y Herramientas
- **@vitejs/plugin-react**: Habilita Fast Refresh para desarrollo ágil.
- **ESLint**: Para mantener la calidad del código.
- **PostCSS**: Para estilos CSS modernos con autoprefijado.

### Funcionalidades

- **Configuración Mínima**: La aplicación está diseñada para ser fácil de configurar y comenzar a usar, lo que es ideal para desarrolladores que buscan un entorno ligero y eficiente.
- **Desarrollo Rápido**: Gracias a Vite y su soporte para HMR, los desarrolladores pueden ver los cambios en tiempo real, lo que acelera el proceso de desarrollo.
- **Soporte para ESLint**: Se incluyen algunas reglas de ESLint para ayudar a mantener la calidad del código.

# 🚀 Instalación y Ejecución

### Requisitos Previos
- Node.js (v14 o superior)
- npm (v7 o superior) o Yarn
- Cuenta de desarrollador de Twitch (opcional, solo para comandos de chat)

### Pasos para Iniciar

1. **Clonar el Repositorio**
   ```bash
   git clone [URL del repositorio]
   cd timer-cuartodechenz
   ```

2. **Instalar Dependencias**
   ```bash
   npm install
   # o
   yarn
   ```

3. **Configurar Variables de Entorno**
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   VITE_APP_USERNAME=tu_usuario_bot
   VITE_APP_PASSWORD=oauth:tu_token_twitch
   VITE_APP_CHANNELS=cuartodechenz
   ```

4. **Iniciar el Servidor de Desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

5. **Construir para Producción**
   ```bash
   npm run build
   npm run preview
   ```


# 🔗 Integración con Twitch

La aplicación se conecta al chat de Twitch mediante la API de tmi.js, permitiendo:

- Interacción en tiempo real con los espectadores
- Control del temporizador mediante comandos de chat
- Mensajes automáticos en diferentes fases del temporizador
- Saludos personalizados para nuevos usuarios, suscriptores y moderadores

### Configuración de la Cuenta de Bot
1. Crea una cuenta de desarrollador en [Twitch Developer Console](https://dev.twitch.tv/console)
2. Registra una nueva aplicación para obtener las credenciales
3. Genera un token OAuth para el bot en [Twitch Token Generator](https://twitchtokengenerator.com/)
4. Configura las variables de entorno según las instrucciones de instalación

## 🛠️ Mantenimiento y Mejoras

### Estructura del Código
- Organización modular con separación clara de responsabilidades
- Componentes reutilizables y bien documentados

### Próximas Mejoras
- [ ] Añadir más comandos personalizables
- [ ] Implementar estadísticas de uso
- [ ] Mejorar la interfaz de usuario
- [ ] Añadir temas personalizables

### Reporte de Problemas
Si encuentras algún error o tienes sugerencias, por favor [crea un issue](https://github.com/tu-usuario/timer-cuartodechenz/issues) en el repositorio.

## 📄 Licencia
Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ para la comunidad de Cuarto de Chenz

### 6. Pruebas
- Se han implementado pruebas unitarias y de integración adecuadas.
- La cobertura de las pruebas es evaluada y se considera agregar más pruebas si es necesario.

### 7. Experiencia del Usuario (UX)
- La interfaz de usuario es atractiva.
- Se recomienda realizar pruebas de usabilidad con usuarios reales.
# gionstudy_timer
