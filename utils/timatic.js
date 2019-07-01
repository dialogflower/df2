#!/usr/bin/env node
const rp = require('request-promise');
const $ = require('cheerio');
const endpoint = 'https://www.timaticweb.com/cgi-bin/tim_website_client.cgi';
const prefix = 'SpecData=1&VISA=';
const passtype = 'PASSTYPES=PASS';
let nationality = 'NA=';
let residence = '';
let desitination = 'DE=';
const postfix = 'user=GF&subuser=GFB2C';

const countries = require('iso-country-codes').byAlpha2;
const keys = Object.keys(countries);

function pickRandomCountry() {
    const randIndex = Math.floor(Math.random() * keys.length);
    const randKey = keys[randIndex];
    return countries[randKey]
}

const randomCountryOne = pickRandomCountry();
const randomCountryTwo = pickRandomCountry();


nationality += randomCountryOne.alpha2;
desitination += randomCountryTwo.alpha2;

const itinerary = `Let's find visa requirements for a national of ` + randomCountryOne.name + ` travelling to ` + randomCountryTwo.name;
const query = endpoint + '?' + prefix + '&' + passtype + '&' + nationality + '&' + residence + '&' + desitination + '&' + postfix;
// console.log(query);
console.log(itinerary + '\n=================================================================================\n');
let advice;

rp(query)
    .then(function (html) {
        // success!
        const stripBefore = `<img src="/logos/GF/GFB2C/in_on_no.gif">`;
        const stripAfter = `CHECK`;
        let result = $('.normal', html).html();
        result = result.split(stripBefore)[1];
        result = result.split(stripAfter)[0];
        result = '<pre>' + result.toString() + '</pre>';
        result = $(result).text();
        console.log(result);
        advice = result
    })
    .catch(function (err) {
        // handle error
        console.log(err);
        advice = 'No information found!'
    });


module.exports.random = function () {
    return itinerary + '\n' + advice
};
