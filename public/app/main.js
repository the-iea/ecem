// polyfills
import 'core-js/es6'
import 'fetch'

// Leaflet
import L from 'leaflet'
import 'leaflet/dist/leaflet.css!'
import 'leaflet-loading'
import 'leaflet-loading/src/Control.Loading.css!'

// Bootstrap
import 'bootstrap/css/bootstrap.css!'
import Modal from 'bootstrap-native/lib/modal-native.js'

// CovJSON
import * as CovJSON from 'covjson-reader'
import * as C from 'covutils'

// Country and cluster data
import Countries from './data/countries.js'
import Clusters from './data/clusters.js'

// time series plot
import TimeSeriesPlot from './TimeSeriesPlotHighcharts.js'

// various controls for the Leaflet map
import InfoSignControl from './controls/InfoSignControl.js'
import ClusterModeControl from './controls/ClusterModeControl.js'
import TimePeriodControl from './controls/TimePeriodControl.js'
import VariablesControl from './controls/VariablesControl.js'
import HelpControl from './controls/HelpControl.js'

// DOM helpers
import {add, $, $$} from './dom.js'

// styles
// import 'c3/c3.css!'
import './css/style.less!'
import './css/control.ButtonGroup.css!'
import './css/control.Help.css!'

// the main template
import TEMPLATE_INDEX from './templates/index.js'

add(TEMPLATE_INDEX, document.body)

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

function loadClusterLayer () {
  return fetch('app/data/clusters.geojson')
    .then(response => response.json())
    .then(clusters => {
      let defaultFeatureStyle = feature => ({
        color: 'black',
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
        fillColor: CLUSTER_COLOURS[parseInt(feature.properties.color_idx)] || CLUSTER_COLOURS[99]
      })
      let layer = L.geoJson(clusters, {
        style: feature => defaultFeatureStyle(feature),
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', e => {
            let highlightStyle = defaultFeatureStyle(feature)
            highlightStyle.fillColor = darken(highlightStyle.fillColor, 0.1)
            e.target.setStyle(highlightStyle)
          })
          layer.on('mouseout', e => e.target.setStyle(defaultFeatureStyle(feature)))
        }
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
  let defaultStyle = {
    color: 'black',
    weight: 2,
    opacity: 1,
    fill: true,
    fillOpacity: 1,
    fillColor: '#ADD8E6'
  }
  
  let highlightStyle = JSON.parse(JSON.stringify(defaultStyle))
  highlightStyle.fillColor = darken(defaultStyle.fillColor, 0.1)
  
  return fetch('app/data/countries.geojson')
    .then(response => response.json())
    .then(countries => {
      let fill = true
      let layer = L.geoJson(countries, {
        style: feature => defaultStyle,
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', e => {
            highlightStyle.fill = fill
            e.target.setStyle(highlightStyle)
          })
          layer.on('mouseout', e => {
            defaultStyle.fill = fill
            e.target.setStyle(defaultStyle)
          })
        }
      }).on('add', () => {
        // setting zindex is not supported for vector layers
        layer.bringToFront()
      })
      
      layer.on('fill', () => {
        fill = true
        layer.setStyle({fill})
      }).on('nofill', () => {
        fill = false
        layer.setStyle({fill})
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
      zoom: 5,
      minZoom: 4,
      maxZoom: 6,
      attributionControl: false
    })
    this.map = map
    
    // center popups
    map.on('popupopen', e => {
      if (this._skipNextPopupCentering) {
        this._skipNextPopupCentering = false
        return
      }
      var px = map.project(e.popup._latlng)
      px.y -= e.popup._container.clientHeight/3.5
      map.panTo(map.unproject(px),{animate: true})
    })
    
    map.zoomControl.setPosition('topright')
    
    new InfoSignControl()
      .on('click', () => {
        new Modal($$('#infoModal')).open()
      }).addTo(map)   
      
    this.clusterModeControl = new ClusterModeControl()
      .on('change', e => {
        if (e.clusters) {
          this.clusterLayer.addTo(map)
          this.countryLayer.fire('nofill')
          this.countryLayer.fire('hidemarkers')
        } else {
          this.clusterLayer.remove()
          this.countryLayer.fire('fill')
          this.countryLayer.fire('showmarkers')
        }
        if (this.map.hasLayer(this.lastPopup)) {
          this.map.removeLayer(this.lastPopup)
        }
      }).addTo(map)
    
    this.timePeriodControl = new TimePeriodControl({initialActive: 'historic'})
      .on('change', () => {
        this.refreshPlotIfVisible()
      }).addTo(map)
      
    this.variablesControl = new VariablesControl({initialActive: 'climate'})
      .on('paramchange', () => {
        this.refreshPlotIfVisible()
      }).addTo(map)
      
    let helpEl = new HelpControl().createElement()
    add(helpEl, $$('#map'))
        
    //L.control.scale().addTo(map)
    
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    
    this.data = {}
    this.data.ERA_country = CovJSON.read('app/data/ERA_country.covjson')
    this.data.ERA_cluster = CovJSON.read('app/data/ERA_cluster.covjson')
    this.data.GCM_country = CovJSON.read('app/data/GCM_country.covjson')
    
    loadClusterLayer().then(layer => {
      this.clusterLayer = layer
        .on('click', e => {
          this.handleClusterClick(e.layer)
        })
    })
    loadCountryLayer().then(layer => {
      this.countryLayer = layer
        .on('click', e => {
          this.handleCountryClick(e.layer)
        }).addTo(map)
    })
  }
  
  skipNextPlotCentering () {
    this._skipNextPopupCentering = true
  }
  
  refreshPlotIfVisible () {
    if (!this.map.hasLayer(this.lastPopup)) {
      return
    }
    this.skipNextPlotCentering()
    let lastPopup = this.lastPopup
    if (this.clusterModeControl.clusters) {
      this.handleClusterClick(this.lastClickedLayer)
    } else {
      this.handleCountryClick(this.lastClickedLayer)
    }
    // close old popup a little later so that flashing is avoided
    setTimeout(() => this.map.removeLayer(lastPopup), 500)
  }
  
  handleCountryClick (layer) {
    this.lastClickedLayer = layer
    let countryCode = layer.feature.properties.country_code
    let paramKey = this.variablesControl.paramKey
    
    if (this.timePeriodControl.mode === 'historic') {
      this.showCountryHistoricPlot(countryCode, paramKey, layer.getCenter())
    } else if (this.timePeriodControl.mode === 'climate-projections') {
      this.showCountryClimateProjectionPlot(countryCode, paramKey, layer.getCenter())
    } else {
      // not implemented
    }
  }
  
  handleClusterClick (layer) {
    this.lastClickedLayer = layer
    let clusterCode = layer.feature.properties.cluster_code
    let paramKey = this.variablesControl.paramKey
    
    if (this.timePeriodControl.mode === 'historic') {
      this.showClusterHistoricPlot(clusterCode, paramKey, layer.getCenter())
    } else if (this.timePeriodControl.mode === 'climate-projections') {
      this.showClusterClimateProjectionPlot(clusterCode, paramKey, layer.getCenter())
    } else {
      // not implemented
    }
  }
  
  showCountryHistoricPlot (countryCode, paramKey, latlng) {
    this.data.ERA_country
      .then(cov => cov.subsetByValue({country: countryCode}))
      .then(cov => {
        this.lastPopup = new TimeSeriesPlot(cov, {
          keys: [paramKey],
          labels: [paramKey],
          className: 'timeseries-popup',
          maxWidth: 600,
          title: 'ERA ' + paramKey + ' for ' + C.getLanguageString(Countries[countryCode])
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
  
  showCountryClimateProjectionPlot (countryCode, paramKey, latlng) {
    this.data.GCM_country
      .then(cov => {
        return cov.loadDomain()
          .then(domain => {
            let tVals = domain.axes.get('t').values
            let tMax = tVals[tVals.length - 1]
            return cov.subsetByValue({country: countryCode, t: {start: '1979', stop: tMax}})
          })
          .then(cov => {
            this.lastPopup = new TimeSeriesPlot([cov, cov, cov], {
              keys: [[paramKey, paramKey + '05', paramKey + '95']],
              labels: [[paramKey, '5th/95th percentile']],
              types: ['shadedinterval'],
              className: 'timeseries-popup',
              maxWidth: 600,
              title: 'GCM ' + paramKey + ' ensemble for ' + C.getLanguageString(Countries[countryCode])
            }).setLatLng(latlng)
              .addTo(this.map)
          })
      })
  }
  
  showClusterHistoricPlot (clusterCode, paramKey, latlng) {
    this.data.ERA_cluster
      .then(cov => cov.subsetByValue({cluster: clusterCode}))
      .then(cov => {
        let countryCode = Clusters[clusterCode]
        this.lastPopup = new TimeSeriesPlot(cov, {
          keys: [paramKey],
          labels: [paramKey],
          className: 'timeseries-popup',
          maxWidth: 600,
          title: 'ERA ' + paramKey + ' for ' + clusterCode + ' (' + C.getLanguageString(Countries[countryCode]) + ')'
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
  
  showClusterClimateProjectionPlot (clusterCode, paramKey, latlng) {
    paramKey = ' ' + paramKey
    // fake plot just to get no-data message
    this.data.GCM_country
      .then(cov => cov.subsetByValue({country: 'DE'})
          .then(cov => {
            let countryCode = Clusters[clusterCode]
            this.lastPopup = new TimeSeriesPlot([cov, cov, cov], {
              keys: [[paramKey, paramKey + '05', paramKey + '95']],
              labels: [[paramKey, '5th/95th percentile']],
              types: ['shadedinterval'],
              className: 'timeseries-popup',
              maxWidth: 600,
              title: 'GCM ' + paramKey + ' ensemble for ' + clusterCode + ' (' + C.getLanguageString(Countries[countryCode]) + ')'
            }).setLatLng(latlng)
              .addTo(this.map)
          })
      )
  }
}

/**
 * Darken a given hex color by a given ratio. If negative, lighten up.
 * 
 * @example
 * let darker = darken('#ADD8E6', 0.2) // darken by 20%
 */
function darken (hex, ratio) {
  hex = hex.slice(1) // strip off #
  let lum = -ratio

  let rgb = '#'
  for (let i = 0; i < 3; i++) {
    let c = parseInt(hex.substr(i*2,2), 16)
    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16)
    rgb += ('00'+c).substr(c.length)
  }

  return rgb
}

let app = new App()

window.api = {
  map: app.map
}
