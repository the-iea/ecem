import os.path
import shutil
import csv
import json
from ecem.util import load_json, save_covjson, PATH_DATA, PATH_GENERATED, PATH_APP_DATA
from ecem.countries import get_countries
from ecem.clusters import get_clusters

# Input files
PATH_TIMESERIES = os.path.join(PATH_DATA, 'timeseries')
PATH_TIMESERIES_COUNTRY_COVJSON_TEMPLATE = os.path.join(PATH_TIMESERIES, 'timeseries_country.covjson_template')
PATH_TIMESERIES_CLUSTER_COVJSON_TEMPLATE = os.path.join(PATH_TIMESERIES, 'timeseries_cluster.covjson_template')
PATH_ERA_Tmean_countries_sample_CSV = os.path.join(PATH_TIMESERIES, 'ERA_Tmean_countries_sample.csv')
PATH_ERA_Tmean_cluster_sample_CSV = os.path.join(PATH_TIMESERIES, 'ERA_Tmean_cluster_sample.csv')

# Output files
PATH_ERA_Tmean_countries_sample_COVJSON = os.path.join(PATH_GENERATED, 'ERA_Tmean_countries_sample.covjson')
PATH_ERA_Tmean_cluster_sample_COVJSON = os.path.join(PATH_GENERATED, 'ERA_Tmean_cluster_sample.covjson')

# Final output destination
PATH_APP_ERA_Tmean_countries_sample_COVJSON = os.path.join(PATH_APP_DATA, 'ERA_Tmean_countries_sample.covjson')
PATH_APP_ERA_Tmean_cluster_sample_COVJSON = os.path.join(PATH_APP_DATA, 'ERA_Tmean_cluster_sample.covjson')

countries = get_countries()
clusters = get_clusters()

def create_timeseries_covjson(template_path, csv_path, out_path, id_axis):
    timeseries = load_json(template_path)
  
    with open(csv_path, newline='') as csvfile:
        rows = csv.reader(csvfile)
        id_codes = next(rows)[2:]
        
        # fill 'country' domain axis
        timeseries['domain']['axes'][id_axis]['values'] = id_codes
        identifiers = timeseries['domain']['referencing'][0]['system']['identifiers']
        for code in id_codes:
            if id_axis == 'cluster':
                identifiers[code] = {   
                    'label': { 'en': 'Cluster ' + code}
                }
            elif id_axis == 'country':
                identifiers[code] = {
                    'label': countries[code].name,
                }
            else:
                raise Error('Unsupported')
    
        # fill range and 't' domain axis
        tvals = timeseries['domain']['axes']['t']['values']
        range = timeseries['ranges']['TEMP']
        rangevals = range['values']
        n = 0
        for row in rows:
            n += 1
            year, month = row[:2]
            tvals.append(year + '-' + month.zfill(2))
            rangevals.extend(map(float, row[2:]))
        range['shape'] = [n, len(id_codes)]
  
    save_covjson(timeseries, out_path)
  
def run():
    create_timeseries_covjson(PATH_TIMESERIES_COUNTRY_COVJSON_TEMPLATE, 
                              PATH_ERA_Tmean_countries_sample_CSV, 
                              PATH_ERA_Tmean_countries_sample_COVJSON,
                              'country')
  
    create_timeseries_covjson(PATH_TIMESERIES_CLUSTER_COVJSON_TEMPLATE, 
                              PATH_ERA_Tmean_cluster_sample_CSV, 
                              PATH_ERA_Tmean_cluster_sample_COVJSON,
                              'cluster')
  
    shutil.copyfile(PATH_ERA_Tmean_countries_sample_COVJSON, PATH_APP_ERA_Tmean_countries_sample_COVJSON)
    shutil.copyfile(PATH_ERA_Tmean_cluster_sample_COVJSON, PATH_APP_ERA_Tmean_cluster_sample_COVJSON)
  