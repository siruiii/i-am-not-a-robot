# I'm Not a Robot
[Spring 2025] Open Call Project on the theme of hoarding.

I’m Not a Robot explores the invisible labor embedded in everyday digital tasks. Using the familiar reCAPTCHA interface, the work reflects on systems of surveillance, control, and the silent collection of human input. Visual layers—unlocked through interaction—reveal how digital behavior unknowingly becomes data: tracked, recorded, and repurposed by systems that might extract value from it.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage Instructions](#usage-instructions)
  - [Start of Day](#start-of-day)
  - [End of Day](#end-of-day)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
  

## Overview

The **Server Manager** serves as the main control panel for the "I'm Not a Robot" app. Its primary functions are to:

- Start and stop the backend server.
- Display the current server status in real-time.
- Provide instructions for setting up and managing browser tabs.

Communication with the backend is handled via WebSockets for real-time responsiveness.

## Project Structure

```
.env  
.gitignore  
index.html  
package.json  
README.md  
roll.html  
server-manager.html  
server.js  
sessionData.json  
stats.html  
glitch-effect/  
  └── glitch-image.png  
mgGlitch.js  
mgGlitch.min.js  
```

### Key Files

- **`server-manager.html`** — Main interface for managing the server.
- **`server.js`** — Backend server script with WebSocket handling.
- **`stats.html`**, **`index.html`**, **`roll.html`** — Browser tabs required during operation.


## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install Dependencies**  
   Make sure you have [Node.js](https://nodejs.org/) installed. Then run:
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   node server.js
   ```

4. **Access the Server Manager**  
   Open the following in your browser:
   ```
   http://localhost:8001
   ```

## Usage Instructions

### Start of Day

1. Open the Server Manager interface `http://localhost:8001`.
2. Click the **Start Server** button.
3. Open the following tabs:
   - Left Monitor: `http://localhost:8000/stats.html`
   - Center Monitor (Incognito Mode): `http://localhost:8000/index.html`
   - Right Monitor: `http://localhost:8000/roll.html`
4. Set each tab to full-screen mode.
5. Refresh all tabs to confirm proper initialization.

### End of Day

1. Click the **Stop Server** button in the Server Manager.
2. After 10–15 seconds, Refresh each browser tab. All tabs should display: "This site can’t be reached."

## Development

### WebSocket Communication

The Server Manager interacts with the backend server using WebSockets. Key events include:

- `server-status` — Reports whether the server is running.
- `start-server` — Starts the server process.
- `stop-server` — Stops the server process.

### Frontend

Implemented in `server-manager.html`, the frontend includes:

- Real-time server status display.
- Buttons to start and stop the server.
- Clear instructions for session setup.

### Backend

Implemented in `server.js`, the backend handles:

- WebSocket connections and communication.
- Logic to control the server’s lifecycle.
