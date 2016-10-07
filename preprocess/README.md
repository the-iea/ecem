# Data preprocessing

This folder contains raw input data and Python scripts that preprocess input data for use in the web application.

- Input data is located in [`/preprocess/data`](data).
- Output data templates are located in [`/preprocess/templates`](templates).
- Generated output data is located in `/preprocess/generated` (not under version control) as well as [`/public/app/data`](../public/app/data).
- Processing scripts are located in [`/preprocess/ecem`](ecem).

### Country and cluster IDs/labels

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

#### Description

The outlines of countries and clusters shall be displayed on a map
with the possibility to hide cluster outlines and only display country outlines.
In addition, it must be possible to uniquely identify a displayed country/cluster by its ID.

The solution used here is to generate two GeoJSON files, one for countries, and one for clusters.
Each GeoJSON feature has the corresponding country/cluster ID in its `"properties"` member.

The input data is a Shapefile of the clusters, produced by the
[e-Highway2050](http://www.e-highway2050.eu/fileadmin/documents/Results/D2_2_European_cluster_model_of_the_Pan-European_transmission_grid_20072015.pdf) project.
To avoid visual artifacts it is important that those segments of the cluster outlines
which are identical to country outlines are overlapping those exactly with the same accuracy/precision.
For that reason, the country outlines were generated directly from the cluster outlines by merging the clusters
of a country together -- attempts to locate a countries Shapefile of the same accuracy/precision as the clusters Shapefile
have not been successful, hence this indirect approach.

Note that the generated clusters GeoJSON file also contains a `"color_idx"` property for each cluster.
This property was copied directly from the input Shapefile and is used for easily colouring the clusters
such that neighbouring clusters in a given country do not have the same colour.
The colour does not have any meaning and is purely for aesthetics. It may be removed in the future if not needed.

#### Files

Input files:
- [`cluster_borders/*`](data/cluster_borders) (Shapefile)

Processing script:
- [`clusters.py#create_country_geojson()`](ecem/clusters.py)
- [`clusters.py#create_cluster_geojson()`](ecem/clusters.py)

Output files:
- [`countries.geojson`](../public/app/data/countries.geojson)
- [`clusters.geojson`](../public/app/data/clusters.geojson)

### Time series data

#### Description

All time series input data is available as CSV files where each CSV file represents data for:
- one variable (e.g. temperature)
- one time period (e.g. 1979-01 to 2014-12)
- one statistical measure (mean, or 5th percentile, or 95th percentile)
- one temporal aggregation method (monthly or yearly)
- one spatial aggregation method (country or cluster)

The chosen solution for serving time series data to the web app is to use the [CovJSON](https://covjson.org) format
which allows to represent multidimensional data together with rich self-describing metadata.
By doing that, multiple CSV files can be grouped into a single CovJSON file and then be efficiently queried in JavaScript.
Even though not used at the moment, the format allows to tile data into linked files, should a single file become too huge.

#### Files

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
