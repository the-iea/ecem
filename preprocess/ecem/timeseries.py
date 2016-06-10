import os.path
import shutil
import csv
import json
from ecem.util import load_json, save_covjson, PATH_DATA, PATH_GENERATED, PATH_APP_DATA
from ecem.countries import get_countries

# Input files
PATH_TIMESERIES = os.path.join(PATH_DATA, 'timeseries')
PATH_TIMESERIES_COVJSON_TEMPLATE = os.path.join(PATH_TIMESERIES, 'timeseries_country.covjson_template')
PATH_ERA_Tmean_countries_sample_CSV = os.path.join(PATH_TIMESERIES, 'ERA_Tmean_countries_sample.csv')

# Output files
PATH_ERA_Tmean_countries_sample_COVJSON = os.path.join(PATH_GENERATED, 'ERA_Tmean_countries_sample.covjson')

# Final output destination
PATH_APP_ERA_Tmean_countries_sample_COVJSON = os.path.join(PATH_APP_DATA, 'ERA_Tmean_countries_sample.covjson')

countries = get_countries()

def create_timeseries_covjson():
  timeseries = load_json(PATH_TIMESERIES_COVJSON_TEMPLATE)
  
  with open(PATH_ERA_Tmean_countries_sample_CSV, newline='') as csvfile:
    rows = csv.reader(csvfile)
    country_codes = next(rows)[2:]
    
    # fill 'country' domain axis
    timeseries['domain']['axes']['country']['values'] = country_codes
    identifiers = timeseries['domain']['referencing'][0]['system']['identifiers']
    for code in country_codes:
      identifiers[code] = {
        'label': countries[code].name
      }
    
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
    range['shape'] = [n, len(country_codes)]
  
  save_covjson(timeseries, PATH_ERA_Tmean_countries_sample_COVJSON)
  
def run():
  create_timeseries_covjson()
  
  shutil.copyfile(PATH_ERA_Tmean_countries_sample_COVJSON, PATH_APP_ERA_Tmean_countries_sample_COVJSON)
  