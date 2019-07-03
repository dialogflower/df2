#!/usr/bin/env node
const rp = require('request-promise');
const $ = require('cheerio');
// todo: refactor this spaghetti
const endpoint = 'https://www.timaticweb.com/cgi-bin/tim_website_client.cgi';
const prefix = 'SpecData=1&VISA=';
const passtype = 'PASSTYPES=PASS';
let nationalParam = 'NA=';
let residenceParam = '';
let destParam = 'DE=';
const postfix = 'user=GF&subuser=GFB2C';
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
