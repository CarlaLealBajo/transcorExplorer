
export function histplot(dataframe, options = {}) {
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
  const columns = options.vars || [options.hueIn] || [];

  options.palette = options.palette || "deep";
  if (options.palette && typeof options.palette === 'string') {
    // check if palette is any of the predefined Seaborn palettes
    const paletteIndex = Object.keys(seabornPalettes).indexOf(options.palette);
    if (paletteIndex > -1) {
      options.palette = seabornPalettes[options.palette];
    }
  }

  const numberOfCoumns = 3;
  const columnNumber = columns.length < numberOfCoumns ? columns.length : numberOfCoumns;
  const rowNumber = Math.trunc((columns.length -1)/columnNumber) +1 ;

  options.spacing = options.spacing || 20;
  options.width = options.width ? options.width : 1000;
  options.height = options.height ? options.height : options.width / 2.5;
  options.domain = options.domain ? options.domain: [0,dataframe.length];

  // vega-lite does not allow to specify the dimensions of a concatenated view,
  // therefore we need to specify the dimensions on a single plot level
  options.plotWidth =
    options.plotWidth ? options.plotWidth : (options.width - columns.length * options.spacing - 270) / columnNumber;
  options.plotHeight =
    options.plotHeight ? options.plotHeight :(options.height - columns.length * options.spacing - 113) / rowNumber;
  
  options.stats = options.stats ? options.stats: false;
  const matrix = [];
  for (let i = 0; i < columns.length; i++) {

      matrix.push({
        x: columns[i],
        isLeftCol:  i%columnNumber ===0,
        isRightCol: (i+1)%columnNumber ===0,
        varType: defineVarType(dataframe,columns[i]),
        // significanceValue: options.stats ? options["stats"][columns[i]]["All"]["pValue"] : false,
        significance: options.stats ? options["stats"][columns[i]]["All"]["pValue"]<0.05 : false
      });
    
  };


  const plots = 
    matrix.map(combination => {
      return createHistPlot(combination,options);
    })
  ;

  // const plots =  plotHist

  const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: "white",
    data: {
      name: "source",
      values: dataframe
    },
    columns: columnNumber,
    spacing: options.spacing,
    concat: plots
    
  }
  
  return spec;
}

function defineVarType(dataframe, variable){
  const variableValues =Object.values(dataframe).map(row => row[variable]);
  const uniqueValues = [...new Set(variableValues.filter(value => value !== null))].sort((a, b) => a - b);

  return uniqueValues.length>10
  }

function createHistPlot(combination, options) {
  options.filter = options.hueOut ? 
    `datum.${combination.x} !== null && datum.${options.hueOut} !== null` :
    `datum.${combination.x} !== null`;

  return {
    ...(combination.significance && {view: {fill:"#ffe3e3"}}),
    layer: [
      {
        ...(options.plotWidth && { width: options.plotWidth }),
        ...(options.plotHeight && { height: options.plotHeight }),
        
        mark: {
          type: "bar",
          fillOpacity: options.hueIn ? 0.6 : 0.8,
          tooltip: options.showTooltips === false ? false : true
        },
        transform: [
          {
            filter: options.filter
          }
        ],
        title: {
          text: combination.x,
          fontSize: 15
        },
        encoding: {
          x: {
            field: combination.x,
            type: "nominal",
            bin: combination.varType,
            title: false,
            axis: {
              labels: true,
              labelFontSize: 12,
              grid: options.showGrid || false
            }
          },
          y: {
            aggregate: "count",
            axis: {
              labels: true,
              labelFontSize: 12,
              grid: options.showGrid || false,
              title: combination.isLeftCol ? "Counts" : "",
              titleFontSize: 15
            }
          },
          xOffset: { field: options.hueOut || "" },
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
      },
      // ...(options.hueOut && [
      //   {
      //     ...(options.plotWidth && { width: options.plotWidth }),
      //     ...(options.plotHeight && { height: options.plotHeight }),
      //     mark: {
      //       type: "line",
      //       fillOpacity: 0.8,
      //       tooltip: options.showTooltips === false ? false : true
      //     },
      //     transform: [
      //       {
      //         filter: options.filter
      //       },
      //       {
      //         density: combination.x,
      //         groupby: options.hueOut ? [options.hueOut] : undefined
      //       },
      //       {
      //         joinaggregate: [{ op: "max", field: "density", as: "maxDensity" }]
      //       },
      //       {
      //         calculate: "datum.density / datum.maxDensity",
      //         as: "normalizedDensity"
      //       }
      //     ],

      //     encoding: {
      //       x: {
      //         field: "value",
      //         type: "quantitative",
      //         axis: {
      //           labels: true,
      //           labelFontSize: 12,
      //           grid: options.showGrid || false
      //         },
      //         title: false
      //       },
      //       y: {
      //         field: "normalizedDensity",
      //         // field:"density",
      //         type: "quantitative",
      //         axis: {
      //           labels: true,
      //           grid: options.showGrid || false,
      //           title: combination.isRightCol ? "Normalized KDE" : "",
      //           titleFontSize: 15
      //         }        
                    
        
      //       },
      //       color: {
      //         field: options.hueOut,
      //         ...(options.palette && {
      //           scale: Array.isArray(options.palette)
      //             ? { range: options.palette }
      //             : { scheme: options.palette }
      //         }),
              // ...(options.legend && {
              //   legend: {
              //     labelExpr: `${JSON.stringify(options.legend)}[datum.value]`
              //   }
              // }),
      //         type: "nominal"
      //       }
      //     }
      //   }
      // ])
    ],
    resolve: { scale: { y: "independent" } }
  };
}



const seabornPalettes = ({deep: [ "#55A868","#DD8452",  "#C44E52","#4C72B0", "#8172B3",
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
