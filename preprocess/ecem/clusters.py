from collections import OrderedDict
import os
import shutil
from functools import reduce
import csv
import json
from string import Template
from osgeo import ogr, osr
ogr.UseExceptions()
osr.UseExceptions()

import ecem.countries
from ecem.util import minify_json, PATH_DATA, PATH_GENERATED, PATH_APP_DATA

# OGR driver names
ESRI_SHP = 'ESRI Shapefile'
GEOJSON = 'GeoJSON'

# some constants
POLYGON_SIMPLIFY_TOLERANCE = 0.005
GEOJSON_OPTIONS = ['COORDINATE_PRECISION=3']
SHP_CLUSTER_CODE = 'Clusters_c'
SHP_COLOR_IDX = 'Couleur'
GEOJSON_CLUSTER_CODE = 'cluster_code'
GEOJSON_COUNTRY_CODE = 'country_code'
GEOJSON_COLOR_IDX = 'color_idx'

# Input files
PATH_OBJ_JS_TEMPLATE = os.path.join(PATH_DATA, 'obj.js_template')
PATH_CLUSTERNAMES = os.path.join(PATH_DATA, 'ECEM_cluster_names.csv')
PATH_CLUSTERSHP = os.path.join(PATH_DATA, 'cluster_borders', 'Clusters_Borders.shp')

# Output files
PATH_CLUSTERS_JS = os.path.join(PATH_GENERATED, 'clusters.js')
PATH_COUNTRYGEOJSON = os.path.join(PATH_GENERATED, 'countries.geojson')
PATH_CLUSTERGEOJSON = os.path.join(PATH_GENERATED, 'clusters.geojson')

# Final output destination
PATH_APP_CLUSTERS_JS = os.path.join(PATH_APP_DATA, 'clusters.js')
PATH_APP_COUNTRYGEOJSON = os.path.join(PATH_APP_DATA, 'countries.geojson')
PATH_APP_CLUSTERGEOJSON = os.path.join(PATH_APP_DATA, 'clusters.geojson')

countries = ecem.countries.get_countries()

WGS84 = osr.SpatialReference()
WGS84.ImportFromProj4('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs')

def get_clusters_by_country():
    ''' Returns a dictionary where each key is a country code and each value a list of corresponding cluster codes. '''
    # we use an ordered dict to have consistent ordering when generating files based on this dict
    country_clusters = OrderedDict()
    with open(PATH_CLUSTERNAMES, newline='') as csvfile:
        rows = csv.reader(csvfile)
        next(rows) # skip first line
        for row in rows:
            country_code = row[0]
            cluster_code = row[2]
            if country_code not in country_clusters:
                country_clusters[country_code] = []
            country_clusters[country_code].append(cluster_code)
    assert len(country_clusters) == len(countries), 'Mismatch in length between countries in countrynames and cluster_names files!'
    return country_clusters

def get_clusters():
  ''' Returns a dictionary where each key is a cluster code and each value the corresponding country code. '''
  country_clusters = get_clusters_by_country()
  clusters = OrderedDict()
  for country_code, cluster_codes in country_clusters.items():
    for cluster_code in cluster_codes:
      clusters[cluster_code] = country_code
  return clusters

def create_clusters_js():
    ''' Creates the clusters.js file which maps cluster to country codes. '''
    os.makedirs(os.path.dirname(PATH_CLUSTERS_JS), exist_ok=True)
    
    clusters = get_clusters()
    with open(PATH_OBJ_JS_TEMPLATE) as fp:
        tmpl = fp.read()
        clusters_js = Template(tmpl).substitute(obj=json.dumps(clusters))
    with open(PATH_CLUSTERS_JS, 'w') as fp:
        fp.write(clusters_js)

def create_country_geojson():
  '''
  Creates the countries.geojson file which contains geometries ([Multi]Polygon) for each country
  in longitude/latitude coordinates.

  Each country geometry is derived by merging the corresponding cluster geometries from the Shapefile,
  reprojecting to longitude/latitude, and simplifying the resulting polygons to reduce data volume.
  '''
  # FIXME German clusters can't be merged properly as there are sliver polygons, which means that some inner boundaries remain!
  # problem description and solution: http://gis.stackexchange.com/a/71729
  # tried that in GRASS but got a crash: https://trac.osgeo.org/grass/ticket/3061
  
  inDriver = ogr.GetDriverByName(ESRI_SHP)
  inDataSource = inDriver.Open(PATH_CLUSTERSHP)
  inLayer = inDataSource.GetLayer()
  
  outGeoJSON = PATH_COUNTRYGEOJSON
  outDriver = ogr.GetDriverByName(GEOJSON)
  
  if os.path.exists(outGeoJSON):
    outDriver.DeleteDataSource(outGeoJSON)
  
  os.makedirs(os.path.dirname(outGeoJSON), exist_ok=True)
  
  outDataSource = outDriver.CreateDataSource(outGeoJSON)
  outLayer = outDataSource.CreateLayer("countries", WGS84, ogr.wkbPolygon, GEOJSON_OPTIONS)
  outLayer.CreateField(ogr.FieldDefn(GEOJSON_COUNTRY_CODE, ogr.OFTString))
  
  coordTrans = osr.CoordinateTransformation(inLayer.GetSpatialRef(), WGS84)
  
  # merge cluster geometries by country
  for country_code, cluster_codes in get_clusters_by_country().items():
    inLayer.ResetReading()
    country_features = [feature for feature in inLayer if feature.GetField(SHP_CLUSTER_CODE) in cluster_codes]
    country_geoms = [feature.GetGeometryRef() for feature in country_features]
    # Buffer(0) is done to fix invalid geometry (NO_C3 cluster has self-intersecting polygons)
    # otherwise the Union operation would fail
    country_geoms = [geom.Buffer(0) for geom in country_geoms]
    
    merged_geom = reduce(lambda l, r: l.Union(r), country_geoms)    
    merged_geom.Transform(coordTrans)
    merged_geom = merged_geom.SimplifyPreserveTopology(POLYGON_SIMPLIFY_TOLERANCE)

    merged_feature = ogr.Feature(outLayer.GetLayerDefn())
    merged_feature.SetGeometry(merged_geom)
    merged_feature.SetField(GEOJSON_COUNTRY_CODE, country_code)
    outLayer.CreateFeature(merged_feature)
  
  inDataSource.Destroy()
  outDataSource.Destroy()
  
  minify_json(outGeoJSON)

def create_cluster_geojson():
  '''
  Creates the clusters.geojson file which contains geometries ([Multi]Polygon) for each cluster
  in longitude/latitude coordinates.

  Each cluster geometry is derived by reading the geometry from the Shapefile,
  reprojecting to longitude/latitude, and simplifying the resulting polygons to reduce data volume.

  Definition of clusters:
  http://www.e-highway2050.eu/fileadmin/documents/Results/D2_2_European_cluster_model_of_the_Pan-European_transmission_grid_20072015.pdf
  '''
  inDriver = ogr.GetDriverByName(ESRI_SHP)
  inDataSource = inDriver.Open(PATH_CLUSTERSHP)
  inLayer = inDataSource.GetLayer()
  
  outGeoJSON = PATH_CLUSTERGEOJSON
  outDriver = ogr.GetDriverByName(GEOJSON)
  
  if os.path.exists(outGeoJSON):
    outDriver.DeleteDataSource(outGeoJSON)
  
  os.makedirs(os.path.dirname(outGeoJSON), exist_ok=True)
  
  outDataSource = outDriver.CreateDataSource(outGeoJSON)
  outLayer = outDataSource.CreateLayer("clusters", WGS84, ogr.wkbPolygon, GEOJSON_OPTIONS)
  outLayer.CreateField(ogr.FieldDefn(GEOJSON_CLUSTER_CODE, ogr.OFTString))
  outLayer.CreateField(ogr.FieldDefn(GEOJSON_COUNTRY_CODE, ogr.OFTString))
  outLayer.CreateField(ogr.FieldDefn(GEOJSON_COLOR_IDX, ogr.OFTInteger))
  
  coordTrans = osr.CoordinateTransformation(inLayer.GetSpatialRef(), WGS84)
  
  clusters = get_clusters()
  for feature in inLayer:
    cluster_code = feature.GetField(SHP_CLUSTER_CODE)
    if cluster_code not in clusters:
      continue
    geom = feature.GetGeometryRef()
    geom.Transform(coordTrans)
    geom = geom.SimplifyPreserveTopology(POLYGON_SIMPLIFY_TOLERANCE)
    
    out_feature = ogr.Feature(outLayer.GetLayerDefn())
    out_feature.SetGeometry(geom)
    out_feature.SetField(GEOJSON_CLUSTER_CODE, cluster_code)
    out_feature.SetField(GEOJSON_COUNTRY_CODE, clusters[cluster_code])
    out_feature.SetField(GEOJSON_COLOR_IDX, feature.GetField(SHP_COLOR_IDX))
    outLayer.CreateFeature(out_feature)
  
  inDataSource.Destroy()
  outDataSource.Destroy()
  
  minify_json(outGeoJSON)

def run():
  '''
  Runs all transformations defined in this module and copies the generated files
  to their final location in the web app.
  '''
  create_clusters_js()
  create_country_geojson()
  create_cluster_geojson()
  
  shutil.copyfile(PATH_CLUSTERS_JS, PATH_APP_CLUSTERS_JS)
  shutil.copyfile(PATH_COUNTRYGEOJSON, PATH_APP_COUNTRYGEOJSON)
  shutil.copyfile(PATH_CLUSTERGEOJSON, PATH_APP_CLUSTERGEOJSON)
