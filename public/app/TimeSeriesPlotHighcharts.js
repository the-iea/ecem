// adapted from leaflet-coverage (currently compatible to Leaflet 0.7 only)

import concatMap from 'concat-map'
import L from 'leaflet'
import download from 'download'
import Highcharts from 'highcharts'
import HighchartsNoData from 'highcharts/modules/no-data-to-display'
import HighchartsExporting from 'highcharts/modules/exporting'
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting'
HighchartsNoData(Highcharts)
HighchartsExporting(Highcharts)
HighchartsOfflineExporting(Highcharts)

import * as i18n from 'covutils/lib/i18n.js'
import * as units from 'covutils/lib/unit.js'

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
 */
export default class TimeSeriesPlot extends L.Popup {
  
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
    options.height = options.height || 300
    options.spacing = options.spacing || [5, 5, 10, 5]
    super(options)
    this._covs = Array.isArray(coverage) ? coverage : [coverage]
    this._language = options.language
    this._precision = options.precision || 4
    this._title = options.title
    this._timeFormat = "%b '%y"
    
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
    
    // list of param keys for each coverage
    this._paramKeys = []
    for (let i=0; i < this._covs.length; i++) {
      let keys = this._paramKeyGroups.map(group => group[i]).filter(key => key)
      this._paramKeys.push(keys)
    }
  }
  
  /**
   * @ignore
   */
  onAdd (map) {    
    super.onAdd(map)
    map.fire('dataloading')
    let domainPromise = Promise.all(this._covs.map(cov => cov.loadDomain()))
    let unknownParams = concatMap(this._covs, (cov,i) => this._paramKeys[i].filter(key => !cov.parameters.has(key)))
    let rangePromise
    if (unknownParams.length === 0) {
      rangePromise = Promise.all(this._covs.map((cov,i) => cov.loadRanges(this._paramKeys[i])))
    }
    
    domainPromise.then(domains => {
      this._domains = domains
      
      if (unknownParams.length > 0) {
        throw new Error('Data not available for ' + unknownParams.join(', '))
      }
      
      return rangePromise.then(ranges => {
        this._ranges = ranges
        this._addPlotToPopup()
        //this.fire('add')
        map.fire('dataload')
      })
    }).catch(e => {
      console.error(e)
      this._addEmptyPlotToPopup(e.message)
      this.fire('error', e)
      map.fire('dataload')
    })
  }
  
  _addEmptyPlotToPopup (reason) {
    this._setPositionFromDomainIfMissing()
    
    let el = document.createElement('div')
    Highcharts.chart(el, {
      lang: {
        noData: reason
      },
      chart: {
        width: this.options.maxWidth,
        height: this.options.height,
        spacing: this.options.spacing
      },
      credits: {
        enabled: false
      },
      title: {
        text: this._title
      },
      exporting: {
        enabled: false
      }
    })
    
    this.setContent(el)
  }
  
  _setPositionFromDomainIfMissing () {
    // TODO transform if necessary
    if (!this.getLatLng() && this._domains) {
      // in case bindPopup is not used and the caller did not set a position
      let x = this._domains[0].axes.get('x')
      let y = this._domains[0].axes.get('y')
      this.setLatLng(L.latLng(y.values[0], x.values[0]))
    }
  }
  
  _addPlotToPopup () {
    this._setPositionFromDomainIfMissing()
    
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
        option.text = i18n.getLanguageString(refParam.observedProperty.label, this._language)
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
  
  _getPlotElement (paramKeyGroup) {    
    let refDomain = this._domains[0]
    let covsWithParamKey = zip(this._covs, paramKeyGroup)
    
    let refParam = this._getRefParam(paramKeyGroup)
    
    // axis labels
    let xLabel = 'Time'
    
    let unit = units.toAscii(refParam.unit, this._language)
    let obsPropLabel = i18n.getLanguageString(refParam.observedProperty.label, this._language)
    
    // http://www.highcharts.com/demo/spline-irregular-time
    
    let series = []
    
    let getLabel = i => this._labels[i] ? this._labels[i] : obsPropLabel
            
    for (let i=0; i < this._covs.length; i++) {
      let paramKey = covsWithParamKey[i][1]
      if (!paramKey) {
        continue
      }
      
      let tVals = this._domains[i].axes.get('t').values
      let vals = this._ranges[i].get(paramKey)
      let data = []
      for (let j=0; j < tVals.length; j++) {
        let val = vals.get({t: j})
        if (val === null) {
          continue
        }
        let t = new Date(tVals[j]).getTime()
        data.push([t, val])
      }
      
      series.push({
        name: getLabel(i),
        data
      })
    }
    
    
    let el = document.createElement('div')
    Highcharts.chart(el, {
      chart: {
        type: 'line',
        width: this.options.maxWidth,
        height: this.options.height,
        panning: true,
        panKey: 'shift',
        zoomType: 'x',
        spacing: this.options.spacing
      },
      credits: {
        enabled: false
      },
      exporting: {
        buttons: {
          contextButton: {
            menuItems: [{
              text: 'Export to PNG',
              onclick: function () {
                this.exportChartLocal({type: 'image/png'})
              }
            }, {
              text: 'Export to SVG',
              onclick: function () {
                this.exportChartLocal({type: 'image/svg+xml'})
              }
            }, {
              separator: true
            }, {
              text: 'Export to CSV',
              onclick: () => {
                // we assume that all coverages share the same t axis
                // TODO check this and otherwise don't offer CSV export
                let rows = [[xLabel].concat(series.map(s => s.name))]
                let tVals = this._domains[0].axes.get('t').values
                for (let i=0; i < tVals.length; i++) {
                  rows.push([tVals[i]].concat(series.map(s => s.data[i][1])))
                }
                let csv = rows.join('\r\n').toString()
                download(csv, this._title + '.csv', 'text/csv')
              }
            }]
          }
        }
      },
      title: {
        text: this._title
      },
      xAxis: {
        type: 'datetime',
        title: {
          text: xLabel
        },
        gridLineWidth: 1
      },
      yAxis: {
        title: {
          text: obsPropLabel + (unit ? ' (' + unit + ')' : '')
        },

      },
      legend: {
        enabled: this._covs.length > 1 ? true : false
      },
      tooltip: {
        shared: true,
        valueSuffix: ' ' + unit
      },  
      plotOptions: {
        series: {
          marker: {
            symbol: 'circle',
            radius: 3
          }
        }
      },
      series
    })
    
    return el
  }
}

function zip (a, b) {
  return a.map((e, i) => [a[i], b[i]])
} 
