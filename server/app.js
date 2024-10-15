const express = require('express'),
    morgan = require('morgan'),
    path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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

//Serving react on routes unused by previous routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

//Startup
app.listen(PORT, () => {
    console.log(`The API Server is listening on port: ${PORT}`)
})
