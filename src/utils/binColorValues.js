export const binColorValues = (dataframe, variable, options={}) => {
  const {
    maxbins = 10,
    nice = true,
    step // Add the optional step parameter
  } = options;
  const getArrayValues = (dataframe, variable) => {
    return Object.values(dataframe).map(row => row[variable]);
  };

  const addBinDataFrame = (dataframe, variable, bins, maxbins) => {
    const variableBinName = `${variable}Bin${maxbins}`;
    Object.keys(dataframe).forEach(key => {
      // dataframe[key][variableBinName] = bins[key]['bin']? parseFloat(bins[key]['bin']):null;
      dataframe[key][variableBinName] = bins[key]['bin']?bins[key]['bin']:null;

    });
    return dataframe;
  };

  const formatNumber = (num) => (num === undefined || num === null ? 'null' : num.toString().padStart(3, '0'));

  let array = getArrayValues(dataframe, variable);
  const uniqueValues = [...new Set(array.filter(value => value !== null))].sort((a, b) => a - b);

  let bins = [];
  if (uniqueValues.length <= maxbins) {
    bins = uniqueValues

    array = array.map(element => element - 1);
  } else {

    bins = binData(array,options);

  }
  const binnedValues = array.map((val) => val === null ? null : bins.findIndex((bin) => val < bin));
  const binnedData = binnedValues.map((bin, i) => ({
    bin: bin === null ? 
        null : uniqueValues.length <= maxbins ? 
        `${bins[bin]}` : `${bins[bin - 1] % 1 !== 0 ? bins[bin - 1].toFixed(2) : bins[bin - 1]} - ${bins[bin]% 1 !== 0 ? bins[bin].toFixed(2) : bins[bin]}`,
    // bin: bin === null ? null : uniqueValues.length <= maxbins ? `${bins[bin]}` : bins[bin - 1].toFixed(2),

    value: array[i],
  }));
  return addBinDataFrame(dataframe, variable, binnedData, maxbins);
};

function binData(array, options = {}) {
  const {
    base = 10,
    divide = [5, 2, 1],
    extent = [Math.min(...array.filter(v => v !== null)), Math.max(...array.filter(v => v !== null))],
    maxbins = 10,
    minstep = 1,
    nice = true,
    step // Add the optional step parameter
  } = options;

  const [min, max] = extent;
  const span = max - min;
  let finalStep = step; // Use finalStep to distinguish from the step in options

  // If step is not provided, calculate it
  if (finalStep == null) {
    finalStep = Math.max(minstep, span / maxbins);

    while (span < finalStep) {
      finalStep = finalStep / base;
    }
    if (nice) {
      let power = 0;

      // Find the highest power of base that is less than or equal to step
      while (Math.pow(base, power) < finalStep) {
        power++;
      }
      power--; // Decrement power to get the highest power that is less than or equal to step

      let basePower = Math.pow(base, power);
      let bestValue = Math.max(...divide);
      let enteredIf = true;
      // Find the largest value in divide that when multiplied by basePower is less than step
      for (let value of divide) {
        if (value * basePower > finalStep && value * basePower <= bestValue * basePower) {
          bestValue = value;
          enteredIf = false;
        }
      }
      if (enteredIf) {
        basePower = Math.pow(base, power+1);
        bestValue = 1;
      }
      finalStep = bestValue * basePower;
    }
  }

  let start = Math.floor(min / finalStep) * finalStep;
  let end = Math.floor(max / finalStep) * finalStep + finalStep;
  const bins = [];
  for (let value = start; value <= end; value += finalStep) {
    bins.push(value);
  }
  if (finalStep == null){
    while (bins.length-1 > maxbins) {
      finalStep += finalStep;
      end += finalStep;
      bins.length = 0;
      for (let value = start; value <= end; value += finalStep) {
          bins.push(value);
      }
    }
  }
  bins.push(null);
  return bins;
}




