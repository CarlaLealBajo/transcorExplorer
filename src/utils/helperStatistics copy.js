import { sort, length, filter} from "ramda"
import isNumeric from "isnumeric"
// Ensure you have the jStat library installed
import stats from '@stdlib/stats';
export function computeStats(data, k, selectedOutputVariable, dtypes = {}) {

    // get array of values
    const dataK = data.map(item => item[k]);
    // check varType
    const varType = checkVarType(dataK, k, dtypes)

    let nonNaNData = {};

    // get non-NaN values
    if (varType === 'bool') {
        nonNaNData = dataK.filter(v => v!==null);
        nonNaNData = nonNaNData.map(v => {
            const num = parseFloat(v);
            const diff = num - Math.min(...nonNaNData);
            const returnValue = !!diff;
            return returnValue;
        });

    } else{
        nonNaNData = dataK.filter(v => v!==null);
        nonNaNData = nonNaNData.map(v => {
            const num = parseFloat(v);
            return num});
    }

    // add space for information
    let output = {All: {}};

    // check if variable isNormal
    const zscoreValue = zscore(nonNaNData);
    const isNormal = stats.kstest(zscoreValue, 'normal',0.0,1.0).pValue >= 5e-2;
    output["All"]["N"] = dataK.length;

    if (selectedOutputVariable){
        let dataClusters = data.map(item => item[selectedOutputVariable]);
        const clusters  = [...new Set(dataClusters)].sort((a, b) => a - b);

        // get filters for every cluster
        const filtersCluster = clusters.reduce((acc, c) => {
            acc[c] = dataClusters.map(value => value === c);
            return acc;
        }, {});

        let groups = []; 
        for (const c of clusters){
            output[c] = {};
            // Get elements that coincide with the cluster
            let clusterData = dataK.filter((value,index) => filtersCluster[c][index]);  
            let nonNaNClusterData = {};
            output[c]["N"] = filtersCluster[c].reduce((sum,value)=> sum+value,0);
            if (varType === 'bool'){
                nonNaNClusterData = clusterData.filter(v => v!==null);
                nonNaNClusterData = nonNaNClusterData.map(v => {
                    const num = parseFloat(v);
                    return num});
                    
                const uniqueValues = [...new Set(dataK)].sort((a, b) => a - b);
                if (uniqueValues.length === 2){
                    nonNaNClusterData = nonNaNClusterData.map(v => {
                        const num = parseFloat(v);
                        const diff = num - Math.min(...nonNaNClusterData);
                        const returnValue = !!diff;
                        return returnValue;
                    });
                }
            } else {
                nonNaNClusterData = clusterData.filter(v => v!==null);
                nonNaNClusterData = nonNaNClusterData.map(v => {
                    const num = parseFloat(v);
                    return num});
            };
            if (nonNaNClusterData.length ===0 || clusterData.length ===0){
                output[c]['statistics'] = "---"
                continue
            }

            // Get groups of data
            groups.push(nonNaNClusterData);
            if (varType === 'bool') {
                const sum = nonNaNClusterData.reduce((sum,value)=> sum+value,0);
                const mean = stats.base.mean(nonNaNClusterData.length, nonNaNClusterData, 1);
                output[c]['statistics'] = `${sum} (${(100 * mean).toFixed(2)}%)`;
            } else {
                if (isNormal){
                    const mean = stats.base.mean(nonNaNClusterData.length, nonNaNClusterData, 1);
                    const stdDev = stats.base.stdev(nonNaNClusterData.length,1, nonNaNClusterData,1);
                    output[c]['statistics'] = `${mean.toFixed(2)} ± ${stdDev.toFixed(2)}`;
                } else {
                    const median = stats.base.mediansorted(nonNaNClusterData.length,nonNaNClusterData.sort((a, b) => a - b),1 );
                    const y25 = quantile(nonNaNClusterData,0.25);
                    const y75 = quantile(nonNaNClusterData,0.75);
                    output[c]['statistics'] = `${median.toFixed(2)} (${y25.toFixed(2)} to ${y75.toFixed(2)})`;
                }
            } 
        }

        // if (nonNaNData.length ===0 ){
        //     output.All.pValue = null;
        // }
        if (varType === 'bool'){
            const crossTab = createCrosstab(dataK, filtersCluster);
            const out = stats.chi2test(crossTab);
            output.All.pValue = out.pValue.toFixed(4)
            output.All.pValueDisplay = `χ² Test: ${out.pValue.toFixed(4)}`;
        } else {
            if (groups.length < 2){
                output.All.pValue = "";
            } else {
                if (isNormal){
                    // const outANOVA = stats.anova1(dataK,dataClusters);
                    const filteredData = dataK
                    .map((value, index) => value !== null ? { value, cluster: dataClusters[index] } : null)
                    .filter(item => item !== null);

                    const filtered_dataK = filteredData.map(item => item.value);
                    const filtered_dataClusters = filteredData.map(item => item.cluster);
                    
                    const out = stats.anova1(filtered_dataK,filtered_dataClusters);
                    output.All.pValue = out.pValue.toFixed(4)
                    output.All.pValueDisplay =`ANOVA: ${out.pValue.toFixed(4)}`;

                } else {
                    const out = stats.kruskalTest(dataK,{'groups': dataClusters});
                    output.All.pValue = out.pValue.toFixed(4)
                    output.All.pValueDisplay = `Kruskal-Wallis Test: ${out.pValue.toFixed(4)} `;
                }
            }
        }
    } 




    return(output)
}


function checkVarType (dataK, k, dtypes){
    // let skipDtypes = {};
    let varType = null;
    if (dtypes.hasOwnProperty(k)) {
        varType = dtypes[k];
    }

    let markBreak = false;

    // for (const v of dataK) {
    //     if (skipDtypes.some(dtype => dtype(v))){
    //         markBreak = true;
    //         break;
    //     }
    // }

    if (markBreak){
        varType = null;
    }

    if (typeof dataK === "array") {
        try {
            dataK = dataK.map(v => {
                const num = parseFloat(v);
                return num;
            });
        } catch(e) {
            varType = null;
        }
    }

    const values = dataK.filter(v => v!==null);

    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

    if (areAllValuesIntegers(uniqueValues)){
        if (uniqueValues.length === 2) {
            varType = 'bool';
        } else {
            varType = 'int';
        }
    } else {
        varType = 'float';
    }

    return varType
}

function areAllValuesIntegers(arr) {
    return arr.every(value => Number.isInteger(value));
}

function zscore(data) {
    const mean = stats.base.mean(data.length, data, 1);
    const stdDev = stats.base.stdev(data.length,1, data,1); // Sample standard deviation
    return data.map(value => (value - mean) / stdDev);
}



function quantile (arr,q){
    const sortedArr = sort(diff, filter(isNumeric, arr))
    // if requesting 0 or 1 do the easy thing. 
    if (q === 0) {
        return sortedArr[0];
    }
    else if (q === 1) {
        return sortedArr[length(sortedArr) - 1];
    }
    else if ( q > 1 || q < 0) {
        throw new RangeError("Quantile must be value between 0 and 1")
    }
    const i = q * (sortedArr.length -1)
    var low_index = sortedArr[Math.floor(i)]
    var high_index = sortedArr[Math.floor(i+1)]
    return (low_index + high_index)/2

}

const diff = function(a, b) { return a - b; };

function createCrosstab(values, clusters) {
    let nonNullValues = values.filter(value => value !== null);

    const uniqueValues = [...new Set(nonNullValues)].sort((a, b) => a - b);

    let crossTab = [];
    for (const v of uniqueValues){
        let row = [];
        for (const c of Object.keys(clusters)) {
            let clusterData = values.filter((value,index) => clusters[c][index]);
            let clusterDataNoNaN =   clusterData.filter(value => value !== null);
            if (clusterDataNoNaN.length >0){
                let labelCount = clusterDataNoNaN.reduce((count, value) => count + (value === v ? 1 : 0), 0);
                row.push(labelCount)
            }

        }
        crossTab.push(row)
    }

    return crossTab ;
}