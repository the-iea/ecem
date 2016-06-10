from collections import defaultdict
import os
import shutil
from functools import reduce
import csv
from osgeo import ogr, osr
ogr.UseExceptions()
osr.UseExceptions()

import ecem.countries
from ecem.util import minify_json

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
PATH_DATA = os.path.join(os.path.dirname(__file__), '..', 'data')
PATH_CLUSTERNAMES = os.path.join(PATH_DATA, 'ECEM_cluster_names.csv')
PATH_CLUSTERSHP = os.path.join(PATH_DATA, 'cluster_borders', 'Clusters_Borders.shp')

# Output files
PATH_GENERATED = os.path.join(os.path.dirname(__file__), '..', 'generated')
PATH_COUNTRYGEOJSON = os.path.join(PATH_GENERATED, 'countries.geojson')
PATH_CLUSTERGEOJSON = os.path.join(PATH_GENERATED, 'clusters.geojson')

# Final output destination
PATH_APP_DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'app', 'data')
PATH_APP_COUNTRYGEOJSON = os.path.join(PATH_APP_DATA, 'countries.geojson')
PATH_APP_CLUSTERGEOJSON = os.path.join(PATH_APP_DATA, 'clusters.geojson')

countries = ecem.countries.get_countries()

WGS84 = osr.SpatialReference()
WGS84.ImportFromProj4('+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs')

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

def get_clusters():
  country_clusters = get_clusters_by_country()
  clusters = {}
  for country_code, cluster_codes in country_clusters.items():
    for cluster_code in cluster_codes:
      clusters[cluster_code] = country_code
  return clusters

def create_country_geojson():
  # FIXME German clusters can't be merged properly as there are sliver polygons, which means that some inner boundaries remain!
  # problem description and solution: http://gis.stackexchange.com/a/71729
  # -> how to do that in Python??
  
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
  create_country_geojson()
  create_cluster_geojson()
  
  shutil.copyfile(PATH_COUNTRYGEOJSON, PATH_APP_COUNTRYGEOJSON)
  shutil.copyfile(PATH_CLUSTERGEOJSON, PATH_APP_CLUSTERGEOJSON)
