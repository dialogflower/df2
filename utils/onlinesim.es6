#!/usr/bin/env node
const rp = require('request-promise');
const dotenv = require('dotenv');
dotenv.config({path: `${__dirname}/../.env`});
const onlinesimApiEndpoint = 'https://onlinesim.ru/api/';
const apiKey = process.env.ONLINESIM_KEY;


// https://onlinesim.ru/api/getServiceList.php?apikey=bd5331052d78664fa1ae78fdf287cec8
// https://onlinesim.ru/api/getFreeMessageList?page=1&phone=9291017719&lang=en

function currentDate() {
    return '[' + new Date().toUTCString() + '] '
}

function getBalance() {
    let method = 'getBalance.php';
    query(method);
}

function getNumber() {
    let method = 'getNum';
    query(method);
}

function getSMS() {
    let method = 'getState';
    query(method);
}

function getCallNumberList() {
    let method = 'getCallNumberList';
    query(method);
}

function getFreeCountryList() {
    const method = 'getFreeCountryList';
    const query = onlinesimApiEndpoint + method + '?lang=en';
    return rp.get(query)
        .then(response => {
            let countries = JSON.parse(response)['countries'];
            console.log(countries)
        })
        .catch(function (err) {
            console.error(err)
        });
}

function getFreePhoneList() {
    const method = 'getFreePhoneList';
    const query = onlinesimApiEndpoint + method + '?apikey=' + apiKey;
    return rp.get(query)
        .then(response => {
            let Number = JSON.parse(response)['numbers'][0];
            let shortNumber = Number['number'];
            let fullNumber = Number['full_number'];
            console.log(Number)
        })
        .catch(function (err) {
            console.error(err);
        });
}

function getFreeMessageList(number) {
    const method = 'getFreeMessageList'
    const query = onlinesimApiEndpoint + method + '?page=1&phone=' + number + '&lang=en';
    return rp.get(query)
        .then( response => {
            response = JSON.parse(response);
            response = response.messages.data[0];
            console.log(response)
        })
}

getFreeCountryList();
getFreePhoneList();
getFreeMessageList(9291017719)


