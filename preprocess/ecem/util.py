import uuid
import json
import os.path
from collections import OrderedDict

# folder path of the input files
PATH_DATA = os.path.join(os.path.dirname(__file__), '..', 'data')

# folder path of the generated output files
PATH_GENERATED = os.path.join(os.path.dirname(__file__), '..', 'generated')

# folder path of the generated output files in the web application
PATH_APP_DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'app', 'data')

def load_json(path):
  ''' Loads a JSON file and returns an OrderedDict maintaining the field order. '''
  with open(path, 'r') as fp:
    return json.load(fp, object_pairs_hook=OrderedDict)

def save_json(obj, path, **kw):
  '''
  Saves the given dictionary to the given path as JSON with support for `Custom` objects.

  If a `Custom` object is encountered, then the keyword arguments used to construct it
  are used for the JSON serialization in json.dumps() for the wrapped value.
  This allows to easily influence serialization for selected values.
  '''
  with open(path, 'w') as fp:
    jsonstr = json.dumps(obj, fp, cls=CustomEncoder, **kw)
    fp.write(jsonstr)
    
def save_covjson(obj, path):
  '''
  Saves the given dictionary to the given path as JSON while
  skipping indentation of certain CovJSON fields to make the resulting JSON
  more compact but still human readable.
  '''
  for axis in obj['domain']['axes'].values():
    compact(axis, 'values')
  for ref in obj['domain']['referencing']:
    no_indent(ref, 'coordinates')
  for range in obj['ranges'].values():
    no_indent(range, 'axisNames', 'shape')
    compact(range, 'values')
  save_json(obj, path, indent=2)

def minify_json (path):
  ''' Overrides the given JSON file with its minified version, skipping all whitespace. '''
  with open(path, 'r') as fp:
    jsonstr = fp.read()
  with open(path, 'w') as fp:
    json.dump(json.loads(jsonstr, object_pairs_hook=OrderedDict), fp, separators=(',', ':'))

def compact(obj, *names):
  ''' Wraps the values of the given fields in `Custom` objects such that whitespace is omitted when saving. '''
  for name in names:
    obj[name] = Custom(obj[name], separators=(',', ':'))

def no_indent(obj, *names):
  ''' Wraps the values of the given fields in `Custom` objects such that indentation is omitted when saving. '''
  for name in names:
    obj[name] = Custom(obj[name])

# adapted from http://stackoverflow.com/a/25935321  
class Custom(object):
    def __init__(self, value, **custom_args):
        self.value = value
        self.custom_args = custom_args

class CustomEncoder(json.JSONEncoder):
    def __init__(self, *args, **kwargs):
        super(CustomEncoder, self).__init__(*args, **kwargs)
        self._replacement_map = {}

    def default(self, o):
        if isinstance(o, Custom):
            key = uuid.uuid4().hex
            self._replacement_map[key] = json.dumps(o.value, **o.custom_args)
            return "@@%s@@" % (key,)
        else:
            return super(CustomEncoder, self).default(o)

    def encode(self, o):
        result = super(CustomEncoder, self).encode(o)
        for k, v in self._replacement_map.items():
            result = result.replace('"@@%s@@"' % (k,), v)
        return result
      