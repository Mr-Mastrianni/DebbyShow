const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;

app.use(bodyParser.json());

// Domain redirect middleware - redirect debbieshow.com to debbyshow.com
app.use((req, res, next) => {
    const host = req.get('host');
    
    // If the request is from debbieshow.com, redirect to debbyshow.com
    if (host && (host.includes('debbieshow.com') || host.includes('www.debbieshow.com'))) {
        const protocol = req.protocol;
        const newHost = host.replace('debbieshow.com', 'debbyshow.com');
        return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
    }
    
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address.' });
    }

    const emailFilePath = path.join(__dirname, 'subscribers.txt');
    const emailEntry = `${new Date().toISOString()} - ${email}\n`;

    fs.appendFile(emailFilePath, emailEntry, (err) => {
        if (err) {
            console.error('Error saving email:', err);
            return res.status(500).json({ message: 'Error subscribing. Please try again later.' });
        }
        console.log('New subscriber:', email);
        res.status(200).json({ message: 'Thank you for subscribing!' });
    });
});

const MAX_PORT_ATTEMPTS = 5;
let portAttempts = 0;

function startServer(currentPort) {
    const server = app.listen(currentPort, () => {
        console.log(`Server listening at http://localhost:${currentPort}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            portAttempts++;
            if (portAttempts >= MAX_PORT_ATTEMPTS) {
                console.error(`Max port attempts (${MAX_PORT_ATTEMPTS}) reached. Please free up port ${currentPort} or specify a different port.`);
                process.exit(1);
            }

            console.error(`Port ${currentPort} is already in use`);
            const newPort = currentPort + 1;
            console.log(`Attempting to use port ${newPort} instead...`);

            // Close previous server instance
            server.close(() => {
                startServer(newPort);
            });
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

// Start the server with initial port
startServer(port);