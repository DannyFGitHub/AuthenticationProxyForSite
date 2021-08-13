const express = require("express");
const exphbs = require("express-handlebars");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Protection = require("./Protection.js");
const morgan = require("morgan");
const path = require("path");
const https = require("https");
const fs = require("fs");
const rfs = require("rotating-file-stream");
const Repository = require("./Repository.js");
const { createProxyMiddleware } = require("http-proxy-middleware");
const Whitelist = require("./Whitelist.js");
const helmet = require("helmet");

require("dotenv").config();

let key = fs.readFileSync(__dirname + "/certs/selfsigned.key");
let cert = fs.readFileSync(__dirname + "/certs/selfsigned.crt");
let options = {
  key: key,
  cert: cert,
};

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: false,
    noSniff: false,
  })
);

let server = https.createServer(options, app);

//Proxy Related
const PORT = process.env.WS_PORT;
const HOST = process.env.AUTH_HOST;
const PROGRAM_SERVICE_WEBSOCKET_URL = process.env.PROGRAM_SERVICE_WEBSOCKET_URL;

//////////////

// To support URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
// To parse cookies from the HTTP Request
app.use(cookieParser());

const requireAuth = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.render("login", {
      message: "Please login to continue",
      messageClass: "alert-danger",
    });
  }
};

app.use(
  "/",
  requireAuth,
  createProxyMiddleware({
    target: PROGRAM_SERVICE_WEBSOCKET_URL,
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      [`^/`]: "",
    },
  })
);

// Parse Errors to prevent stack trace from showing
app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
    return res.render("505");
  }
  next();
});

server.listen(PORT, HOST, () => {
  console.log(`Booting ${HOST}:${PORT}`);
});
