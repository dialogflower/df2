#!/usr/bin/env node

/*
    Inspired by:
    - https://github.com/actions-on-google/dialogflow-conversation-components-nodejs/issues/8
    - https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment
    - https://developers.google.com/actions/reference/nodejs/lib-v1-migration
    - https://developers.google.com/actions/assistant/responses#nodejs
    - https://stackoverflow.com/questions/48583023/ - Reference Error: request is not defined
    - https://github.com/dialogflower/df2.git

 */


'use strict';
const dotenv = require('dotenv');
dotenv.config({path: `${__dirname}/.env`});
const express = require('express');
const bodyParser = require('body-parser');
const {WebhookClient, Card, Payload, Text, Suggestion} = require('dialogflow-fulfillment');
const server = express();
const emptyPage = 'static/nothing.html';

process.env.DEBUG = 'dialogflow:debug';
server.set('port', process.env.PORT || 1488);
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json({type: 'application/json'}));

function logging(req, res, next) {
    console.log('http://' + req.headers.host + req.url, ' - ', req.headers['user-agent'], ' - ', req.method);
    if (process.env.LOG_LEVEL > 2) {
        console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
        console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
        console.log('\n')
    }
    next();
}

function giveNothing(request, response) {
    response.sendFile(emptyPage, {root: __dirname})
}

function webhook(request, response) {
    const agent = new WebhookClient({request, response});
    agent.requestSource = agent.ACTIONS_ON_GOOGLE;

    function welcome(agent) {
        agent.add(`Скажи мне что-нибудь по-русски`);
        agent.add(`Говоришь по-русски?`);
        agent.add(`Ты меня понимаешь?`);
    }

    function fallback(agent) {
        agent.add(`Переформулируйте, пожалуйста`);
        agent.add(`А можете по-другому?`);
        agent.add(`Вот эта последняя фраза мне не ясна.`);
    }

    function ruName(agent) {
        const RuNamer = require('./utils/ru_namer');
        const russianName = RuNamer.getNew();
        agent.add(new Text({"text": {"text": [russianName]}}));
        console.log(russianName)
    }

    function enName(agent) {
        const EnNamer = require('./utils/en_namer');
        const englishName = EnNamer.getNew();
        agent.add(new Text({"text": {"text": [englishName]}}));
        console.log(englishName)
    }

    function imeiHandler(agent) {
        const IMEI = require('./utils/imei');
        const hardwareID = IMEI.getNew();
        const imei = hardwareID[0];
        const model = hardwareID[1];
        const link = 'https://imei.info/' + imei;
        agent.add(new Text({"text": {"text": [imei]}}));
        agent.add(new Text({"text": {"text": [model]}}));
        agent.add(new Text({"text": {"text": [link]}}));
        console.log(imei, model)
    }

    function timaticHandler(agent) {
        let conv = agent.conv();
        conv.ask('Hello from the Actions on Google client library!');
        console.log('Hello from the Actions on Google client library!');
        agent.end(conv);
    }


    function myHandler(agent) {
        agent.add(`This message is from Dialogflow's Cloud Functions!`);
        agent.add(new Suggestion(`Quick Reply`));
        agent.add(new Suggestion(`Suggestion`));
        agent.add(new Card({
                title: `Title: this is a card title`,
                imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
                text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
                buttonText: 'This is a button',
                buttonUrl: 'https://assistant.google.com/'
            })
        );
        agent.add(new Text({"text": {"text": ["Это интент для телеграма"]}, "platform": "TELEGRAM"}));
        agent.add(new Text({"text": {"text": ["Это интент для всех"]}}));
        const tgPayload = require('./static/tgPayloadGetPhoneNumber.json');
        agent.add(new Payload(agent.TELEGRAM, tgPayload, {sendAsMessage: true}));
        agent.context.set({name: 'weather', lifespan: 2, parameters: {city: 'Rome'}});
        console.log(`This message is from Dialogflow's Cloud Functions!`);
    }

    function googleAssistantHandler(agent) {
        let conv = agent.conv();
        conv.ask('Hello from the Actions on Google client library!');
        console.log('Hello from the Actions on Google client library!');
        agent.end(conv);
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('helloWorld', myHandler);
    intentMap.set('russian name', ruName);
    intentMap.set('imei', imeiHandler);
    intentMap.set('name', enName);
    intentMap.set('visa', timaticHandler);
    agent.handleRequest(intentMap);
}

server.use('/', logging);
server.get('/', giveNothing);
server.get('/webhook', giveNothing);
server.post('/webhook', webhook);

server.listen(server.get('port'), function () {
    console.log('Express server started on port', server.get('port'));
});
