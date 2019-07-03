#!/usr/bin/env node
//    Number,Gender,NameSet,Title,GivenName,MiddleInitial,Surname,Country,CountryFull,
//    StreetAddress,City,State,StateFull,ZipCode,
//    EmailAddress,Username,TelephoneNumber,
//    TelephoneCountryCode,
//    Birthday,Age,TropicalZodiac,NationalID,Occupation,Company

const names = 'resources/hispanic-names.csv';
const fs = require('fs');

function getRandomLine(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    let lines = data.split('\n');
    return lines[Math.floor(Math.random() * lines.length)].toString();
}

function stripQuotes(line) {
    return line.replace(/['"]+/g, '')
}

module.exports.getNew = function () {
    let line = getRandomLine(names);
    line = line.split(',');

    const title = line[3], givenName = line[4], middleInitial = line[5], surname = line[6], country = line[8],
        streetAddress = line[9], city = line[10], state = line[11], zipCode = line[13],
        username = line[15].toLowerCase(), telephoneCountryCode = line[17],
        telephoneNumber = '+' + telephoneCountryCode + ' (0) ' + stripQuotes(line[16].substring(2));

    let response = '';
    response += title + ' ' + givenName + ' ' + middleInitial + ' ' + surname + '\n';
    response += stripQuotes(streetAddress) + '\n';
    response += stripQuotes(city) + ', ' + stripQuotes(state) + ' ' + stripQuotes(zipCode) + '\n';
    response += stripQuotes(country) + '\n';
    response += telephoneNumber + '\n';
    response += username;
    return response;
};
