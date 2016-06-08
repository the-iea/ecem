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
  0: 'lightblue',
  1: 'green',
  2: 'pink',
  3: 'yellow',
  4: 'violet',
  5: 'peach',
  6: 'indigo',
  7: 'navy',
  8: 'gray',
  9: 'orange'    
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
        fillColor: CLUSTER_COLOURS[parseInt(feature.properties.Couleur)] || CLUSTER_COLOURS[0],
      })
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
      filter: feature => feature.properties.continent === 'Europe',
      style: feature => ({
        color: 'black',
        weight: 3,
        opacity: 1,
        fill: false,
        //fillOpacity: 1,
        //fillColor: 'lightblue'
      })
    }).bindPopup(layer => {
      // iso_a2, iso_a3 -> uppercase ISO country codes
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