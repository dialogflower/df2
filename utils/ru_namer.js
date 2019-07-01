#!/usr/bin/env node

const fs = require('fs');
const genders = ['female', 'male'];

function getRandomLine(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    let lines = data.split('\n');
    return lines[Math.floor(Math.random() * lines.length)].toString();
}


module.exports.getNew = function () {
    let sex = genders[Math.floor(Math.random() * genders.length)];
    let firstName, patronymic, surname;

    if (sex === 'female') {
        firstName = getRandomLine('resources/femalenames.txt');
        patronymic = getRandomLine('resources/femalepatronymics.txt');
        surname = getRandomLine('resources/femalelastnames.txt');
    } else {
        firstName = getRandomLine('resources/malenames.txt');
        patronymic = getRandomLine('resources/malepatronymics.txt');
        surname = getRandomLine('resources/malelastnames.txt');
    }
    return firstName + ' ' + patronymic + ' ' + surname
};
