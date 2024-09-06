# server/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from matplotlib.colors import ListedColormap, LinearSegmentedColormap
from mpl_toolkits.axes_grid1 import make_axes_locatable
import matplotlib as mpl
import warnings
import json

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def create_density_maps(values, dim_x, dim_y, n_pixels, fudge):

    # Get the population density map & normalise
    d_map = fill_density_map(n_pixels, dim_x, dim_y, fudge, dim_x, dim_y)
    norm_dmap = normalise_dmap(d_map)
    return norm_dmap

def create_density_maps_positive(values,dim_x,dim_y, n_pixels, fudge):

    # Keep only the position with positive outcome
    x_pos = dim_x[values == 1]
    y_pos = dim_y[values == 1]
    
    # Get the population density map & normalise
    d_map = fill_density_map(n_pixels, dim_x, dim_y, fudge, dim_x, dim_y)

    norm_dmap = normalise_dmap(d_map)


    # Get the positive density map & normalise
    d_map_positive = fill_density_map(n_pixels, dim_x, dim_y, fudge, x_pos, y_pos)


    norm_d_map_positive = normalise_dmap(d_map_positive)

    # Correct the positive density map according to the population density
    corrected_dmap_norm = create_corrected_density_map(d_map, d_map_positive)

    return norm_dmap, norm_d_map_positive, corrected_dmap_norm

def fill_density_map(n_pixels, dim_x, dim_y, fudge, x, y):
    # Define the limits and the increment in each direction
    limits, delta_x, delta_y, fudge = get_density_map_parameters(dim_x, dim_y, n_pixels, fudge)
    # Define the value of each one f the pixels
    d_map = np.zeros((n_pixels, n_pixels))

    for ii in range(0, n_pixels):
        yi = limits[2] + ii * delta_y + delta_y / 2

        for jj in range(0, n_pixels):
            xi = limits[0] + jj * delta_x + delta_x / 2
            dd = 0
            dist = (x - xi) ** 2 + (y - yi) ** 2

            for kk in range(0, len(x)):
                dd = dd + 1 / (dist[kk] + fudge)
            d_map[ii, jj] = dd
    return d_map

def normalise_dmap(dmap):
    # Normalise values for the colorbar basically
    dmap = dmap - np.min(np.min(dmap))
    norm_dmap = dmap / np.max(np.max(dmap))
    return norm_dmap

def create_corrected_density_map(dmap, dmap_pos):
    # Correct the positive density map with the population density map
    corrected_dmap = dmap_pos / dmap
    corrected_dmap_norm = normalise_dmap(corrected_dmap)
    return corrected_dmap_norm

def get_density_map_parameters( dim_x, dim_y, pixel_size, fudge):
    # Define the maximum and minimum values
    limits = list([0]) * 4
    limits[0] = np.min(dim_x)
    limits[1] = np.max(dim_x)
    limits[2] = np.min(dim_y)
    limits[3] = np.max(dim_y)
    
    # Define the increment in both directions
    delta_x = (limits[1] - limits[0]) / pixel_size
    delta_y = (limits[3] - limits[2]) / pixel_size
    
    # If fudge is not defined by default define it here
    fudge = np.sqrt(delta_x**2 + delta_y**2) if fudge is None else fudge

    return limits, delta_x, delta_y, fudge
    
def spaces_translation(x,y, n_pixels):
    # Translate the image density map to the original MKL space
    x_range = np.linspace(np.min(x), np.max(x), n_pixels)
    y_range = np.linspace(np.min(y), np.max(y), n_pixels)
    meshgrid_x, meshgrid_y = np.meshgrid(x_range, y_range)
    return  meshgrid_x, meshgrid_y


@app.route('/densityMap', methods=['POST'])
def densityMap():

    x = np.array(json.loads(request.form.get('x')))/1000
    y = np.array(json.loads(request.form.get('y')))/1000
    outcomeValues = np.array(json.loads(request.form.get('outcome_values')))
    outcomeValuesUnique = np.unique(outcomeValues[outcomeValues != None])

    outcomeValues[outcomeValues == None] = 0
    
    densityBandwith = int(request.form.get('densityBandwith'))
    fudge = 10**(densityBandwith-20)

    th = request.form.get('trueValue')

    categorical = True if len(outcomeValuesUnique) < 5 else False
    try:
        th = float(request.form.get('trueValue'))
    except ValueError:
        th = 50  # Default threshold value for non-integer inputs or errors

    if categorical:
        try:
            bin_outcome_values = np.where(outcomeValues == th, 1, 0)
        except NameError:
            th = outcomeValuesUnique[0]  # Default threshold for categorical if outcomeValuesUnique is defined
            bin_outcome_values = np.where(outcomeValues == th, 1, 0)
    else:
        bin_outcome_values = np.where(outcomeValues > th, 1, 0)



    n_pixels = 100
    norm_dmap, norm_d_map_positive, corrected_dmap_norm = create_density_maps_positive(bin_outcome_values,
                                                                          x, y, n_pixels, fudge)

    meshgrid_x, meshgrid_y = spaces_translation(x,y, n_pixels)

    d_map_json = []
    print(corrected_dmap_norm)
    for ii in range(0, n_pixels):
        for jj in range(0, n_pixels):
            object = {
                "x": meshgrid_x[ii,jj], 
                "y": meshgrid_y[n_pixels-1-ii,jj], 
                "normDensity": norm_dmap[ii,jj], 
                "normDensityPositive": norm_d_map_positive[ii,jj],
                "correctedDensity": corrected_dmap_norm[ii,jj]
                }
            d_map_json.append(object)
    
    return jsonify(d_map_json)
if __name__ == '__main__':
    app.run(debug=True)
