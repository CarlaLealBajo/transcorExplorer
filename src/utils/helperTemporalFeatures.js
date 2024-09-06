export function temporalFeaturesPlot(dataframe, options = {}) {
  if (!dataframe) {
    throw Error('No data passed as first argument. Data must be array of objects.');
  }
  if (!Array.isArray(dataframe)) {
    throw Error('No array passed as first argument. Data (first argument) must be array of objects.');
  }
  if (typeof dataframe[0] !== 'object' || Array.isArray(dataframe[0])) {
    throw Error('Array passed as arguments does not contain objects. Data (first argument) must be array of objects.');
  }

  const columns = options.vars || [options.hueIn] || [];

  if (options.palette && typeof options.palette === 'string') {
    const paletteIndex = Object.keys(seabornPalettes).indexOf(options.palette);
    if (paletteIndex > -1) {
      options.palette = seabornPalettes[options.palette];
    }
  }

  const columnNumber = 2;
  const rowNumber = Math.trunc((columns.length - 1) / columnNumber) + 1;

  options.spacing = options.spacing || 5;
  options.width = options.width || 1600;
  options.height = options.height || options.width / 2.5;
  options.domain = options.domain || [0, dataframe.length * 3 / 4];

  options.plotWidth = (options.width - columns.length * options.spacing - 270) / columnNumber;
  options.plotHeight = 200;

  const { dictSameLength, dictRelationship } = groupFeaturesByLength(dataframe, columns);
  const dictDataSet = {};
  Object.keys(dictSameLength).forEach(group => {
    dictDataSet[group] = getValuesTemporalFeatures(dictSameLength[group], dataframe, options);
  });

  const matrix = [];
  for (let i = 0; i < columns.length; i++) {
    for (let j = 0; j < 2; j++) {
      matrix.push({
        x: 'Sample',
        y: columns[i],
        dataset: dictRelationship[columns[i]],
        isLeftCol: j === 0,
        isRightCol: j === 1
      });
    }
  }

  const plots = matrix.map(combination => {
    if (combination.isLeftCol) {
      return createTemporalAllPlot(dataframe, combination, options);
    }
    return createTemporalMeanPlot(dataframe, combination, options);
  });

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: "white",
    datasets: dictDataSet,
    columns: columnNumber,
    spacing: options.spacing,
    concat: plots,
    resolve: { scale: { color: "independent" } }
  };
}

function groupFeaturesByLength(dataframe, availableTemporalFeatures) {
  const dictSameLength = {};
  const dictRelationship = {};
  availableTemporalFeatures.forEach(temporalFeature => {
    const lengthTemporalFeature = dataframe[0][temporalFeature].length;
    const name = `length${lengthTemporalFeature}`;

    if (!dictSameLength[name]) {
      dictSameLength[name] = [];
    }

    dictSameLength[name].push(temporalFeature);
    dictRelationship[temporalFeature] = name;
  });

  return { dictSameLength, dictRelationship };
}

function getValuesTemporalFeatures(standardHeader, dataframe, options) {
  const valuesList = [];
  dataframe.forEach(patient => {
    const id = patient.ID;
    const outcome = patient[options.hueOut];

    for (let sample = 0; sample < patient[standardHeader[0]].length; sample++) {
      const sampleDict = { ID: id, [options.hueOut]: outcome, Sample: sample };
      if (options.showTooltips){
        options.showTooltips.forEach( varTooltip => {
          sampleDict[varTooltip] = patient[varTooltip]
        })
      }
      standardHeader.forEach(lead => {
        sampleDict[lead] = patient[lead][sample];
      });
      valuesList.push(sampleDict);
    }
  });

  return valuesList;
}

function createTemporalMeanPlot(dataframe, combination, options) {
  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null },
    data: { name: combination.dataset },
    layer: [
      {
        mark: {
          type: "line",
          tooltip: options.showTooltips === false ? false : true
        },
        encoding: {
          x: {
            field: combination.x,
            type: "quantitative",
            title: combination.x,
            axis: {
              labels: true,
              grid: true
            }
          },
          y: {
            aggregate: "mean",
            field: combination.y,
            title: combination.isLeftCol ? combination.y : "",
            axis: {
              labels: true,
              grid: true
            }
          },
          ...(options.hueOut && {
            color: {
              field: options.hueOut,
              ...(options.palette && {
                scale: Array.isArray(options.palette)
                  ? { range: options.palette }
                  : { scheme: options.palette }
              }),
              type: "nominal"
            }
          })
        }
      },
      {
        data: {name: combination.dataset},
        mark: {
          type: "errorband",
          extent: "stdev"
        },
        encoding: {
          x: {
            field: combination.x,
            type: "quantitative",
            axis: {
              labels: true,
              grid: true
            },
            title: false
          },
          y: {
            field: combination.y,
            type: "quantitative",
            axis: {
              labels: false,
              grid: true
            },
            title: false
          },
          ...(options.hueOut && {
            color: {
              field: options.hueOut,
              ...(options.palette && {
                scale: Array.isArray(options.palette)
                  ? { range: options.palette }
                  : { scheme: options.palette }
              }),
              ...(options.legend && {
                legend: {
                  labelExpr: `${JSON.stringify(options.legend)}[datum.value]`
                }
              }),
              type: "nominal"
            }
          })
        }
      }
    ]
  };
}

function createTemporalAllPlot(dataframe, combination, options) {

  return {
    ...(options.plotWidth && { width: options.plotWidth }),
    ...(options.plotHeight && { height: options.plotHeight }),
    view: { stroke: null },
    data: { name: combination.dataset },
    layer: [
      {
        params: [{
          name: "IdPatient",
          value: [{ID: options.selectedPatient}],
          select: {type: "point", fields: ["ID"]}
        }],
        mark: {
          type: "line",
          tooltip: options.showTooltips === false ? false : true,
          opacity: options.selectedPatient? 0.4:0.8
        },
        encoding: {
          x: {
            field: combination.x,
            type: "quantitative",
            title: combination.x,
            axis: {
              labels: true,
              grid: true
            }
          },
          y: {
            aggregate: "mean",
            field: combination.y,
            title: combination.isLeftCol ? combination.y : "",
            axis: {
              labels: true,
              grid: true
            }
          },

          color: {
            field: "ID",
            ...(options.selectedPatient ? {
              scale: {
                range: ["grey"]
              },
              legend: null
            } : {
              type: "nominal",
              legend: null
            })
          }
         
        }
      },
      {
        transform: [{filter: {param: "IdPatient"}}],
        mark: {
          type: "line",
          tooltip: options.showTooltips === false ? false : true,
        },
        encoding: {
          x: {
            field: combination.x,
            type: "quantitative",
            axis: {
              labels: true,
              grid: true
            },
            title: false
          },
          y: {
            aggregate: "mean",
            field: combination.y,
            type: "quantitative",
            axis: {
              labels: false,
              grid: true
            },
            title: false
          },
          color: {
            value:"#b71d1c"
          }
        }
      }
    ]
  };
}



//   return {
//     ...(options.plotWidth && { width: options.plotWidth }),
//     ...(options.plotHeight && { height: options.plotHeight }),
//     view: { stroke: null },
//     data: { name: combination.dataset },
//     mark: {
//       type: "line",
//       tooltip: options.showTooltips === false ? false : true
//     },
//     encoding: {
//       x: {
//         field: combination.x,
//         type: "quantitative",
//         title: combination.x,
//         axis: {
//           labels: true,
//           grid: true
//         }
//       },
//       y: {
//         aggregate: "mean",
//         field: combination.y,
//         title: combination.isLeftCol ? combination.y : "",
//         axis: {
//           labels: true,
//           grid: true
//         }
//       },
      // color: {
      //   field: "ID",
      //   type: "nominal",
      //   legend: null
      // },
//       tooltip: options.showTooltips === false ? [] : options.showTooltips.map(field => ({ "field": field }))
      
//     }
//   };
// }

const seabornPalettes = ({deep: ["#4C72B0", "#55A868","#DD8452",  "#C44E52", "#8172B3",
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
                 "#CC78BC", "#ECE133", "#56B4E9"]})
