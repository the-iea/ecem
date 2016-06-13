import 'core-js/es6'
import 'fetch'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css!'
import 'leaflet-loading'
import 'leaflet-loading/src/Control.Loading.css!'

import 'bootstrap/css/bootstrap.css!'

import * as CovJSON from 'covjson-reader'

import 'c3/c3.css!'
import TimeSeriesPlot from './TimeSeriesPlot.js'
import * as dom from './dom.js'
import './css/style.css!'

import TEMPLATE_INDEX from './templates/index.js'
dom.add(TEMPLATE_INDEX, document.body)

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
 
class ClusterModeControl extends L.Control {
  constructor (options={}) {
    super(options.position ? {position: options.position} : {position: 'bottomleft'})
    this.callback = options.callback
    this.clusters = false
  }
  
  onAdd () {
    let html = cl => '<span class="glyphicon glyphicon-eye-' + (cl ? 'close' : 'open') + '"></span> ' + (cl ? 'Hide' : 'Show') + ' Clusters'
    let el = dom.HTMLone('<button class="btn btn-default btn-lg">' + html(this.clusters) + '</button>')
    L.DomEvent.disableClickPropagation(el)
    el.addEventListener('click', () => {
      this.clusters = !this.clusters
      el.innerHTML = html(this.clusters)
      this.fire('change', {clusters: this.clusters})
    })    
    return el
  }
    
}
ClusterModeControl.include(L.Mixin.Events)

function loadClusterLayer () {
  return fetch('app/data/clusters.geojson')
    .then(response => response.json())
    .then(clusters => {
      let layer = L.geoJson(clusters, {
        style: feature => ({
          color: 'black',
          weight: 0.5,
          opacity: 1,
          fillOpacity: 1,
          fillColor: CLUSTER_COLOURS[parseInt(feature.properties.color_idx)] || CLUSTER_COLOURS[99]
        })
      }).on('add', () => {
        // setting zindex is not supported for vector layers
        layer.bringToBack()
      })
      
      let markers      
      layer.on('add', () => {
        if (!markers) {
          // getCenter() can only be called after the layers have been added to the map
          markers = layer.getLayers().map(featureLayer => 
            L.marker(featureLayer.getCenter(), {
              interactive: false,
              icon: L.divIcon({
                className: 'polygon-label',
                html: '<h5><span class="label label-default">' + featureLayer.feature.properties.cluster_code + '</span></h5>'
              })
            })
          )
        }
        markers.forEach(l => l.addTo(layer._map))
      }).on('remove', () => {
        markers.forEach(l => l.remove())
      })
      
      return layer
  })
}

function loadCountryLayer () {
  return fetch('app/data/countries.geojson')
    .then(response => response.json())
    .then(countries => {
      let layer = L.geoJson(countries, {
        style: feature => ({
          color: 'black',
          weight: 2,
          opacity: 1,
          fill: true,
          fillOpacity: 1,
          fillColor: 'lightblue'
        })
      }).on('add', () => {
        // setting zindex is not supported for vector layers
        layer.bringToFront()
      })

      let markers      
      layer.on('add showmarkers', () => {
        if (!markers) {
          // getCenter() can only be called after the layers have been added to the map
          markers = layer.getLayers().map(featureLayer => {
            let code = featureLayer.feature.properties.country_code
            // AT has weird centroid position, use bbox center instead
            let pos = code === 'AT' ? featureLayer.getBounds().getCenter() : featureLayer.getCenter()
            return L.marker(pos, {
              interactive: false,
              icon: L.divIcon({
                className: 'polygon-label',
                html: '<h5><span class="label label-default">' + code + '</span></h5>'
              })
            })
          })
        }
        markers.forEach(l => l.addTo(layer._map))
      }).on('remove hidemarkers', () => {
        markers.forEach(l => l.remove())
      })
      
      return layer
  })
}

class App {
  constructor () {
    let map = L.map('map', {
      center: [52, 10],
      zoom: 5
    })
    this.map = map
    
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://www.osm.org">OpenStreetMap</a>'
    }).addTo(map)
        
    L.control.scale().addTo(map)
    
    this.data = {}
    this.data.ERA_Tmean_countries = CovJSON.read('app/data/ERA_Tmean_countries_sample.covjson')
    this.data.ERA_Tmean_cluster = CovJSON.read('app/data/ERA_Tmean_cluster_sample.covjson')
    
    loadClusterLayer().then(layer => {
      this.clusterLayer = layer
        .on('click', e => {
          let cluster_code = e.layer.feature.properties.cluster_code
          this.showClusterTestPlot(cluster_code, e.layer.getCenter())
        })
    })
    loadCountryLayer().then(layer => {
      this.countryLayer = layer
        .on('click', e => {
          let country_code = e.layer.feature.properties.country_code
          
          this.showCountryTestPlot(country_code, e.layer.getCenter())
        }).addTo(map)
    })
    this.clusterModeControl = new ClusterModeControl()
      .on('change', e => {
        if (e.clusters) {
          this.clusterLayer.addTo(map)
          this.countryLayer.setStyle({fill: false})
          this.countryLayer.fire('hidemarkers')
        } else {
          this.clusterLayer.remove()
          this.countryLayer.setStyle({fill: true})
          this.countryLayer.fire('showmarkers')
        }
      }).addTo(map)
  }
  
  showCountryTestPlot (country_code, latlng) {
    this.data.ERA_Tmean_countries
      .then(cov => cov.subsetByValue({country: country_code}))
      .then(cov => {
        new TimeSeriesPlot(cov, {
          className: 'timeseries-popup',
          maxWidth: 600,
          timeFormat: '%Y-%m'
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
  
  showClusterTestPlot (cluster_code, latlng) {
    this.data.ERA_Tmean_cluster
      .then(cov => cov.subsetByValue({cluster: cluster_code}))
      .then(cov => {
        new TimeSeriesPlot(cov, {
          className: 'timeseries-popup',
          maxWidth: 600,
          timeFormat: '%Y-%m'
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
}

new App()

