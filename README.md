# ECEM Demonstrator

This repository hosts the source code of the [ECEM demonstrator](https://the-iea.github.io/ecem) that is currently being developed as part of the [European Climatic Energy Mixes (ECEM) project](http://climate.copernicus.eu/ecem-european-climatic-energy-mixes).

Latest version: https://the-iea.github.io/ecem

## Development setup

```bash
$ npm install
$ npm run serve
Starting up http-server, serving ./public
Available on:
  http://127.0.0.1:8095
```

Now go to <http://localhost:8095>.

While running in development mode, any code can be changed and a simple browser page refresh reflects that change.

## Bundle creation for production use

The production website needs a minified bundle which includes all JavaScript and CSS code. It can be created with `npm run build` which builds `bundle.min.js`. Copy this file into the gh-pages branch to update the website. Any other resources that are loaded dynamically (like GeoJSON assets or other data) have to be copied over to the gh-pages branch manually. Currently, this is everything in the /public/app/data and /public/app/img folders. Note that every git push to gh-pages updates the website immediately.
