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
import * as CovUtils from 'covutils'

// Mappings between country and cluster IDs/labels
import Countries from './data/countries.js'
import Clusters from './data/clusters.js'

// time series plot
import TimeSeriesPlot from './popups/TimeSeriesPlotHighcharts.js'

// various controls for the Leaflet map
import InfoSignControl from './controls/InfoSignControl.js'
import ClusterModeControl from './controls/ClusterModeControl.js'
import TimePeriodControl from './controls/TimePeriodControl.js'
import VariablesControl from './controls/VariablesControl.js'
import HelpControl from './controls/HelpControl.js'

// Country/Cluster layers
import {loadCountryLayer} from './layers/CountryLayer.js'
import {loadClusterLayer} from './layers/ClusterLayer.js'

// DOM helpers
import {add, $, $$} from './util/dom.js'

// styles
// import 'c3/c3.css!'
import './css/style.less!'
import './css/control.ButtonGroup.css!'
import './css/control.Help.css!'

// the main template
import TEMPLATE_INDEX from './templates/IndexTemplate.js'

/**
 * This class builds the whole application and plugs everything together using events.
 * 
 * Template: {@link IndexTemplate}
 */
export default class App {
  constructor () {
    add(TEMPLATE_INDEX, document.body)

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
      .on('variablechange', () => {
        this.refreshPlotIfVisible()
      }).addTo(map)
      
    let helpEl = HelpControl.createElement()
    add(helpEl, $$('#map'))
        
    //L.control.scale().addTo(map)
    
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    
    this.data = {}
    this.data.ERA_country = CovJSON.read('app/data/ERA_country.covjson')
    this.data.ERA_cluster = CovJSON.read('app/data/ERA_cluster.covjson')
    this.data.GCM_country = CovJSON.read('app/data/GCM_country.covjson')
    
    loadClusterLayer('app/data/clusters.geojson').then(layer => {
      this.clusterLayer = layer
        .on('click', e => {
          this.handleClusterClick(e.layer)
        })
    })
    loadCountryLayer('app/data/countries.geojson').then(layer => {
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
    let paramKey = this.variablesControl.variable
    
    if (this.timePeriodControl.name === 'historic') {
      this.showCountryHistoricPlot(countryCode, paramKey, layer.getCenter())
    } else if (this.timePeriodControl.name === 'climate-projections') {
      this.showCountryClimateProjectionPlot(countryCode, paramKey, layer.getCenter())
    } else {
      // not implemented
    }
  }
  
  handleClusterClick (layer) {
    this.lastClickedLayer = layer
    let clusterCode = layer.feature.properties.cluster_code
    let paramKey = this.variablesControl.variable
    
    if (this.timePeriodControl.name === 'historic') {
      this.showClusterHistoricPlot(clusterCode, paramKey, layer.getCenter())
    } else if (this.timePeriodControl.name === 'climate-projections') {
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
          title: 'ERA ' + paramKey + ' for ' + CovUtils.getLanguageString(Countries[countryCode])
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
              title: 'GCM ' + paramKey + ' ensemble for ' + CovUtils.getLanguageString(Countries[countryCode])
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
          title: 'ERA ' + paramKey + ' for ' + clusterCode + ' (' + CovUtils.getLanguageString(Countries[countryCode]) + ')'
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
              title: 'GCM ' + paramKey + ' ensemble for ' + clusterCode + ' (' + CovUtils.getLanguageString(Countries[countryCode]) + ')'
            }).setLatLng(latlng)
              .addTo(this.map)
          })
      )
  }
}
