import 'core-js/es6/promise.js'
import 'fetch'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css!'
import 'leaflet-loading'
import 'leaflet-loading/src/Control.Loading.css!'

import 'bootstrap/css/bootstrap.css!'

import './css/style.css!'


let map = L.map('map', {
  center: [50, 20],
  zoom: 4
})

fetch('app/data/clusters.geojson')
  .then(response => response.json())
  .then(clusters => {
    L.geoJson(clusters, {
      style: feature => ({
        color: 'black',
        weight: 1,
        opacity: 1,
        fillOpacity: 1,
        fillColor: 'lightblue'
      })
    }).addTo(map)
})