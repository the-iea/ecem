from collections import defaultdict
import os
import shutil
import json
from functools import reduce
import csv
from osgeo import ogr, osr
ogr.UseExceptions()
osr.UseExceptions()

import ecem.countries

ESRI_SHP = 'ESRI Shapefile'
GEOJSON = 'GeoJSON'

CLUSTER_CODE = 'Clusters_c'
COUNTRY_CODE = 'country_code'

# Input files
PATH_DATA = os.path.join(os.path.dirname(__file__), '..', 'data')
PATH_CLUSTERNAMES = os.path.join(PATH_DATA, 'ECEM_cluster_names.csv')
PATH_CLUSTERSHP = os.path.join(PATH_DATA, 'cluster_borders', 'Clusters_Borders.shp')

# Output files
PATH_GENERATED = os.path.join(os.path.dirname(__file__), '..', 'generated')
PATH_COUNTRYGEOJSON = os.path.join(PATH_GENERATED, 'countries.geojson')
PATH_COUNTRYGEOJSON = os.path.join(PATH_GENERATED, 'countries.geojson')

# Final output destination
PATH_APP_DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'app', 'data')
PATH_APP_COUNTRYGEOJSON = os.path.join(PATH_APP_DATA, 'countries.geojson')

countries = ecem.countries.get_countries()

def get_clusters_by_country():
  country_clusters = defaultdict(list)
  with open(PATH_CLUSTERNAMES, newline='') as csvfile:
    rows = csv.reader(csvfile)
    next(rows) # skip first line
    for row in rows:
      if row[0] == '': # ignore empty lines at the end
        break
      country_code = row[0]
      cluster_code = row[2]
      country_clusters[country_code].append(cluster_code)
  assert len(country_clusters) == len(countries), 'Mismatch in length between countries in countrynames and cluster_names files!'
  return country_clusters

def create_country_geojson():
  inDriver = ogr.GetDriverByName(ESRI_SHP)
  inDataSource = inDriver.Open(PATH_CLUSTERSHP, 0)
  inLayer = inDataSource.GetLayer()
  
  outGeoJSON = PATH_COUNTRYGEOJSON
  outDriver = ogr.GetDriverByName(GEOJSON)
  
  # Remove output shapefile if it already exists
  if os.path.exists(outGeoJSON):
    outDriver.DeleteDataSource(outGeoJSON)
  
  outFolder = os.path.dirname(outGeoJSON)
  if not os.path.exists(outFolder):
    os.makedirs(outFolder)
  
  # Create the output shapefile
  outDataSource = outDriver.CreateDataSource(outGeoJSON)
  outLayer = outDataSource.CreateLayer("countries", inLayer.GetSpatialRef(), ogr.wkbPolygon, ['COORDINATE_PRECISION=3'])
  
  # Add a country code field
  code_field = ogr.FieldDefn(COUNTRY_CODE, ogr.OFTString)
  outLayer.CreateField(code_field)
  
  # setup reprojection
  outSpatialRef = osr.SpatialReference()
  outSpatialRef.ImportFromProj4('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs')
  coordTrans = osr.CoordinateTransformation(inLayer.GetSpatialRef(), outSpatialRef)
  
  # merge cluster geometries by country
  country_clusters = get_clusters_by_country()
  
  for country_code, cluster_codes in country_clusters.items():
    inLayer.ResetReading()
    country_features = [feature for feature in inLayer if feature.GetField(CLUSTER_CODE) in cluster_codes]
    if not country_features:
      print('No features found for:' + country_code)
      continue
    country_geoms = [feature.GetGeometryRef() for feature in country_features]
    try:
      merged_geom = reduce(lambda l, r: l.Union(r), country_geoms)
    except Exception as e:
      print('ERROR merging clusters for country ' + country_code + ', skipping!! Reason: ' + str(e))
      continue
    
    # reproject to lat/lon
    merged_geom.Transform(coordTrans)

    merged_feature = ogr.Feature(outLayer.GetLayerDefn())
    merged_feature.SetGeometry(merged_geom)
    merged_feature.SetField(COUNTRY_CODE, country_code)
    outLayer.CreateFeature(merged_feature)
    merged_feature.Destroy()
  
  # Close DataSource
  inDataSource.Destroy()
  outDataSource.Destroy()
  
  # minify the JSON file, removing all whitespace
  with open(outGeoJSON, 'r') as fp:
    jsonstr = fp.read()
  with open(outGeoJSON, 'w') as fp:
    json.dump(json.loads(jsonstr), fp, separators=(',', ':'))
    
  # TODO try to apply some polygon simplification

def create_cluster_geojson():
  # TODO filter clusters, reproject, save as minified geojson; similar to above
  pass

def run():
  create_country_geojson()
  
  shutil.copyfile(PATH_COUNTRYGEOJSON, PATH_APP_COUNTRYGEOJSON)
  
