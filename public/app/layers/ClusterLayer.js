import L from 'leaflet'
import {darken} from './util.js'

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

export function loadClusterLayer (geojsonPath) {
  return fetch(geojsonPath)
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
