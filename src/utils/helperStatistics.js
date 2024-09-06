
// Ensure you have the jStat library installed
import { jStat } from 'jstat';
export function computeStats(data, selectedInputVariable, selectedOutputVariable) {
    const results = {};

    if (selectedOutputVariable) {
        // Step 1: Group the data by distinct values of selectedOutputVariable
        const groupedData = groupDataByKey(data, selectedOutputVariable);

        // Initialize objects to store means and standard deviations
        const means = {};
        const stdDevs = {};
        const values = {};

        // Step 2: Calculate mean and standard deviation for each group
        Object.keys(groupedData).forEach(key => {
            values[key] = groupedData[key].map(item => item[selectedInputVariable]);
            const sum = values[key].reduce((acc, currentValue) => acc + currentValue, 0);
            const mean = sum / values[key].length;
            means[key] = mean;

            const variance = values[key].reduce((acc, currentValue) => acc + Math.pow(currentValue - mean, 2), 0) / values[key].length;
            const stdDev = Math.sqrt(variance);
            stdDevs[key] = stdDev;
        });

        // Step 3: Calculate p-value using one-way ANOVA
        const groups = Object.keys(values).map(key => values[key]);
        const anovaResult = oneWayANOVA(groups);

        // Step 4: Return the results object
        results.means = means;
        results.stdDevs = stdDevs;
        results.pValue = anovaResult.pValue;

        // Calculate overall mean and standard deviation
        const overallValues = data.map(item => item[selectedInputVariable]);
        const overallSum = overallValues.reduce((acc, currentValue) => acc + currentValue, 0);
        const overallMean = overallSum / overallValues.length;

        const overallVariance = overallValues.reduce((acc, currentValue) => acc + Math.pow(currentValue - overallMean, 2), 0) / overallValues.length;
        const overallStdDev = Math.sqrt(overallVariance);

        results.mean = overallMean;
        results.stdDev = overallStdDev;
    } else {
        // Calculate overall mean and standard deviation
        const overallValues = data.map(item => item[selectedInputVariable]);
        const overallSum = overallValues.reduce((acc, currentValue) => acc + currentValue, 0);
        const overallMean = overallSum / overallValues.length;

        const overallVariance = overallValues.reduce((acc, currentValue) => acc + Math.pow(currentValue - overallMean, 2), 0) / overallValues.length;
        const overallStdDev = Math.sqrt(overallVariance);

        results.mean = overallMean;
        results.stdDev = overallStdDev;
    }

    return results;
}

function groupDataByKey(data, key) {
    return data.reduce((acc, obj) => {
        const groupKey = obj[key];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(obj);
        return acc;
    }, {});
}

// Custom function to perform one-way ANOVA
function oneWayANOVA(groups) {
    const numGroups = groups.length;
    const numTotal = groups.reduce((acc, group) => acc + group.length, 0);
    const grandMean = groups.flat().reduce((acc, value) => acc + value, 0) / numTotal;

    // Between-group variability (SSB)
    const ssb = groups.reduce((acc, group) => {
        const groupMean = group.reduce((acc, value) => acc + value, 0) / group.length;
        return acc + group.length * Math.pow(groupMean - grandMean, 2);
    }, 0);

    // Within-group variability (SSW)
    const ssw = groups.reduce((acc, group) => {
        const groupMean = group.reduce((acc, value) => acc + value, 0) / group.length;
        return acc + group.reduce((acc, value) => acc + Math.pow(value - groupMean, 2), 0);
    }, 0);

    const dfBetween = numGroups - 1;
    const dfWithin = numTotal - numGroups;
    const msBetween = ssb / dfBetween;
    const msWithin = ssw / dfWithin;
    const fStatistic = msBetween / msWithin;

    // Compute p-value using the F-distribution
    const pValue = 1 - jStat.centralF.cdf(fStatistic, dfBetween, dfWithin);

    return { fStatistic, pValue };
}




