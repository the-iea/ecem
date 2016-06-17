import 'core-js/es6'
import 'fetch'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css!'
import 'leaflet-loading'
import 'leaflet-loading/src/Control.Loading.css!'

import 'bootstrap/css/bootstrap.css!'

import Modal from 'bootstrap-native/lib/modal-native.js'
import Dropdown from 'bootstrap-native/lib/dropdown-native.js'

import * as CovJSON from 'covjson-reader'

import EventMixin from './EventMixin.js'
import TimeSeriesPlot from './TimeSeriesPlotHighcharts.js'
import {add, $$, HTMLone} from './dom.js'

//import 'c3/c3.css!'
import './css/style.less!'
import './css/control.ButtonGroup.css!'
import './css/control.Help.css!'

import TEMPLATE_VARIABLESCONTROL from './templates/control.Variables.js'
import TEMPLATE_TIMEPERIODCONTROL from './templates/control.TimePeriod.js'
import TEMPLATE_HELPCONTROL from './templates/control.Help.js'
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
 
class InfoSignControl extends EventMixin(L.Control) {
  constructor (options={}) {
    super(options.position ? {position: options.position} : {position: 'bottomright'})
  }
  
  onAdd () {
    let el = HTMLone('<div class="info-sign-control"><a href="#"><span class="glyphicon glyphicon-info-sign text-muted"></span></a></div>')
    L.DomEvent.disableClickPropagation(el)
    $$('a', el).addEventListener('click', e => {
      L.DomEvent.preventDefault(e)
      this.fire('click')
    })
    return el
  }   
}

class ClusterModeControl extends EventMixin(L.Control) {
  constructor (options={}) {
    super(options.position ? {position: options.position} : {position: 'bottomleft'})
    this.callback = options.callback
    this.clusters = false
  }
  
  onAdd () {
    let html = cl => (cl ? 'Hide' : 'Show') + ' Clusters'
    let el = HTMLone('<button class="btn btn-ecem">' + html(this.clusters) + '</button>')
    L.DomEvent.disableClickPropagation(el)
    el.addEventListener('click', () => {
      this.clusters = !this.clusters
      el.innerHTML = html(this.clusters)
      this.fire('change', {clusters: this.clusters})
    })    
    return el
  }   
}

class ButtonGroupControl extends EventMixin(L.Control) {
  constructor (options={}) {
    options.position = options.position || 'topleft'
    super(options)
    this.on('add', () => {
      if (this.options.initialActive) {
        this._setActive(this.options.initialActive)
      }
    })
  }
  
  onAdd () {
    let el = HTMLone(this.options.template)
    L.DomEvent.disableClickPropagation(el)
    for (let name of this.options.names) {
      $$(this.options.classPrefix + name, el).addEventListener('click', () => {
        this._setActive(name)
        this.fire('change', {mode: name})
      })
    }
    return el
  }
  
  addTo (map) {
    super.addTo(map)
    this.fire('add')
    return this
  }
  
  _setActive (nameToActivate) {
    this.mode = nameToActivate
    let c = this.getContainer()
    let el = $$(this.options.classPrefix + nameToActivate, c)
    el.style.fontWeight = 'bold'
    L.DomUtil.addClass(el, 'active')
    for (let name of this.options.names.filter(n => n !== nameToActivate)) {
      let el = $$(this.options.classPrefix + name, c)
      el.style.fontWeight = 'initial'
      L.DomUtil.removeClass(el, 'active')
    }
  }
}

class TimePeriodControl extends ButtonGroupControl {
  constructor (options={}) {
    options.template = TEMPLATE_TIMEPERIODCONTROL
    options.names = ['historic', 'seasonal-forecasts', 'climate-projections']
    options.classPrefix = '.btn-timeperiod-'
    options.position = options.position || 'topleft'
    super(options)
  }
}

class VariablesControl extends ButtonGroupControl {
  constructor (options={}) {
    options.template = TEMPLATE_VARIABLESCONTROL
    options.names = ['energy', 'climate']
    options.classPrefix = '.btn-variables-'
    options.position = options.position || 'topleft'
    super(options)
  }
}

/**
 * Not a real leaflet control, but rather has to be added to the #map element.
 */
class HelpControl extends L.Class { 
  createElement () {
    let el = HTMLone(TEMPLATE_HELPCONTROL)
    L.DomEvent.disableClickPropagation(el)
    
    new Dropdown($$('.help-dropdown .dropdown-toggle', el))
    
    for (let name of ['usage', 'methods', 'results', 'casestudies']) {
      for (let menuEl of [$$('.btn-help-' + name, el), $$('.dropdown-help-' + name, el)]) {
        menuEl.addEventListener('click', () => {
          let uc = name.charAt(0).toUpperCase() + name.slice(1)
          new Modal($$('#help' + uc + 'Modal')).open()
        })
      }
    }
    return el
  }
}

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
      zoom: 5,
      attributionControl: false
    })
    this.map = map
    
    // center popups
    map.on('popupopen', function(e) {
      var px = map.project(e.popup._latlng)
      px.y -= e.popup._container.clientHeight/3.5
      map.panTo(map.unproject(px),{animate: true})
    })
    
    map.zoomControl.setPosition('topright')
    
    new InfoSignControl()
      .on('click', () => {
        new Modal($$('#infoModal')).open()
      }).addTo(map)   
    
    let timePeriodControl = new TimePeriodControl({initialActive: 'historic'})
      .on('click', e => {
        console.log(e.mode)
      }).addTo(map)
      
    let variablesControl = new VariablesControl({initialActive: 'climate'})
      .on('click', e => {
        console.log(e.mode)
      }).addTo(map)
      
    let helpEl = new HelpControl().createElement()
    add(helpEl, $$('#map'))
        
    //L.control.scale().addTo(map)
    
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    
    this.data = {}
    this.data.ERA_Tmean_countries = CovJSON.read('app/data/ERA_Tmean_countries_sample.covjson')
    this.data.ERA_Tmean_cluster = CovJSON.read('app/data/ERA_Tmean_cluster_sample.covjson')
    this.data.GCM_Tmean_countries = CovJSON.read('app/data/GCM_Tmean_countries_sample.covjson')
    
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
          
          if (timePeriodControl.mode === 'historic') {
            this.showCountryTestPlot(country_code, e.layer.getCenter())
          } else if (timePeriodControl.mode === 'climate-projections') {
            this.showCountryEnsembleTestPlot(country_code, e.layer.getCenter())
          } else {
            // not implemented
          }
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
          title: 'ERA Tmean for ' + country_code
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
  
  showCountryEnsembleTestPlot (country_code, latlng) {
    this.data.GCM_Tmean_countries
      .then(cov => cov.subsetByValue({country: country_code, t: {start: '1979', stop: '20000'}})) // TODO allow optional start/stop
      .then(cov => {
        new TimeSeriesPlot([cov, cov, cov], {
          keys: [['Tmean','Tmean05','Tmean95']],
          labels: ['Tmean', '5th percentile', '95th percentile'],
          className: 'timeseries-popup',
          maxWidth: 600,
          title: 'GCM Tmean ensemble for ' + country_code
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
          title: 'ERA Tmean for ' + cluster_code
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
}

new App()

