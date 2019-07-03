#!/usr/bin/env node

/*
    Inspired by:
    - https://github.com/actions-on-google/dialogflow-conversation-components-nodejs/issues/8
    - https://miningbusinessdata.com/dialogflow-tutorial-setting-context-from-your-inline-webhook-using-contextout/
    - https://miningbusinessdata.com/handling-unexpected-user-input-in-dialogflow/
    - https://dialogflow.com/docs/reference/v1-v2-migration-guide-fulfillment
    - https://developers.google.com/actions/reference/nodejs/lib-v1-migration
    - https://developers.google.com/actions/assistant/responses#nodejs
    - https://habr.com/ru/company/redmadrobot/blog/420111/
    - https://stackoverflow.com/questions/48583023/ - Reference Error: request is not defined
    - https://github.com/dialogflower/df2.git
    - CAADBAADXAADUYzPAYxyzyEYDeBVAg
 */


'use strict';
const dotenv = require('dotenv');
dotenv.config({path: `${__dirname}/.env`});
const express = require('express');
const rp = require('request-promise');
const $ = require('cheerio');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
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
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function ruName(agent) {
        const RuNamer = require('./utils/ru_namer');
        const russianName = RuNamer.getNew();
        agent.add(new Text(russianName));
        console.log(russianName)
    }

    function americanName(agent) {
        const AmericanNamer = require('./utils/amer_namer');
        const americanName = AmericanNamer.getNew();
        agent.add(new Text(americanName));
        console.log(americanName)
    }

    function britishName(agent) {
        const BritishNamer = require('./utils/gb_namer');
        const britishName = BritishNamer.getNew();
        agent.add(new Text(britishName));
        console.log(britishName)
    }

    function deName(agent) {
        const DeNamer = require('./utils/de_namer');
        const germanName = DeNamer.getNew();
        agent.add(new Text(germanName));
        console.log(germanName)
    }

    function esName(agent) {
        const EsNamer = require('./utils/es_namer');
        const hispanicName = EsNamer.getNew();
        agent.add(new Text(hispanicName));
        console.log(hispanicName)
    }

    function imeiHandler(agent) {
        const IMEI = require('./utils/imei');
        const hardwareID = IMEI.getNew();
        const imei = hardwareID[0];
        const model = hardwareID[1];
        const link = 'https://imei.info/' + imei;
        agent.add(new Text(imei + '\n' + model + '\n' + link));
        console.log(imei, model)
    }

    function timaticHandler(agent) {
        // todo: refactor this spaghetti
        const endpoint = 'https://www.timaticweb.com/cgi-bin/tim_website_client.cgi';
        const prefix = 'SpecData=1&VISA=';
        const passtype = 'PASSTYPES=PASS';
        let nationalParam = 'NA=';
        let residenceParam = '';
        let destParam = 'DE=';
        const postfix = 'user=GF&subuser=GFB2C';

        const contexts = agent.context.contexts;
        const firstContextName = Object.keys(contexts)[0];
        const context = contexts[firstContextName];
        // Expected input for nationality or destination:
        // {
        //   name: 'Burkina Faso', 'alpha-2': 'BF', 'alpha-3': 'BFA', numeric: 854
        // }
        const nationality = context.parameters['nationality'];
        const destination = context.parameters['destination'];
        const nationalityISO = nationality['alpha-2'];
        const destinationISO = destination['alpha-2'];

        const gotNationality = nationalityISO.length > 0;
        const gotDestination = destinationISO.length > 0;

        if(gotNationality && gotDestination) {
            nationalParam += nationalityISO;
            destParam += destinationISO;
            const query = endpoint + '?' + prefix + '&' + passtype + '&' + nationalParam + '&' + residenceParam + '&' +
                destParam + '&' + postfix;

            return rp.get( query )
                .then( html => {
                    const stripBefore = `<img src="/logos/GF/GFB2C/in_on_no.gif">`;
                    const stripAfter = `CHECK`;
                    let result = $('.normal', html).html();
                    result = result.split(stripBefore)[1];
                    result = result.split(stripAfter)[0];
                    result = result.split('Additional Information')[0];
                    result = '<pre>' + result.toString() + '</pre>';
                    result = $(result).text();
                    agent.add(new Text(result));
                    return Promise.resolve( agent );
                    })
                .catch(function (err) {
                    console.error(err);
                    agent.add(new Text('Sorry, the backend of the service is temporary unavailable :( Will back to you soon.'));
                });

        } else if (gotNationality && !gotDestination) {
            agent.context.set({ name: 'awaitingUserDestination', lifespan: 2});
            agent.add('Let me know which destination country you want to travel?');
        } else if (gotDestination && !gotNationality) {
            agent.context.set({ name: 'awaitingUserNationality', lifespan: 2});
            agent.add('Let me know which country has issued your passport?');
        } else {
            agent.context.set({ name: 'awaitingUserNationality', lifespan: 2});
            agent.add('Let me know which what is your country?');
        }
    }

    function myHandler(agent) {
        // todo: remove this dummy subroutine
        const dummySentence = `This message is from Dialogflow's Cloud Functions!`;
        agent.add(new Text(dummySentence));
        console.log(dummySentence);
    }

    function googleAssistantHandler(agent) {
        // todo: remove this dummy subroutine
        let conv = agent.conv();
        const dummySentence ='Hello from the Actions on Google client library!';
        conv.ask(dummySentence);
        console.log(dummySentence);
        agent.end(conv);
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('helloWorld', myHandler);
    intentMap.set('American name', americanName);
    intentMap.set('American name repeat', americanName);
    intentMap.set('British name', britishName);
    intentMap.set('British name repeat', britishName);
    intentMap.set('Russian name', ruName);
    intentMap.set('Russian name repeat', ruName);
    intentMap.set('German name', deName);
    intentMap.set('German name repeat', deName);
    intentMap.set('Hispanic name', esName);
    intentMap.set('Hispanic name repeat', esName);
    intentMap.set('Burner phone number', imeiHandler);
    intentMap.set('imei', imeiHandler);
    intentMap.set('awaitingUserDestinationCountry', timaticHandler);
    intentMap.set('google', googleAssistantHandler);
    agent.handleRequest(intentMap);
}

function githook(request, response) {
    if (process.env.LOG_LEVEL > 2) {
        console.log('GitHub request headers:\n' + JSON.stringify(req.headers) + '\n');
    }
    function deploy(response){
        const selfDeployScript = process.env.DEPLOY_SCRIPT;
        childProcess.exec(selfDeployScript, function(err, stdout){
            if (err) {
                console.error(err);
                return response.send(500);
            }
            else {
                console.log(stdout)
            }
        });
        response.send(200);
    }

    const githubUsername = process.env.GITHUBBER;
    const sender = request.body.sender;
    const branch = request.body.ref;

    if(branch.indexOf('master') > -1 && sender.login === githubUsername){
        deploy(response);
        console.log('Deploy initiated!\n')
    }
}

server.use('/', logging);
server.use('/static/pic', express.static(__dirname + '/static/pic'));
server.get('/', giveNothing);
server.get('/webhook', giveNothing);
server.get('/githook', giveNothing);
server.post('/webhook', webhook);
server.post('/githook', githook);

server.listen(server.get('port'), function () {
    console.log('Express server started on port', server.get('port'));
});
