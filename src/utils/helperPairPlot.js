import { getDensityMap } from './helperDensityMap';
export function pairplot(dataframe, options = {}) {
  if (!dataframe) {
    throw Error(
      'No data passed as first argument. Data must be array of objects.'
    );
  }
  if (!Array.isArray(dataframe)) {
    throw Error(
      'No array passed as first argument. Data (first argument) must be array of objects.'
    );
  }
  if (typeof dataframe[0] !== 'object' || Array.isArray(dataframe[0])) {
    throw Error(
      'Array passed as arguments does not contain objects. Data (first argument) must be array of objects.'
    );
  }
  const columns = options.vars || getNumericColumns(dataframe);
  // define defaults
  // if the dataframe contains more than 1000 rows, we automatically switch
  // to binned 2D heatmap / 2D circles in order to improve performance
  if (dataframe.length > 1000 && !options.kind) {
    options.kind = 'hist';
  }
  options.palette = options.palette || "deep";
  if (options.palette && typeof options.palette === 'string') {
    // check if palette is any of the predefined Seaborn palettes
    const paletteIndex = Object.keys(seabornPalettes).indexOf(options.palette);
    if (paletteIndex > -1) {
      options.palette = seabornPalettes[options.palette];
    }
  }
  options.spacing = options.spacing || 5;
  options.width = options.width ? options.width : 1000;
  options.height = options.height ? options.height : options.width / 1.2;
  // vega-lite does not allow to specify the dimensions of a concatenated view,
  // therefore we need to specify the dimensions on a single plot level
  options.plotWidth =
    (options.width - columns.length * options.spacing - 270) / columns.length;
  options.plotHeight =
    (options.height - columns.length * options.spacing - 113) / columns.length;


  if (options.hueIn && !options.hueInVarType) {
    // check if variable is string or numeric
    const containsNaN = dataframe
      .filter(r => r[options.hueIn] !== 'NA')
      .some(r => isNaN(r[options.hueIn]));
    options.hueInVarType = containsNaN ? 'nominal' : 'quantitative';
  }

  if (options.hueOut && !options.hueOutVarType) {
    // check if variable is string or numeric
    const containsNaN = dataframe
      .filter(r => r[options.hueOut] !== 'NA')
      .some(r => isNaN(r[options.hueOut]));
    options.hueOutVarType = containsNaN ? 'nominal' : 'quantitative';
  }
  const matrix = columns.reduce(
    (arr, x, i) => [
      ...arr,
      ...columns.map((y, j) => ({
        x: i > j ? x : y,
        y: i > j ? y : x,
        hue: i > j ? options.hueOut : options.hueIn,
        show: i <= j ? true : options.hueOut ? true : false,
        density: i > j ? options.densityOut : options.densityIn,
        legend: i > j ? options.legendOut : options.legendIn,

      }))
    ],
    []
  );
  const plots =
    matrix.map(combination => {
      if (combination.x === combination.y) {
        return createDensityPlot(combination, options);
      }
      if (!combination.show) {
        return createHistHeatScatterPlot(combination, options)
      }
      if (combination.density) {
        return createDensityHeatMap(dataframe, combination, options);
      }
      return createScatterPlot(combination, options);


    });
  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: "white",
    data: {
      name: "source",
      values: dataframe
    },
    columns: columns.length,
    spacing: options.spacing,
    params: [{name: "pts", select: "point",value: [{ID: options.selectedPatient}]}],
    concat: plots,
    resolve: { scale: { color: "independent" } }
  }

  return spec;
}

function extractNumericValue(str) {
  // Extract numeric part of the string
  const numericPart = str.replace(/[^\d.]/g, ''); // Remove non-numeric characters
  return parseFloat(numericPart); // Convert to a floating-point number
}

function getNumericColumns(dataframe) {
  const set = new Set();
  for (const row of dataframe) {
    for (const key of Object.keys(row)) {
      if (row[key] !== null && row[key] !== undefined && !isNaN(row[key]))
        set.add(key);
    }
  }
  // get unique column names, and escape dots
  const columnNames = [...set].map(c => c.replace(/\./g, "\\."));
  return columnNames;
}

function createDensityHeatMap(dataframe, combination, options) {
  const dataDensity = getDensityMap(dataframe, combination, options)
  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null, fill: "white" },
    mark: "rect",
    data: {
      name: `densityMap ${combination.x} vs ${combination.y}`,
      values: dataDensity
    },
    encoding: {
      x: {
        field: "x",
        type: "ordinal",
        axis: {
          labels: false,
          grid: options.showGrid || false,
          ticks: false
        },
        // title: combination.isBottomCol ? combination.x : ""
        title: combination.x
      },
      y: {
        field: "y",
        type: "ordinal",
        // title: combination.isRowZero ? combination.y : "",
        title: combination.y,
        axis: {
          labels: false,
          grid: options.showGrid || false,
          ticks: false
        }
      },
      ...(combination.hue && {
        color: {
          field: "correctedDensity",
          scale: { scheme: "viridis" },
          type: "quantitative"
        }
      }),

    }
  };
}
function createHistHeatScatterPlot(combination, options) {
  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null, fill: "white" },
    mark: {
      type: 'rect',
      tooltip: options.hideTooltips ? false : true,
      color: 'white'
    }
  };
}
function createScatterPlot(combination, options) {
  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null, fill: "white" },
    mark: {
      type:  "point" ,
      opacity: 0.7,
      tooltip: options.showTooltips === false ? false : true

    },
    encoding: {
      x: {
        field: combination.x,
        type: "quantitative",
        scale: { zero: options.scaleZero ? options.scaleZero : false },
        axis: {
          labels: false,
          grid: options.showGrid || false
        },
        // title: {
        //   text: combination.isBottomCol ? combination.x : ""
        // }
        title: combination.x
      },
      y: {
        field: combination.y,
        type: "quantitative",
        scale: { zero: options.scaleZero ? options.scaleZero : false },
        // title: {
        //   text: combination.isRowZero ? combination.y : ""
        // },
        title: combination.y,
        axis: {
          labels: false,
          grid: options.showGrid || false
        }
      },
      tooltip: options.showTooltips === false ? [] : options.showTooltips.map(field => ({ "field": field })),
      size: {
        condition: {param: "pts", empty: false, value: 300},
        value: 50
      },
      shape: {
        condition: {param: "pts", empty: false, value: "triangle-up"},
        value: "circle"
      },
      opacity:{
        condition: {param: "pts", empty: false, value: 1},
        value: 0.6
      },
      ...(combination.hue && {
        color: {
          field: combination.hue,
          ...(options.palette && {
            scale: Array.isArray(options.palette)
              ? { range: options.palette }
              : { scheme: options.palette }
          }),
          ...(options.domain && {
            scale: {
              range: Array.isArray(options.palette) ? options.palette : undefined,
              scheme: Array.isArray(options.palette) ? undefined : options.palette,
              domain: options.domain
            }
          }),
          ...(combination.legend && {
            legend: {
              labelExpr: `${JSON.stringify(combination.legend)}[datum.value]`
            }
          }),
          type: "nominal"
        }
      }),
      ...(combination.hue &&
        options.markers && { shape: { field: combination.hue, type: "nominal" } })
    }
  };
}

function createHistPlot(combination, options) {
  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null, fill: "white" },
    mark: {
      type: "bar",
      fillOpacity: options.hueIn ? 0.6 : 0.8,
      tooltip: options.showTooltips === false ? false : true

    },
    encoding: {
      x: {
        field: combination.x,
        type: "quantitative",
        bin: true,
        axis: {
          labels: false,
          grid: options.showGrid || false
        },
        title: {
          text: combination.isBottomCol ? combination.x : ""
        }
      },
      y: {
        aggregate: "count",
        title: "Frequency",
        axis: {
          labels: false,
          grid: options.showGrid || false
        },
        title: combination.isRowZero ? combination.y : ""
      },
      ...(options.hueIn && {
        color: {
          field: options.hueIn,
          ...(options.palette && {
            scale: Array.isArray(options.palette)
              ? { range: options.palette }
              : { scheme: options.palette }
          }),
          ...(options.domain && {
            scale: {
              range: Array.isArray(options.palette)
                ? options.palette
                : undefined,
              scheme: Array.isArray(options.palette)
                ? undefined
                : options.palette,
              domain: options.domain
            }
          }),
          type: options.hueInVarType
        }
      })
    }
  };
}
function createDensityPlot(combination, options) {
  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null, fill: "white" },
    mark: {
      type: "line",
      fillOpacity: 0.8,
      tooltip: options.showTooltips === false ? false : true

    },
    transform: [
      {
        filter: `datum.${combination.hue} !== "null"`
      },
      {
        counts: true,
        density: combination.y,
        ...(combination.hue && { groupby: [combination.hue] })
      }
    ],
    encoding: {
      x: {
        field: "value",
        type: "quantitative",
        axis: {
          labels: false,
          grid: options.showGrid || false
        },
        // title: combination.isBottomCol ? combination.x : ""
        title: combination.x
      },
      y: {
        field: "density",
        type: "quantitative",
        axis: {
          labels: false,
          grid: options.showGrid || false
        },
        // title: combination.isRowZero ? combination.y : ""
        title: combination.y
      },
      ...(combination.hue && {
        color: {
          field: combination.hue,
          ...(options.palette && {
            scale: Array.isArray(options.palette)
              ? { range: options.palette }
              : { scheme: options.palette }
          }),
          ...(options.domain && {
            scale: {
              range: Array.isArray(options.palette)
                ? options.palette
                : undefined,
              scheme: Array.isArray(options.palette)
                ? undefined
                : options.palette,
              domain: options.domain
            }

          }),
          ...(combination.legend && {
            legend: {
              labelExpr: `${JSON.stringify(combination.legend)}[datum.value]`
            }
          }),
          type: "nominal"
        }
      })
    }
  };
}

const seabornPalettes = ({
  deep: ["#55A868", "#DD8452", "#C44E52", "#4C72B0", "#8172B3",
    "#937860", "#DA8BC3", "#8C8C8C", "#CCB974", "#64B5CD"],
  deep6: ["#4C72B0", "#55A868", "#C44E52",
    "#8172B3", "#CCB974", "#64B5CD"],
  muted: ["#4878D0", "#EE854A", "#6ACC64", "#D65F5F", "#956CB4",
    "#8C613C", "#DC7EC0", "#797979", "#D5BB67", "#82C6E2"],
  muted6: ["#4878D0", "#6ACC64", "#D65F5F",
    "#956CB4", "#D5BB67", "#82C6E2"],
  pastel: ["#A1C9F4", "#FFB482", "#8DE5A1", "#FF9F9B", "#D0BBFF",
    "#DEBB9B", "#FAB0E4", "#CFCFCF", "#FFFEA3", "#B9F2F0"],
  pastel6: ["#A1C9F4", "#8DE5A1", "#FF9F9B",
    "#D0BBFF", "#FFFEA3", "#B9F2F0"],
  bright: ["#023EFF", "#FF7C00", "#1AC938", "#E8000B", "#8B2BE2",
    "#9F4800", "#F14CC1", "#A3A3A3", "#FFC400", "#00D7FF"],
  bright6: ["#023EFF", "#1AC938", "#E8000B",
    "#8B2BE2", "#FFC400", "#00D7FF"],
  dark: ["#001C7F", "#B1400D", "#12711C", "#8C0800", "#591E71",
    "#592F0D", "#A23582", "#3C3C3C", "#B8850A", "#006374"],
  dark6: ["#001C7F", "#12711C", "#8C0800",
    "#591E71", "#B8850A", "#006374"],
  colorblind: ["#0173B2", "#DE8F05", "#029E73", "#D55E00", "#CC78BC",
    "#CA9161", "#FBAFE4", "#949494", "#ECE133", "#56B4E9"],
  colorblind6: ["#0173B2", "#029E73", "#D55E00",
    "#CC78BC", "#ECE133", "#56B4E9"]
})
