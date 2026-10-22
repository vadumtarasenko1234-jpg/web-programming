const noiseLevels = [
    42, 55, 61, 78, 83, 67, 49, 72, 91, 58, 64, 76,
    53, 47, 88, 69, 74, 82, 95, 51, 71, -1, 85, 63,
    79, 39, 141, 86
];
const warningLevel = 70;
const criticalLevel = 85;
const minValidLevel = 30;
const maxValidLevel = 130;


const statusLabel = value => `${value} dB`;

const isAbove = (value, threshold) => value > threshold;


function findFirstCritical(data, minValid, maxValid, critLevel) {
    for (let i = 0; i < data.length; i++) {
        const level = data[i];
        if (!isValidLevel(level, minValid, maxValid)) continue;
        if (level > critLevel) {
            return { value: level, pos: i + 1 };
        }
    }
    return null;
}



const countByCategory = function(data, minValid, maxValid, warnLevel, critLevel, callback) {
    let chill = 0, warn = 0, crit = 0;
    for (const level of data) {
        if (!callback(level, minValid, maxValid)) continue;
        if (level <= warnLevel)                          chill++;
        else if (level > warnLevel && level <= critLevel) warn++;
        else if (level > critLevel)                       crit++;
    }
    return { chill, warn, crit };
};



function isValidLevel(level, min, max) {
    return Number.isFinite(level) && level >= min && level <= max;
}

function calculateAverage(data, minValid, maxValid) {
    let sum = 0, count = 0;
    for (const level of data) {
        if (!isValidLevel(level, minValid, maxValid)) continue;
        sum += level;
        count++;
    }
    return count === 0 ? null : sum / count;
}

function findMinimum(data, minValid, maxValid) {
    let min = null;
    for (const level of data) {
        if (!isValidLevel(level, minValid, maxValid)) continue;
        if (min === null || level < min) min = level;
    }
    return min;
}

function findMaximum(data, minValid, maxValid) {
    let max = null;
    for (const level of data) {
        if (!isValidLevel(level, minValid, maxValid)) continue;
        if (max === null || level > max) max = level;
    }
    return max;
}

function findRecovery(data, minValid, maxValid, warnLevel, firstCritPos) {
    if (firstCritPos === null) return null;

    let i = firstCritPos; 
    let safeCount = 0;

    while (i < data.length) {
        const level = data[i];
        if (isValidLevel(level, minValid, maxValid) && level <= warnLevel) {
            safeCount++;
            if (safeCount === 3) return i + 1; 
        } else {
            safeCount = 0;
        }
        i++;
    }
    return null;
}


function findFirstValid(data, minValid, maxValid) {
    if (data.length === 0) return null;
    let i = 0;
    do {
        if (isValidLevel(data[i], minValid, maxValid)) return { value: data[i], pos: i + 1 };
        i++;
    } while (i < data.length);
    return null;
}



let checkedValues = 0;
let properValues = 0;
let skippedValues = 0;
let sumOfProper = 0;

let lowestValue = Infinity;
let highsetValue = 0;

const invalidEntries = [];

for (const i of noiseLevels) {
    checkedValues++;
    if (!isValidLevel(i, minValidLevel, maxValidLevel)) {
        skippedValues++;
        invalidEntries.push({ pos: checkedValues, value: i });
        continue;
    }
    sumOfProper += i;
    properValues++;

    if (i > highsetValue) highsetValue = i;
    if (i < lowestValue)  lowestValue  = i;
}


const categories  = countByCategory(noiseLevels, minValidLevel, maxValidLevel, warningLevel, criticalLevel, isValidLevel);
const average     = calculateAverage(noiseLevels, minValidLevel, maxValidLevel);
const firstCrit   = findFirstCritical(noiseLevels, minValidLevel, maxValidLevel, criticalLevel);
const recovery    = findRecovery(noiseLevels, minValidLevel, maxValidLevel, warningLevel, firstCrit ? firstCrit.pos : null);
const firstValid  = findFirstValid(noiseLevels, minValidLevel, maxValidLevel);



console.log("Акустична варта -- звіт моніторингу");
console.log(`Пороги: попередження > ${warningLevel} dB; критичний рівень > ${criticalLevel} dB`);
console.log(`Усього вимірювань: ${checkedValues}`);
console.log(`Коректних: ${properValues}`);
console.log(`Некоректних: ${skippedValues}`);
console.log(`Без перевищення: ${categories.chill}`);
console.log(`Попередження: ${categories.warn}`);
console.log(`Критичні: ${categories.crit}`);
console.log(`Середній рівень: ${average !== null ? average.toFixed(2) : "н/д"} dB`);
console.log(`Мінімальний рівень: ${findMinimum(noiseLevels, minValidLevel, maxValidLevel)} dB`);
console.log(`Максимальний рівень: ${findMaximum(noiseLevels, minValidLevel, maxValidLevel)} dB`);
console.log(`Перше критичне вимірювання: ${firstCrit ? `${firstCrit.value} dB, позиція ${firstCrit.pos}` : "не знайдено"}`);
console.log(`Відновлення -- три безпечні вимірювання поспіль: ${recovery ? `позиція ${recovery}` : "не знайдено"}`);
console.log(`Некоректні дані: ${invalidEntries.map(e => `позиція ${e.pos} (${e.value} dB)`).join(", ")}`);
console.log(`Поріг ${warningLevel} dB перевищено у ${categories.warn + categories.crit} вимірюваннях.`);
console.log(`Висновок: зафіксовано ${categories.crit} критичні вимірювання; після першого з них стійкого відновлення ${recovery ? `виявлено на позиції ${recovery}` : "не виявлено"}.`);