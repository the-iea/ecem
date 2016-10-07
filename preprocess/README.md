# Data preprocessing

This folder contains raw input data and Python scripts that preprocess input data for use in the web application.

- Input data is located in [`/preprocess/data`](data).
- Output data templates are located in [`/preprocess/templates`](templates).
- Generated output data is located in `/preprocess/generated` (not under version control) as well as [`/public/app/data`](../public/app/data).
- Processing scripts are located in [`/preprocess/ecem`](ecem).

### Country and cluster names

#### Description

In the web app we need a data structure for efficient querying of:
- Iteration over all available country codes
- Iteration over all available cluster codes
- Retrieval of the label of a country by its 2-letter code
- Retrieval of the country code corresponding to a cluster code

To achieve that, the input CSV files are transformed into two JavaScript files that each
export an object which functions as a dictionary. The country dictionary has the form:

```json
{
    "DE": {
        "en": "Germany" 
    },
    ...
}
```

Currently, labels are only available in English translations (code `"en"`),
however, the structure above allows for more languages in the future.

The cluster dictionary has the form:

```json
{
    "34DE": "DE",
    ...
}
```

#### Files

Input files:
- [`ECEM_countrynames.csv`](data/ECEM_countrynames.csv)
- [`ECEM_cluster_names.csv`](data/ECEM_cluster_names.csv)

Output template:
- [`obj.js_template`](templates/obj.js_template)

Processing scripts:
- [`countries.py#create_countries_js()`](ecem/countries.py)
- [`clusters.py#create_clusters_js()`](ecem/clusters.py)

Output files:
- [`countries.js`](../public/app/data/countries.js)
- [`clusters.js`](../public/app/data/clusters.js)

### Country and cluster geometries

Input files:
- [`cluster_borders/*`](data/cluster_borders) (Shapefile)

Processing script:
- [`clusters.py#create_country_geojson()`](ecem/clusters.py)
- [`clusters.py#create_cluster_geojson()`](ecem/clusters.py)

Output files:
- [`countries.geojson`](../public/app/data/countries.geojson)
- [`clusters.geojson`](../public/app/data/clusters.geojson)

### Time series data

Input files:
- [`timeseries/*.csv`](data/timeseries)

Output templates:
- [`timeseries_cluster_monthly.covjson_template`](templates/timeseries_cluster_monthly.covjson_template)
- [`timeseries_country_monthly.covjson_template`](timeseries_country_monthly.covjson_template)
- [`timeseries_country_yearly_percentiles.covjson_template`](timeseries_country_yearly_percentiles.covjson_template)

Processing script:
- [`timeseries.py`](ecem/timeseries.py)

Output files:
- [`ERA_country.covjson`](../public/app/data/ERA_country.covjson)
- [`ERA_cluster.covjson`](../public/app/data/ERA_cluster.covjson)
- [`GCM_country.covjson`](../public/app/data/GCM_country.covjson)

