export function getDensityMap(dataframe, combination, options) {
    const dividedNum = num => num/1000;
    const x = getArrayValues(dataframe, combination.x);
    const xArray = x.map(dividedNum);
    const y = getArrayValues(dataframe, combination.y);
    const yArray = y.map(dividedNum);
    const outcomeArray = getArrayValues(dataframe, options.hueOut);
    const outcomeUnique = [...new Set(outcomeArray.filter(val => val !== null))];
    let th = parseFloat(options.trueValue);
    if (isNaN(th)) {
      th = 50;
    }
  
    const categorical = outcomeUnique.length < 5;
    let binOutcomeValues;
    if (categorical) {
      binOutcomeValues = outcomeArray.map(val => (val === th ? 1 : 0));
    } else {
      binOutcomeValues = outcomeArray.map(val => (val > th ? 1 : 0));
    }
  
    const nPixels = 100;
    const fudge = 10 ** (options.densityBandwith - 20);
  
    const { normDMap, normDMapPositive, correctedDMapNorm } = createDensityMapsPositive(binOutcomeValues, xArray, yArray, nPixels, fudge);
    const { meshgridX, meshgridY } = spacesTranslation(xArray, yArray, nPixels);
    const dMapJson = [];
  
    for (let ii = 0; ii < nPixels; ii++) {
      for (let jj = 0; jj < nPixels; jj++) {
        const object = {
            x: meshgridX[ii][jj],
            y: meshgridY[nPixels - 1 - ii][jj],
            normDensity: normDMap[ii][jj],
            normDensityPositive: normDMapPositive[ii][jj],
            correctedDensity: correctedDMapNorm[ii][jj],
        };
        dMapJson.push(object);
      }
    }
    return dMapJson;
}

function createDensityMapsPositive(values, dimX, dimY, nPixels, fudge){
    const xPos = dimX.filter((_, idx) => values[idx] === 1);
    const yPos = dimY.filter((_, idx) => values[idx] === 1);
  
    const dMap = fillDensityMap(nPixels, dimX, dimY, fudge, dimX, dimY);
    const normDMap = normaliseDMap(dMap);
  
    const dMapPositive = fillDensityMap(nPixels, dimX, dimY, fudge, xPos, yPos);
    const normDMapPositive = normaliseDMap(dMapPositive);
  
    const correctedDMapNorm = createCorrectedDensityMap(dMap, dMapPositive);
  
    return { normDMap, normDMapPositive, correctedDMapNorm };
  };
  
  function fillDensityMap(nPixels, dimX, dimY, fudge, x, y) {
    const [limits, deltaX, deltaY] = getDensityMapParameters(dimX, dimY, nPixels, fudge);
  
    // Define the value of each one of the pixels
    let dMap = Array.from({ length: nPixels }, () => Array(nPixels).fill(0));
  
    for (let ii = 0; ii < nPixels; ii++) {
        let yi = limits[2] + ii * deltaY + deltaY / 2;
  
        for (let jj = 0; jj < nPixels; jj++) {
            let xi = limits[0] + jj * deltaX + deltaX / 2;
            let dd = 0;
            let dist = x.map((x0, kk) => Math.pow(x[kk] - xi, 2) + Math.pow(y[kk] - yi, 2));
  
            for (let kk = 0; kk < x.length; kk++) {
                dd += 1 / (dist[kk] + fudge);
            }
            dMap[ii][jj] = dd;
        }
    }
    return dMap;
  }
  
  function normaliseDMap(dMap){
    const minVal = Math.min(...dMap.flat());
    const maxVal = Math.max(...dMap.flat());
    return dMap.map(row => row.map(val => (val - minVal) / (maxVal - minVal)));
  };
  
  function createCorrectedDensityMap(dMap, dMapPos){
    const correctedDMap = dMapPos.map((row, i) => row.map((val, j) => val / dMap[i][j]));
    return normaliseDMap(correctedDMap);
  };
  
  function getDensityMapParameters(dimX, dimY, pixelSize, fudge){
    const limits = [Math.min(...dimX), Math.max(...dimX), Math.min(...dimY), Math.max(...dimY)];
    const deltaX = (limits[1] - limits[0]) / pixelSize;
    const deltaY = (limits[3] - limits[2]) / pixelSize;
    return [limits, deltaX, deltaY, fudge];
  };
  
  function spacesTranslation(x, y, nPixels) {
    function linspace(start, end, num) {
        const step = (end - start) / (num - 1);
        return Array.from({ length: num }, (_, i) => start + (step * i));
    }
  
    const xRange = linspace(Math.min(...x), Math.max(...x), nPixels);
    const yRange = linspace(Math.min(...y), Math.max(...y), nPixels);
  
    const meshgridX = [];
    const meshgridY = [];
  
    for (let i = 0; i < nPixels; i++) {
        const rowX = [];
        const rowY = [];
        for (let j = 0; j < nPixels; j++) {
            rowX.push(xRange[j]);
            rowY.push(yRange[i]);
        }
        meshgridX.push(rowX);
        meshgridY.push(rowY);
    }
  
    return { meshgridX, meshgridY };
  }
  function getArrayValues(dataframe, variable){
    const variableValues = [];
  
    // Loop through each key in the JSON object
    for (const key in dataframe) {
        if (dataframe.hasOwnProperty(key)) {
            // Push the value of variable0 to the array
  
            variableValues.push(dataframe[key][variable]);
        }
    }
    return variableValues
  }