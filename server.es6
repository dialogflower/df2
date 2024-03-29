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
    - https://www.tutorialsteacher.com/nodejs/nodejs-module-exports
    - https://stackoverflow.com/questions/3922994/share-variables-between-files-in-node-js
    - https://dialogflow.com/docs/reference/message-objects
    - https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.712784,-74.005941&radius=50000&type=airport&key=<Your API Key>
    - https://stackoverflow.com/questions/39413560

 */


'use strict';
const dotenv = require('dotenv');
dotenv.config({path: `${__dirname}/.env`});
process.env.DEBUG = '';
const express = require('express');
const rp = require('request-promise');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
const {WebhookClient, Card, Suggestion, Text, Payload} = require('dialogflow-fulfillment');
const server = express();
const emptyPage = 'static/nothing.html';


server.set('port', process.env.PORT || 1488);
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json({type: 'application/json'}));

function currentDate() {
    return '[' + new Date().toUTCString() + '] '
}

function logging(req, res, next) {
    console.log(currentDate() + 'http://' + req.headers.host + req.url, ' - ', req.headers['user-agent'], ' - ', req.method);
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
        //TODO: add contexts
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function ruName(agent) {
        const RuNamer = require('./utils/ru_namer.es6');
        const russianName = RuNamer.getNew();
        if (agent.originalRequest.source === 'telegram') {
            agent.requestSource = agent.TELEGRAM;
            agent.add(new Text(russianName));
            agent.add(new Suggestion('One more Russian name'));
            agent.add(new Suggestion('Exit to menu'));
        } else {
            agent.add(new Text(russianName));
        }
    }

    function americanName(agent) {
        const AmericanNamer = require('./utils/amer_namer.es6');
        const americanName = AmericanNamer.getNew();
        if (agent.originalRequest.source === 'telegram') {
            agent.requestSource = agent.TELEGRAM;
            agent.add(new Text(americanName));
            agent.add(new Suggestion('One more American name'));
            agent.add(new Suggestion('Exit to menu'));
        } else {
            agent.add(new Text(americanName));
        }
    }

    function britishName(agent) {
        const BritishNamer = require('./utils/gb_namer.es6');
        const britishName = BritishNamer.getNew();
        if (agent.originalRequest.source === 'telegram') {
            agent.requestSource = agent.TELEGRAM;
            agent.add(new Text(britishName));
            agent.add(new Suggestion('One more British name'));
            agent.add(new Suggestion('Exit to menu'));
        } else {
            agent.add(new Text(britishName));
        }
        console.log(currentDate() + britishName)
    }

    function deName(agent) {
        const DeNamer = require('./utils/de_namer.es6');
        const germanName = DeNamer.getNew();
        if (agent.originalRequest.source === 'telegram') {
            agent.requestSource = agent.TELEGRAM;
            agent.add(new Text(germanName));
            agent.add(new Suggestion('One more German name'));
            agent.add(new Suggestion('Exit to menu'));
        } else {
            agent.add(new Text(germanName));
        }
    }

    function esName(agent) {
        const EsNamer = require('./utils/es_namer.es6');
        const hispanicName = EsNamer.getNew();
        if (agent.originalRequest.source === 'telegram') {
            agent.requestSource = agent.TELEGRAM;
            agent.add(new Text(hispanicName));
            agent.add(new Suggestion('One more Hispanic name'));
            agent.add(new Suggestion('Exit to menu'));
        } else {
            agent.add(new Text(hispanicName));
        }
    }

    function getBurnerNumber(agent) {
        const onlinesimApiEndpoint = 'https://onlinesim.ru/api/';
        const apiKey = process.env.ONLINESIM_KEY;
        let method = 'getFreePhoneList';
        let query = onlinesimApiEndpoint + method + '?lang=en&apikey=' + apiKey;
        console.info(currentDate() + query);

        return rp.get(query)
            .then(response => {
                const numbers = JSON.parse(response)['numbers'];
                const number = numbers[Math.floor(Math.random() * numbers.length)];
                const burnerNumber = number['full_number'];
                const smallNumber = number['number'];
                const maxDate = number['maxdate'];
                const updatedAt = number['data_humans'];
                const result = burnerNumber + '\n(online since ' + updatedAt + ')\nYou can use this number within next 15 minutes and there are two attempts to fetch the last SMS.';
                if (agent.originalRequest.source === 'telegram') {
                    agent.requestSource = agent.TELEGRAM;
                    let tgPayloadGetSMS = require ('./static/tgPayloadGetSMS.json');
                    tgPayloadGetSMS.text = result;
                    agent.add(new Payload( agent.TELEGRAM, tgPayloadGetSMS ));
                } else {
                    agent.add(new Text(result));
                }
                console.info(currentDate() + burnerNumber);
                agent.context.set({
                    name: 'BurnerNumber',
                    lifespan: 2,
                    parameters: {number: smallNumber, full_number: burnerNumber, maxdate: maxDate}
                });
                return Promise.resolve(agent);
            })
            .catch(function (err) {
                console.error(err);
            });
    }

    function getLastSMS(agent) {
        const onlinesimApiEndpoint = 'https://onlinesim.ru/api/';
        const context = agent.context.contexts.burnernumber['parameters'];
        const number = context.number;
        const fullNumber = context.full_number;
        const method = 'getFreeMessageList';
        const query = onlinesimApiEndpoint + method + '?page=1&phone=' + number + '&lang=en';
        console.info(currentDate() + query);
        return rp.get(query)
            .then(response => {
                response = JSON.parse(response);
                response = response.messages.data[0];
                console.log(response);
                if (agent.originalRequest.source === 'telegram') {
                    agent.requestSource = agent.TELEGRAM;
                    agent.add(new Card({
                            title: response.text,
                            text: 'From: ' + response.in_number + ' (' + response.data_humans + ')\nTo: ' + fullNumber
                        })
                    );
                    agent.add(new Suggestion('Apply for another number'));
                    agent.add(new Suggestion('Exit to menu'))
                } else {
                    agent.add(new Text('```\nFrom: ' + response.in_number + '\nWhen: ' +
                        response.created_at + '\nMessage: ' + response.text + '\n```'));
                    agent.add(new Suggestion('Exit to menu'))
                }

                return Promise.resolve(agent);
            })
            .catch(function (err) {
                console.error(err);
            });
    }

    function imeiHandler(agent) {
        const IMEI = require('./utils/imei.es6');
        const hardwareID = IMEI.getNew();
        const imei = hardwareID[0];
        const model = hardwareID[1];
        const link = 'https://imei.info/' + imei;
        agent.add(new Text(imei + '\n' + model + '\n' + link));
        console.log(currentDate() + imei, model)
    }

    function timaticHandler(agent) {
        // todo: refactor this spaghetti
        function getFirstContextParameters(contexts) {
            const firstContextName = Object.keys(contexts)[0];
            const context = contexts[firstContextName];
            return context.parameters;
        }

        function timaticURL(nationality, destination) {
            // Expected input for nationality or destination:
            // {
            //   name: 'Burkina Faso', 'alpha-2': 'BF', 'alpha-3': 'BFA', numeric: 854
            // }
            const endpoint = 'https://www.timaticweb.com/cgi-bin/tim_website_client.cgi';
            const prefix = 'SpecData=1&VISA=';
            const passtype = 'PASSTYPES=PASS';
            const nationalParam = 'NA=' + nationality['alpha-2'];
            const residenceParam = '';
            const destParam = 'DE=' + destination['alpha-2'];
            const postfix = 'user=GF&subuser=GFB2C';
            return endpoint + '?' + prefix + '&' + passtype + '&' + nationalParam + '&' + residenceParam + '&' +
                destParam + '&' + postfix;
        }

        function responseClean(html) {
            const $ = require('cheerio');
            const stripBefore = `<img src="/logos/GF/GFB2C/in_on_no.gif">`;
            const stripAfter = `CHECK`;
            let result = $('.normal', html).html();
            result = result.split(stripBefore)[1];
            result = result.split(stripAfter)[0];
            result = result.split('Additional Information')[0];
            result = '<pre>' + result.toString() + '</pre>';
            result = $(result).text();
            return result;
        }

        const parameters = getFirstContextParameters(agent.context.contexts);
        const nationality = parameters['nationality'];
        const destination = parameters['destination'];

        if (nationality && destination) {
            const query = timaticURL(nationality, destination);

            return rp.get(query)
                .then(html => {
                    let timaticResponse = responseClean(html);
                    if (agent.originalRequest.source === 'telegram') {
                        agent.requestSource = agent.TELEGRAM;
                        agent.add(new Text(timaticResponse));
                        agent.add(new Suggestion('One more Visa Information'));
                        agent.add(new Suggestion('Exit to menu'));
                    } else {
                        agent.add(new Text(timaticResponse))
                    }
                    timaticResponse = timaticResponse.split('\n')[0];
                    console.log(currentDate() + timaticResponse);
                    return Promise.resolve(agent);
                })
                .catch(function (err) {
                    console.error(err);
                    agent.add(new Text('Sorry, the backend of the service is temporary unavailable :( Will back to you soon.'));
                });

        } else if (nationality && !destination) {
            agent.context.set({name: 'awaitingUserDestination', lifespan: 2});
            agent.add('Let me know which destination country you want to travel?');
        } else if (destination && !nationality) {
            agent.context.set({name: 'awaitingUserNationality', lifespan: 2});
            agent.add('Let me know which country has issued your passport?');
        } else {
            agent.context.set({name: 'awaitingUserNationality', lifespan: 2});
            agent.add('Let me know which what is your country?');
        }
    }

    function telegramExperimentHandler(agent) {
        // todo: remove this dummy subroutine
        if (agent.originalRequest.source === 'telegram') {
            agent.requestSource = agent.TELEGRAM;
            let dummySentence = {"sticker": {
                    "width": 512,
                    "height": 512,
                    "emoji": "👌",
                    "set_name": "Itstimetogo",
                    "thumb": {
                        "file_id": "AAQEABN5NKIwAATQKJryFElt9-IuAAIC",
                        "file_size": 5082,
                        "width": 128,
                        "height": 128
                    },
                    "file_id": "CAADBAADXAADUYzPAYxyzyEYDeBVAg",
                    "file_size": 21542
                }};
            agent.add(new Payload( agent.TELEGRAM, dummySentence ));
        }
        else {
            agent.add(new Text(`This message is from Dialogflow's Cloud Functions!`))
        }
        console.log(`This message is from Dialogflow's Cloud Functions!`)
    }

    function googleAssistantHandler(agent) {
        // todo: remove this dummy subroutine
        let conv = agent.conv();
        const dummySentence = 'Hello from the Actions on Google client library!';
        conv.ask(dummySentence);
        console.log(currentDate() + dummySentence);
        agent.end(conv);
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('helloWorld', telegramExperimentHandler);
    intentMap.set('American name', americanName);
    intentMap.set('British name', britishName);
    intentMap.set('Russian name', ruName);
    intentMap.set('German name', deName);
    intentMap.set('Hispanic name', esName);
    intentMap.set('Burner phone number', getBurnerNumber);
    intentMap.set('Get last SMS', getLastSMS);
    intentMap.set('imei', imeiHandler);
    intentMap.set('awaitingUserDestinationCountry', timaticHandler);
    intentMap.set('google', googleAssistantHandler);
    agent.handleRequest(intentMap);
}

function githook(request, response) {
    if (process.env.LOG_LEVEL > 2) {
        console.log('GitHub request headers:\n' + JSON.stringify(request.headers) + '\n');
    }

    function deploy(response) {
        const selfDeployScript = process.env.DEPLOY_SCRIPT;
        childProcess.exec(selfDeployScript, function (err, stdout) {
            if (err) {
                console.error(err);
                return response.send(500);
            } else {
                console.log(stdout)
            }
        });
        response.sendStatus(200);
    }

    const githubUsername = process.env.GITHUBBER;
    const sender = request.body.sender;
    const branch = request.body.ref;

    if (branch.indexOf('master') > -1 && sender.login === githubUsername) {
        deploy(response);
        console.log(currentDate() + 'Deploy initiated!\n')
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
    console.log(currentDate() + 'Express server started on port', server.get('port'));
    console.log(currentDate() + 'Verbosity level is', process.env.LOG_LEVEL.toString());
    console.log(currentDate() + 'Debug flag is', process.env.DEBUG);
});
