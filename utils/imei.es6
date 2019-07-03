#!/usr/bin/env node
const fs = require('fs');
const luhn = require('luhn-generator');
const tac_db = 'resources/tacdb_consistent_sorted_clear.csv';

function getRandomLine(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    let lines = data.split('\n');
    return lines[Math.floor(Math.random() * lines.length)].toString();
}

function getSNR() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports.getNew = function () {
    let line = getRandomLine(tac_db);
    line = line.split(',');
    const tac = line[0];
    let vendor = line[1];
    let model = line[2];
    if (model && model.includes(vendor)) {
        vendor = '';
    }
    model = vendor + ' ' + model;
    model = model.trim();
    const snr = getSNR();
    const tac_fac_snr = tac + snr;
    const imei = luhn.generate(tac_fac_snr).toString();
    return [imei, model];
};
