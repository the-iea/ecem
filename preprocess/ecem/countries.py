import csv
import os.path
from collections import namedtuple

PATH_COUNTRYNAMES = os.path.join(os.path.dirname(__file__), '..', 'data', 'ECEM_countrynames.csv')

Country = namedtuple('Country', ['name', 'code'])

def get_countries():
  countries = {}
  with open(PATH_COUNTRYNAMES, newline='') as csvfile:
    rows = csv.reader(csvfile)
    next(rows) # skip first line
    for row in rows:
      name = { 'en': row[1] }
      code = row[2]
      countries[code] = Country(name=name, code=code)
  return countries
      