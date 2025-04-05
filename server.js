const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const robot = require("robotjs");
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const SESSION_FILE = path.join(__dirname, 'sessionData.json');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const managerApp = express();
const managerServer = http.createServer(managerApp);
const managerWss = new WebSocket.Server({ server: managerServer });

let serverRunning = true;

// Serve the server manager UI
managerApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'server-manager.html'));
});

// API endpoint to check server status
managerApp.get('/api/server-status', (req, res) => {
    res.json({ running: serverRunning });
});

// API endpoint to start the server
managerApp.post('/api/start-server', (req, res) => {
    if (!serverRunning) {
        server.listen(PORT, () => {
            serverRunning = true;
            console.log(`Server started on http://localhost:${PORT}`);
            res.status(200).json({ success: true });
        });
    } else {
        res.status(400).json({ error: 'Server is already running' });
    }
});

// API endpoint to stop the server
managerApp.post('/api/stop-server', (req, res) => {
    if (serverRunning) {
        server.close(() => {
            serverRunning = false;
            console.log('Server stopped.');
            res.status(200).json({ success: true });
        });
    } else {
        res.status(400).json({ error: 'Server is already stopped' });
    }
});

// WebSocket message handling for server control
managerWss.on('connection', (ws) => {
    ws.send(JSON.stringify({ action: 'server-status', running: serverRunning }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.action === 'start-server' && !serverRunning) {
            server.listen(PORT, () => {
                serverRunning = true;
                console.log(`Server started on http://localhost:${PORT}`);
                broadcastServerStatus();
            });
        } else if (data.action === 'stop-server' && serverRunning) {
            server.close(() => {
                serverRunning = false;
                console.log('Server stopped.');
                broadcastServerStatus();
            });
        }
    });
});

// Broadcast server status to all WebSocket clients
function broadcastServerStatus() {
    managerWss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: 'server-status', running: serverRunning }));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        // Relay the message to all other clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('Client disconnected'));
});

// Track session data
let sessionData = {
    id: generateSessionId(),
};

let mouseEvents = [];
let lastMousePos = { x: null, y: null };

// Generate a simple session ID
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Load previous session
const loadSession = () => {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const savedData = JSON.parse(fs.readFileSync(SESSION_FILE));
            sessionData = savedData.sessionData || initSession();
            mouseEvents = savedData.mouseEvents || [];
            lastMousePos = mouseEvents.length > 0
                ? { x: mouseEvents[mouseEvents.length - 1].x, y: mouseEvents[mouseEvents.length - 1].y }
                : { x: null, y: null };

            console.log(`Session restored: ${sessionData.id}`);
        } else {
            initSession();
        }
    } catch (err) {
        console.error("Failed to load previous session:", err);
        initSession();
    }
};

// Initialize a new session
const initSession = () => {
    sessionData = {
        id: generateSessionId(),
        completedCaptchas: 0,
        mouseMovements: 0, 
    };
    mouseEvents = [];
    console.log("New session started: ${sessionData.id}");
    return sessionData.id;
};

// End current session
const endSession = () => {
    sessionData.endTime = new Date();
    console.log(`Session ended: ${sessionData.id}`);
    return sessionData;
};

// Initialize session when server starts
loadSession();

// Serve static files (for frontend)
app.use(express.static(__dirname));

// API endpoint to update completed captchas count
app.post('/api/captcha-complete', express.json(), (req, res) => {
    sessionData.completedCaptchas += 1;
    res.status(200).json({ success: true });
    // console.log(`Number of completedCaptchas: ${sessionData.completedCaptchas}`);
});

// Get sessions (returns just the current one since we're not using MongoDB)
app.get('/api/session-full', (req, res) => {
    res.json({ sessionData, mouseEvents });
});

app.get('/api/mouse-today', (req, res) => {
    const today = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }).split(',')[0]; // "M/D/YYYY"

    const filtered = mouseEvents.filter(ev => {
        const evDate = new Date(ev.timestamp).toLocaleString('en-US', { timeZone: 'America/New_York' }).split(',')[0];
        return evDate === today;
    });

    res.json(filtered);
});

app.get('/api/mouse-all', (req, res) => {
    res.json(mouseEvents);
});

function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Function to track mouse position and broadcast it
const MOVEMENT_THRESHOLD = 200; // Minimum pixel distance to count as a move
let isMoving = false;
let noMovementStartTime = null; // Track when no movement started

const sendMousePosition = () => {
    try {
if (!isMoving) return; // Do not send data if not moving

        const pos = robot.getMousePos();
        const mouseData = { 
            x: pos.x, 
            y: pos.y, 
            timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
            completedCaptchas: sessionData.completedCaptchas,
            mouseMovements: sessionData.mouseMovements 
};

        // Count only significant movements
        if (lastMousePos.x !== null && getDistance(pos, lastMousePos) >= MOVEMENT_THRESHOLD) {
            sessionData.mouseMovements += 1;
            lastMousePos = { x: pos.x, y: pos.y };
                    } else if (lastMousePos.x === null) {
            // Initialize position
            lastMousePos = { x: pos.x, y: pos.y };
        }
 
        // Save movement events approximately once per second
        if (new Date().getMilliseconds() < 100) {
            mouseEvents.push({
                sessionId: sessionData.id,
                timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
                x: pos.x,
                y: pos.y,
            });

            if (mouseEvents.length > 10000) {
                mouseEvents = mouseEvents.slice(-5000);
            }
        }

        // Send data to clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(mouseData));
            }
        });
    } catch (error) {
        console.error("Error getting mouse position:", error);
    }
};

let lastMouseCheckTime = Date.now();
let lastMouseCheckPos = { x: null, y: null };

const checkMouseMovement = () => {
    const currentPos = robot.getMousePos();
    const currentTime = Date.now();

    if (
        lastMouseCheckPos.x === currentPos.x &&
        lastMouseCheckPos.y === currentPos.y &&
        currentTime - lastMouseCheckTime >= 1500
) {
        if (!isMoving) {
            // If already not moving, check if 15 seconds have passed
            if (noMovementStartTime && currentTime - noMovementStartTime >= 10000) {
//console.log("No movement detected for 15 seconds. Refreshing page...");
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ action: "refresh" })); // Notify clients to refresh
                    }
                });
                noMovementStartTime = null; // Reset no movement timer
            }
        } else {
isMoving = false;
//console.log("Mouse stopped moving.");
            noMovementStartTime = currentTime; // Start tracking no movement time
        }
  } else if (
      lastMouseCheckPos.x !== currentPos.x ||
        lastMouseCheckPos.y !== currentPos.y
    ) {
        isMoving = true;
noMovementStartTime = null; // Reset no movement timer
        lastMouseCheckTime = currentTime; // Reset the timer
        lastMouseCheckPos = { x: currentPos.x, y: currentPos.y }; // Update position
    }
};

// Call this function every second
setInterval(checkMouseMovement, 1000);

// Update mouse position every 100ms
const intervalId = setInterval(sendMousePosition, 100);

// Set a dynamic port for DigitalOcean
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Start the server manager on a different port
const MANAGER_PORT = process.env.MANAGER_PORT;
managerServer.listen(MANAGER_PORT, () => {
    console.log(`Server Manager is running on http://localhost:${MANAGER_PORT}`);
});

// Graceful Shutdown Handler
const shutdown = () => {
    console.log("Shutting down server...");

    clearInterval(intervalId);
    endSession();

    // Save session data and mouseEvents to file
    try {
        const saveData = {
            sessionData,
            mouseEvents
        };
        fs.writeFileSync(SESSION_FILE, JSON.stringify(saveData, null, 2));
        console.log("Session data saved.");
    } catch (error) {
        console.error("Failed to save session data:", error);
    }

    wss.clients.forEach(client => client.terminate());
    wss.close(() => {
        console.log("WebSocket server closed.");
        server.close(() => {
            console.log("HTTP server closed.");
            process.exit(0);
        });
    });

    setTimeout(() => {
        console.error("Force exiting...");
        process.exit(1);
    }, 5000);
};

// Handle process termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown();
});
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    shutdown();
});