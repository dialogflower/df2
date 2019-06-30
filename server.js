#!/usr/bin/env node

'use strict';
const https = require ('https');
const dotenv = require('dotenv');
dotenv.config({path: `${__dirname}/.env`});

const express = require('express');
const bodyParser = require('body-parser');
const {dialogflow} = require('actions-on-google');

const server = express();
const assistant = dialogflow();
const router = express.Router();

const emptyPage = 'static/nothing.html';

server.set('port', process.env.PORT || 1488);
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json({type: 'application/json'}));

assistant.intent('helloWorld', conv => {
    let name = conv.parameters.name;
    console.log('Hello, welcome ' + name);
    conv.ask('Hello, welcome ' + name);
});

router.use(function (req, res, next) {
    //todo: req.query.key
    console.log('http://' + req.headers.host + req.url, ' - ', req.headers['user-agent'], ' - ', req.query.key);
    next();
});

router.get('/', function (req, res) {res.sendFile(emptyPage,{ root:__dirname })});
router.post('/webhook', assistant);
server.use('/', router);
server.listen(server.get('port'), function () {
    console.log('Express server started on port', server.get('port'));
});
