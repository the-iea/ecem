// Copied from leaflet-coverage (currently compatible to Leaflet 0.7 only)

import L from 'leaflet'
import c3 from 'c3'
import './c3CullingMax.js'

import * as CovUtils from 'covutils'

// TODO DRY: nearly identical to VerticalProfilePlot

/**
 * Displays a popup with an interactive plot showing the data
 * of a time series coverage (all axes fixed except time).
 * 
 * Examples are VerticalProfile or PointSeries coverages.
 * 
 * @example
 * layer.bindPopup(new TimeSeriesPlot(coverage))
 * 
 * @example <caption>Non-module access</caption>
 * L.coverage.popup.TimeSeriesPlot
 * 
 * @extends {L.Popup}
 */
export default class TimeSeriesPlotC3 extends L.Popup {
  
  /**
   * Creates a time series plot popup.
   * 
   * @param {Coverage|Array<Coverage>} coverage The time series coverage to visualize.
   *   If an array of time series coverages is given, then the reference systems
   *   are assumed to be identical.
   * @param {object} [options] Popup options. See also http://leafletjs.com/reference.html#popup-options.
   * @param {Array|Array<Array>} [options.keys] The parameters to display.
   *   For a single coverage, an array of parameter keys, each parameter is accessible in a drop down.
   *   The default for a single coverage is to display all parameters.
   *   For multiple coverages, an array of parameter key groups, each group is accessible in a drop down.
   *   Each group array is ordered as the coverage array and determines which parameter of each coverage
   *   is displayed in a single plot. In each group, at least one item must be defined.
   *   The default for multiple coverages is to display all parameters and treat each one as a separate group.
   * @param {string} [options.language] A language tag, indicating the preferred language to use for labels.
   * @param {string} [options.precision=4] The number of significant digits to display.
   */
  constructor (coverage, options = {}) {
    options.maxWidth = options.maxWidth || 350
    super(options)
    this._covs = Array.isArray(coverage) ? coverage : [coverage]
    this._language = options.language
    this._precision = options.precision || 4
    
    this._labels = options.labels ? options.labels : new Array(this._covs.length)
    
    let keyGroups = []
    if (!options.keys) {
      // treat all parameters of all coverages as separate
      for (let i=0; i < this._covs.length; i++) {
        for (let key of this._covs[i].parameters.keys()) {
          let group = new Array(this._covs.length)
          group[i] = key
          keyGroups.push(group)
        }        
      }
    } else if (!Array.isArray(options.keys[0])) {
      // short-cut for a single coverage, acts as parameter selector
      keyGroups = options.keys.map(key => [key])
    } else {
      // user defines which parameters to display and how to group them
      keyGroups = options.keys
    }
    
    // filter out groups which only contain null/undefined keys
    keyGroups = keyGroups.filter(group => !group.every(key => !key))
    
    if (keyGroups.some(group => group.length !== this._covs.length)) {
      throw new Error('Length of each parameter group must match number of coverages')
    }
    
    // 2D array of parameter key groups, where each inner array is ordered like the coverages array
    this._paramKeyGroups = keyGroups
    
    // Map from coverage to param keys
    this._paramKeys = new Map()
    for (let i=0; i < this._covs.length; i++) {
      let keys = this._paramKeyGroups.map(group => group[i]).filter(key => key)
      this._paramKeys.set(this._covs[i], keys)
    }
  }
  
  /**
   * @ignore
   */
  onAdd (map) {
    super.onAdd(map)
    map.fire('dataloading')
    let domainPromise = Promise.all(this._covs.map(cov => cov.loadDomain()))
    let rangePromise = Promise.all(this._covs.map(cov => cov.loadRanges(this._paramKeys.get(cov))))
    Promise.all([domainPromise, rangePromise]).then(([domains, ranges]) => {
      this._domains = domains
      this._ranges = ranges
      this._addPlotToPopup()
      //this.fire('add')
      map.fire('dataload')
    }).catch(e => {
      console.error(e)
      this.fire('error', e)
      map.fire('dataload')
    })
  }
  
  _addPlotToPopup () {
    // TODO transform if necessary
    if (!this.getLatLng()) {
      // in case bindPopup is not used and the caller did not set a position
      let x = this._domains[0].axes.get('x')
      let y = this._domains[0].axes.get('y')
      this.setLatLng(L.latLng(y.values[0], x.values[0]))
    }
    
    // display first parameter group
    let paramKeyGroup = this._paramKeyGroups[0]    
    let plot = this._getPlotElement(paramKeyGroup)
    
    let el = document.createElement('div')
    
    // display dropdown if multiple parameter groups
    if (this._paramKeyGroups.length > 1) {
      let select = document.createElement('select')
      
      for (let [paramKeyGroup,i] of this._paramKeyGroups.map((v,i) => [v,i])) {
        let refParam = this._getRefParam(paramKeyGroup)
        let option = document.createElement('option')
        option.value = i
        option.text = CovUtils.getLanguageString(refParam.observedProperty.label, this._language)
        select.appendChild(option)
      }
      
      select.addEventListener('change', () => {
        el.removeChild(plot)
        let group = this._paramKeyGroups[parseInt(select.value)]
        plot = this._getPlotElement(group)
        el.appendChild(plot)
      })
      
      el.appendChild(select)
    }
    
    el.appendChild(plot)
    this.setContent(el)
  }
  
  _getRefParam (paramKeyGroup) {
    // use first defined parameter as representative for the group
    let covsWithParamKey = zip(this._covs, paramKeyGroup)
    let [refCov, refParamKey] = covsWithParamKey.filter(([,key]) => key)[0]
    let refParam = refCov.parameters.get(refParamKey)
    return refParam
  }
  
  // TODO move this into a reusable unit-formatting module
  // TODO code duplication with ContinuousLegend
  _getUnitString (param, language) {
    if (!param.unit) {
      return ''
    }
    if (param.unit.symbol) {
      let unit = param.unit.symbol.value || param.unit.symbol
      let scheme = param.unit.symbol.type
      if (scheme === 'http://www.opengis.net/def/uom/UCUM/') {
        if (unit === 'Cel') {
          unit = '°C'
        } else if (unit === '1') {
          unit = ''
        }
      }
      return unit
    } else {
      return CovUtils.getLanguageString(param.unit.label, language)
    }
  }
  
  _getPlotElement (paramKeyGroup) {    
    let refDomain = this._domains[0]
    let covsWithParamKey = zip(this._covs, paramKeyGroup)
    
    let refParam = this._getRefParam(paramKeyGroup)
    
    // axis labels
    let xLabel = 'Time'
    
    let unit = this._getUnitString(refParam, this._language)
    let obsPropLabel = CovUtils.getLanguageString(refParam.observedProperty.label, this._language)
    
    // http://c3js.org/samples/simple_xy_multiple.html
    
    // axis values
    let xs = {}
    let columns = []
    let names = {}
    
    let tMin = Infinity
    let tMax = -Infinity
        
    for (let i=0; i < this._covs.length; i++) {
      let paramKey = covsWithParamKey[i][1]
      if (!paramKey) {
        continue
      }
      
      let xname = 'x' + i
      let yname = refParam.key + i

      names[yname] = this._labels[i] ? this._labels[i] : obsPropLabel
      
      xs[yname] = xname
      
      let tVals = this._domains[i].axes.get('t').values
      let vals = this._ranges[i].get(paramKey)
      let x = [xname]
      let y = [yname]
      for (let j=0; j < tVals.length; j++) {
        let val = vals.get({t: j})
        if (val === null) {
          continue
        }
        let t = new Date(tVals[j])
        x.push(t)
        y.push(val)
        tMin = Math.min(tMin, t.getTime())
        tMax = Math.max(tMax, t.getTime())
      }
      
      columns.push(x)
      columns.push(y)
    }
    
    
    let el = document.createElement('div')
    var chart = c3.generate({
      bindto: el,
      data: {
        xs,
        columns,
        names
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: this.options.timeFormat
          },
          label: {
            text: xLabel,
            position: 'outer-center'
          }
        },
        y: {
          tick: {
            count: 7,
            format: x => x.toPrecision(this._precision)
          },
          label: {
            text: obsPropLabel + (unit ? ' (' + unit + ')' : ''),
            position: 'outer-middle'
          }
        }
      },
      grid: {
        x: {
            show: true
        },
        y: {
            show: true
        }
      },
      legend: {
        show: this._covs.length > 1 ? true : false
      },
      tooltip: {
        format: {
          value: (value, ratio, id) => value.toPrecision(this._precision) + ' ' + unit
        }
      },
      zoom: {
        enabled: true,
        rescale: true,
        onzoomend: domain => {
          let cullingMaxFoV = 10 // same as default value if unzoomed
          let totalTime = tMax - tMin
          let zoomTime = domain[1] - domain[0]
          let totalLabels = Math.round((totalTime * cullingMaxFoV) / zoomTime)
          // FIXME zoom-out doesn't work if this is called
          chart.axis.cullingMax(totalLabels)
        }
      },
      size: {
        height: 300,
        width: this.options.maxWidth
      }
    })
    
    return el
  }
}

function zip (a, b) {
  return a.map((e, i) => [a[i], b[i]])
} 
