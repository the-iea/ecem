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
import * as i18n from 'covutils/lib/i18n.js'

import Countries from './data/countries.js'
import Clusters from './data/clusters.js'

import EventMixin from './EventMixin.js'
import TimeSeriesPlot from './TimeSeriesPlotHighcharts.js'
import {add, $, $$, HTMLone} from './dom.js'

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
    super(options.position ? {position: options.position} : {position: 'topleft'})
    this.callback = options.callback
    this.clusters = false
  }
  
  onAdd () {
    let html = cl => (cl ? 'Hide' : 'Show') + ' Clusters'
    let el = HTMLone('<button class="btn btn-ecem btn-cluster-mode">' + html(this.clusters) + '</button>')
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
    L.DomEvent.on(el, 'mousewheel', L.DomEvent.stopPropagation)
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
    
    this.on('change', ({mode}) => {
      let c = this.getContainer()
      let climate = $$('.climate-variables .btn-group-form-controls', c)
      let energy = $$('.energy-variables .btn-group-form-controls', c)
      if (mode === 'climate') {
        climate.style.display = ''
        energy.style.display = 'none'
      } else if (mode === 'energy') {
        climate.style.display = 'none'
        energy.style.display = ''
      }
    })
    
    this.on('add', () => {
      let c = this.getContainer()
      
      // by default, make climate active and hide energy
      let energy = $$('.energy-variables .btn-group-form-controls', c)
      energy.style.display = 'none'
        
      $('input[name="variable"]', c).forEach(input => input.addEventListener('click', () => {
        this.fire('paramchange', {paramKey: input.value})
      }))
    })
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
      }).addTo(map)
    
    let timePeriodControl = new TimePeriodControl({initialActive: 'historic'})
      .on('change', e => {
        console.log(e.mode)
      }).addTo(map)
      
    let variablesControl = new VariablesControl({initialActive: 'climate'})
      .on('paramchange', e => {
        console.log(e.paramKey)
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
  }
  
  showCountryTestPlot (country_code, latlng) {
    this.data.ERA_Tmean_countries
      .then(cov => cov.subsetByValue({country: country_code}))
      .then(cov => {
        new TimeSeriesPlot(cov, {
          className: 'timeseries-popup',
          maxWidth: 600,
          title: 'ERA T2M for ' + i18n.getLanguageString(Countries[country_code])
        }).setLatLng(latlng)
          .addTo(this.map)
      })
  }
  
  showCountryEnsembleTestPlot (country_code, latlng) {
    this.data.GCM_Tmean_countries
      .then(cov => {
        return cov.loadDomain()
          .then(domain => {
            let tVals = domain.axes.get('t').values
            let tMax = tVals[tVals.length - 1]
            return cov.subsetByValue({country: country_code, t: {start: '1979', stop: tMax}})
          })
          .then(cov => {
            new TimeSeriesPlot([cov, cov, cov], {
              keys: [['T2M','T2M05','T2M95']],
              labels: ['T2M', '5th percentile', '95th percentile'],
              className: 'timeseries-popup',
              maxWidth: 600,
              title: 'GCM T2M ensemble for ' + i18n.getLanguageString(Countries[country_code])
            }).setLatLng(latlng)
              .addTo(this.map)
          })
      })
  }
  
  showClusterTestPlot (cluster_code, latlng) {
    this.data.ERA_Tmean_cluster
      .then(cov => cov.subsetByValue({cluster: cluster_code}))
      .then(cov => {
        let country_code = Clusters[cluster_code]
        new TimeSeriesPlot(cov, {
          className: 'timeseries-popup',
          maxWidth: 600,
          title: 'ERA T2M for ' + cluster_code + ' (' + i18n.getLanguageString(Countries[country_code]) + ')'
        }).setLatLng(latlng)
          .addTo(this.map)
      })
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

new App()

