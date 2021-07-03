Concept:

// const express = require('express');
// const morgan = require("morgan");
// const { createProxyMiddleware } = require('http-proxy-middleware');

// const PORT = XXXX;
// const HOST = "host";
// const API_SERVICE_URL = "localhost:XXXX";

// const app = express();
// app.use(morgan('dev'));

//  app.use('', (req, res, next) => {
//     if (!req.headers.authorization) {
//         next();
//     } else {
//         res.sendStatus(403);
//     }
//  });

//  app.use('/', createProxyMiddleware({
//     target: API_SERVICE_URL,
//     changeOrigin: true,
//     pathRewrite: {
//         [`^/start`]: '',
//     },
//  }));


//  // Start the Proxy
// app.listen(PORT, HOST, () => {
//     console.log(`Booting ${HOST}:${PORT}`);
//  });