import json

def minify_json (path):
  with open(path, 'r') as fp:
    jsonstr = fp.read()
  with open(path, 'w') as fp:
    json.dump(json.loads(jsonstr), fp, separators=(',', ':'))