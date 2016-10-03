from collections import OrderedDict, namedtuple
import csv
import shutil
import os.path
import json
from string import Template

from ecem.util import save_json, PATH_DATA, PATH_GENERATED, PATH_APP_DATA

# Input files
PATH_COUNTRYNAMES = os.path.join(PATH_DATA, 'ECEM_countrynames.csv')
PATH_OBJ_JS_TEMPLATE = os.path.join(PATH_DATA, 'obj.js_template')

# Output files
PATH_COUNTRYNAMES_JS = os.path.join(PATH_GENERATED, 'countries.js')

# Final output destination
PATH_APP_COUNTRYNAMES_JS = os.path.join(PATH_APP_DATA, 'countries.js')

Country = namedtuple('Country', ['name', 'code'])

def get_countries(name_only=False):
  '''
  Returns a dictionary where each key is a country code and each value
  a dictionary that maps language codes to country labels.

  Currently, only 'en' is returned as language code.
  '''
  countries = OrderedDict()
  with open(PATH_COUNTRYNAMES, newline='') as csvfile:
    rows = csv.reader(csvfile)
    next(rows) # skip first line
    for row in rows:
      name = { 'en': row[1] }
      code = row[2]
      countries[code] = name if name_only else Country(name=name, code=code)
  
  return countries
  
def create_countries_js():
    ''' Creates the countries.js file which maps country codes to labels. '''
    os.makedirs(os.path.dirname(PATH_COUNTRYNAMES_JS), exist_ok=True)
    
    countries = get_countries(name_only=True)
    with open(PATH_OBJ_JS_TEMPLATE) as fp:
        tmpl = fp.read()
        countries_js = Template(tmpl).substitute(obj=json.dumps(countries))
    with open(PATH_COUNTRYNAMES_JS, 'w') as fp:
        fp.write(countries_js)

def run():
  '''
  Runs all transformations defined in this module and copies the generated files
  to their final location in the web app.
  '''
  create_countries_js()
  
  shutil.copyfile(PATH_COUNTRYNAMES_JS, PATH_APP_COUNTRYNAMES_JS)
  