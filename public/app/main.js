import 'core-js/es6/promise.js'
import 'fetch'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css!'
import 'leaflet-loading'
import 'leaflet-loading/src/Control.Loading.css!'

import 'bootstrap/css/bootstrap.css!'
//import topojson from 'topojson'

import * as dom from './dom.js'
import './css/style.css!'

import TEMPLATE_INDEX from './templates/index.js'
dom.add(TEMPLATE_INDEX, document.body)

let map = L.map('map', {
  center: [50, 20],
  zoom: 4
})

L.control.scale().addTo(map)

const CLUSTER_COLOURS = {
  0: '#d7191c',
  1: '#f2854e',
  2: '#fdb569',
  3: '#fdd28b',
  4: '#fef0ad',
  5: '#eff8ba',
  6: '#d1ecb0',
  7: '#b2e0a6',
  8: '#88c4aa',
  9: '#59a3b2',
  99: '#2b83ba'
}

fetch('app/data/clusters.geojson')
  .then(response => response.json())
  .then(clusters => {
    let layer = L.geoJson(clusters, {
      style: feature => ({
        color: 'black',
        weight: 1,
        opacity: 1,
        fillOpacity: 1,
        fillColor: CLUSTER_COLOURS[parseInt(feature.properties.Couleur)] || CLUSTER_COLOURS[99],
      }),
      onEachFeature: (feature, layer) => {
        L.marker(layer.getBounds().getCenter(), {
          icon: L.divIcon({
            className: 'cluster-label',
            html: feature.properties.Clusters_c
          })
        }).addTo(map)
      }
    }).bindPopup(layer => {
      return '<pre>' + JSON.stringify(layer.feature.properties, null, 2) + '</pre>'
    }).addTo(map)
    
    // setting zindex is not supported for vector layers
    layer.bringToBack()
})

fetch('app/data/countries.geojson')
  .then(response => response.json())
  .then(countries => {
    let layer = L.geoJson(countries, {
      style: feature => ({
        color: 'black',
        weight: 3,
        opacity: 1,
        fill: false,
        //fillOpacity: 1,
        //fillColor: 'lightblue'
      })
    }).bindPopup(layer => {
      return '<pre>' + JSON.stringify(layer.feature.properties, null, 2) + '</pre>'
    }).addTo(map)
    
    // setting zindex is not supported for vector layers
    layer.bringToFront()
})

/*
fetch('app/data/world-110m.topojson')
  .then(response => response.json())
  .then(o => {
    let layer = L.geoJson()
    // has 'countries' and 'land' collections in o.objects
    for (let i in o.objects) {
      // FIXME leaflet complains "Invalid GeoJSON object"
      let ft = topojson.feature(o, o.objects[i])
      layer.addData(layer, ft)
    }
    layer.addTo(map)
  })
*/