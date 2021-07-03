const express = require('express');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Protection = require('./Protection.js');
const morgan = require("morgan");
const path = require('path');
const rfs = require('rotating-file-stream');
const Repository = require('./Repository.js');
const { createProxyMiddleware } = require('http-proxy-middleware');
const Whitelist = require('./Whitelist.js');
const helmet = require("helmet");

(require('dotenv')).config();


const app = express();
app.use(helmet({
    contentSecurityPolicy: false
}));

//Proxy Related
const PORT = process.env.AUTH_PORT;
const HOST = process.env.AUTH_HOST;
const PROGRAM_SERVICE_URL = process.env.PROGRAM_SERVICE_URL;


/////// LOGIN

// create a rotating write stream
let accessLogStream = rfs.createStream('access.log', {
    size: "10M", // rotate every 10 MegaBytes written
    interval: "1d", // rotate daily
    compress: "gzip", // compress rotated files
    maxFiles: 10,
    path: path.join(__dirname, 'log')
});

app.use(morgan('common', {
    stream: accessLogStream
}));

//////////////

// To support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());

app.engine('hbs', exphbs({
    extname: '.hbs'
}));

app.set('view engine', 'hbs');

// Our requests hadlers will be implemented here...
app.get('/home', function (req, res) {
    res.render('home');
});


app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { email, firstName, lastName, password, confirmPassword } = req.body;

    // Check if the password and confirm password fields match
    if (password === confirmPassword) {

        //Check if the fields are not all blank
        if (email && firstName && lastName && password && confirmPassword) {

            let records = await Repository.getAllRecords();
            // Check if user with the same email is also registered
            if (records.find(user => user.email === email)) {
                res.render('register', {
                    message: 'User already registered.',
                    messageClass: 'alert-danger'
                });
                return;
            }

            const hashedPassword = await Protection.getHashedPassword(password);

            // Store user into the database if you are using one
            await Repository.create({
                firstName,
                lastName,
                email,
                password: hashedPassword
            });

            res.render('login', {
                message: 'Registration Complete. Please login to continue.',
                messageClass: 'alert-success'
            });

        } else {
            res.render('register', {
                message: 'All fields are required.',
                messageClass: 'alert-danger'
            });
            return;
        }
    } else {
        res.render('register', {
            message: 'Password does not match.',
            messageClass: 'alert-danger'
        });
    }
});


// User Sessions
const authTokens = {};

// Check Cookies for TeamOneAuthToken on Every Request
app.use((req, res, next) => {
    // Get auth token from the cookies
    const authToken = req.cookies['TeamOneAuthToken'];

    // Inject the user to the request
    req.user = authTokens[authToken];

    next();
});


app.get('/login', (req, res) => {
    if (req.user) {
        res.redirect('/profile');
    } else {
        res.render('login');
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = await Protection.getHashedPassword(password);

    const user = (await Repository.getAllRecords()).find(u => {
        return u.email === email && hashedPassword === u.password
    });

    if (user) {
        if ((await Whitelist.getAllRecords()).includes(user.email)) {
            const authToken = Protection.generateAuthToken();

            // Store authentication token
            authTokens[authToken] = user;

            // Setting the auth token in cookies
            res.cookie('TeamOneAuthToken', authToken);

            // Redirect user to the profile page
            res.redirect('/profile');
        } else {
            res.render('login', {
                message: 'You can\'t login, you have not been invited yet',
                messageClass: 'alert-danger'
            });
        }
    } else {
        res.render('login', {
            message: 'Invalid username or password',
            messageClass: 'alert-danger'
        });
    }
});

app.post('/logout', async (req, res) => {
    delete authTokens[req.cookies.authToken];

    // Setting the auth token in cookies
    res.cookie('TeamOneAuthToken', "");

    // Redirect user to the profile page
    res.redirect('/profile');
});

const requireAuth = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.render('login', {
            message: 'Please login to continue',
            messageClass: 'alert-danger'
        });
    }
};

app.get('/profile', requireAuth, (req, res) => {
    res.render('profile', {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
    });
});


app.get('/program', requireAuth, (req, res) => {
    /**
     * Go to SuperAlgos
     */
    res.redirect('/');
});

app.use('/', requireAuth, createProxyMiddleware({
    target: PROGRAM_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        [`^/`]: '',
    },
}));

// Parse Errors to prevent stack trace from showing
app.use((err, req, res, next) => {
    if (err) {
        console.log(err);
        return res.render('505');
    }
    next();
});


// Start the Proxy
app.listen(PORT, HOST, () => {
    console.log(`Booting ${HOST}:${PORT}`);
});