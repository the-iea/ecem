import uuid
import json
import os.path
from collections import OrderedDict

PATH_DATA = os.path.join(os.path.dirname(__file__), '..', 'data')
PATH_GENERATED = os.path.join(os.path.dirname(__file__), '..', 'generated')
PATH_APP_DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'app', 'data')

def load_json(path):
  with open(path, 'r') as fp:
    return json.load(fp, object_pairs_hook=OrderedDict)

def save_json(obj, path, **kw):
  with open(path, 'w') as fp:
    jsonstr = json.dumps(obj, fp, cls=NoIndentEncoder, **kw)
    fp.write(jsonstr)
    
def save_covjson(obj, path):
  # skip indentation of certain fields to make it more compact but still human readable
  for axis in obj['domain']['axes'].values():
    no_indent(axis, 'values')
  for ref in obj['domain']['referencing']:
    if 'identifiers' in ref['system']:
      identifiers = ref['system']['identifiers']
      for k in identifiers:
        no_indent(identifiers[k], 'label')
  range = obj['ranges']['TEMP']
  no_indent(range, 'axisNames', 'shape', 'values')
  save_json(obj, path, indent=2)

def minify_json (path):
  with open(path, 'r') as fp:
    jsonstr = fp.read()
  with open(path, 'w') as fp:
    json.dump(json.loads(jsonstr), fp, separators=(',', ':'))

def no_indent(obj, *names):
  for name in names:
    obj[name] = NoIndent(obj[name])

# http://stackoverflow.com/a/25935321  
class NoIndent(object):
    def __init__(self, value):
        self.value = value

class NoIndentEncoder(json.JSONEncoder):
    def __init__(self, *args, **kwargs):
        super(NoIndentEncoder, self).__init__(*args, **kwargs)
        self.kwargs = dict(kwargs)
        del self.kwargs['indent']
        self._replacement_map = {}

    def default(self, o):
        if isinstance(o, NoIndent):
            key = uuid.uuid4().hex
            self._replacement_map[key] = json.dumps(o.value, **self.kwargs)
            return "@@%s@@" % (key,)
        else:
            return super(NoIndentEncoder, self).default(o)

    def encode(self, o):
        result = super(NoIndentEncoder, self).encode(o)
        for k, v in self._replacement_map.items():
            result = result.replace('"@@%s@@"' % (k,), v)
        return result
      