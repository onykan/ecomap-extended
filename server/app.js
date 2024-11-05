const express = require('express'),
    morgan = require('morgan'),
    path = require('path');

require('dotenv').config({path: '../.env'});

const app = express();
const PORT = process.env.PORT || 3001;
const HOSTNAME = process.env.HOSTNAME || 'localhost';

const start = Date.now();

// Middleware
// Bodyparsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Serve our static build files
app.use(express.static(path.join(__dirname, '../client/build')));
// Provides great rout logging in our console for debugging
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
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

//Serving react on routes unused by previous routing
app.get('*', (req, res) => {
    res.status(404);
    res.send("Not found");
});

//Startup
app.listen(PORT, HOSTNAME, () => {
    console.log(`The Server is running at: http://${HOSTNAME}:${PORT}`)
})
