const express = require('express'),
    morgan = require('morgan'),
    path = require('path');

require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;
const HOSTNAME = process.env.HOSTNAME_SERVER || 'localhost';
const PROD = process.env.NODE_ENV == 'production';

const start = Date.now();

// Middleware
// Bodyparsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Serve our static build files
app.use(express.static(path.join(__dirname, '../client/build')));
// Route logging
app.use(morgan('dev'));

const apiRouter = require('./controllers/api');

app.use('/api', apiRouter);

// TODO: DEBUG PATH - REMOVE LATER
app.get('/uptime', (req, res) => {
    let checked = Date.now();
    res.json({
        checked: checked,
        uptime: checked - start
    })
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, `../client/${PROD ? 'build' : 'public'}/index.html`));
});

app.get('*', (req, res) => {
    res.status(404);
    res.send("Not found");
});

//Startup
app.listen(PORT, HOSTNAME, () => {
    console.log(`The Server is running at: http://${HOSTNAME}:${PORT}`)
})
