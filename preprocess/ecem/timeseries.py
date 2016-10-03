import os.path
import shutil
import csv
import json
from ecem.util import load_json, save_covjson, PATH_DATA, PATH_GENERATED, PATH_APP_DATA
from ecem.countries import get_countries
from ecem.clusters import get_clusters

# Input files
PATH_TIMESERIES = os.path.join(PATH_DATA, 'timeseries')
PATH_TIMESERIES_COUNTRY_MONTHLY_COVJSON_TEMPLATE = os.path.join(PATH_TIMESERIES, 'timeseries_country_monthly.covjson_template')
PATH_TIMESERIES_COUNTRY_YEARLY_PERCENTILES_COVJSON_TEMPLATE = os.path.join(PATH_TIMESERIES, 'timeseries_country_yearly_percentiles.covjson_template')
PATH_TIMESERIES_CLUSTER_MONTHLY_COVJSON_TEMPLATE = os.path.join(PATH_TIMESERIES, 'timeseries_cluster_monthly.covjson_template')

PATH_ERA_Tmean_countries_sample_CSV = os.path.join(PATH_TIMESERIES, 'ERA_Tmean_countries_sample.csv')
PATH_ERA_Tmean_cluster_sample_CSV = os.path.join(PATH_TIMESERIES, 'ERA_Tmean_cluster_sample.csv')

PATH_GCM_Tmean_country_sample_CSV = os.path.join(PATH_TIMESERIES, 'GCM_Tmean_countries_sample_ens_mean.csv')
PATH_GCM_Tmean05_country_sample_CSV = os.path.join(PATH_TIMESERIES, 'GCM_Tmean_countries_sample_ens_perc05.csv')
PATH_GCM_Tmean95_country_sample_CSV = os.path.join(PATH_TIMESERIES, 'GCM_Tmean_countries_sample_ens_perc95.csv')

# Output files
PATH_ERA_country_COVJSON = os.path.join(PATH_GENERATED, 'ERA_country.covjson')
PATH_ERA_cluster_COVJSON = os.path.join(PATH_GENERATED, 'ERA_cluster.covjson')
PATH_GCM_country_COVJSON = os.path.join(PATH_GENERATED, 'GCM_country.covjson')

# Final output destination
PATH_APP_ERA_country_COVJSON = os.path.join(PATH_APP_DATA, 'ERA_country.covjson')
PATH_APP_ERA_cluster_COVJSON = os.path.join(PATH_APP_DATA, 'ERA_cluster.covjson')
PATH_APP_GCM_country_COVJSON = os.path.join(PATH_APP_DATA, 'GCM_country.covjson')

# Parameter names
Tmean = 'T2M'
Tmean05 = 'T2M05'
Tmean95 = 'T2M95'

countries = get_countries()
clusters = get_clusters()

def create_timeseries_covjson(template_path, out_path, id_axis, time_columns, csv_paths):
    ''' Creates a CovJSON file with time series data. See run() for application. '''
    timeseries = load_json(template_path)
  
    # fill domain
    any_csv_path = next(iter(csv_paths.values()))
    with open(any_csv_path, newline='') as csvfile:
        rows = csv.reader(csvfile)
        id_codes = next(rows)[time_columns:]
        
        # fill 'country'/'cluster' domain axis
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
              
        # fill 't' domain axis
        tvals = timeseries['domain']['axes']['t']['values']
        for row in rows:
            time = row[:time_columns]
            if time_columns == 2:
              tvals.append(time[0] + '-' + time[1].zfill(2))
            elif time_columns == 1:
              tvals.append(time[0])
            else:
              raise Error('Unsupported')
    
    # fill ranges
    for param_key, csv_path in csv_paths.items():
      with open(csv_path, newline='') as csvfile:
          rows = csv.reader(csvfile)
          next(rows) # skip first row
      
          range = timeseries['ranges'][param_key]
          range['shape'] = [len(tvals), len(id_codes)]
          for row in rows:
              range['values'].extend(map(float, row[time_columns:]))          
  
    save_covjson(timeseries, out_path)
  
def run():
    '''
    Runs all transformations defined in this module and copies the generated files
    to their final location in the web app.
    '''
    create_timeseries_covjson(template_path=PATH_TIMESERIES_COUNTRY_MONTHLY_COVJSON_TEMPLATE, 
                              out_path=PATH_ERA_country_COVJSON,
                              id_axis='country',
                              time_columns=2,
                              csv_paths={Tmean: PATH_ERA_Tmean_countries_sample_CSV})
  
    create_timeseries_covjson(template_path=PATH_TIMESERIES_CLUSTER_MONTHLY_COVJSON_TEMPLATE, 
                              out_path=PATH_ERA_cluster_COVJSON,
                              id_axis='cluster',
                              time_columns=2,
                              csv_paths={Tmean: PATH_ERA_Tmean_cluster_sample_CSV})
    
    create_timeseries_covjson(template_path=PATH_TIMESERIES_COUNTRY_YEARLY_PERCENTILES_COVJSON_TEMPLATE,
                              out_path=PATH_GCM_country_COVJSON,
                              id_axis='country',
                              time_columns=1,
                              csv_paths={
                                  Tmean: PATH_GCM_Tmean_country_sample_CSV,
                                  Tmean05: PATH_GCM_Tmean05_country_sample_CSV,
                                  Tmean95: PATH_GCM_Tmean95_country_sample_CSV
                              })
  
    shutil.copyfile(PATH_ERA_country_COVJSON, PATH_APP_ERA_country_COVJSON)
    shutil.copyfile(PATH_ERA_cluster_COVJSON, PATH_APP_ERA_cluster_COVJSON)
    shutil.copyfile(PATH_GCM_country_COVJSON, PATH_APP_GCM_country_COVJSON)
  