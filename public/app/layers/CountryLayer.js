import L from 'leaflet'
import {darken} from './util.js'

export function loadCountryLayer (geojsonPath) {
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
  
  return fetch(geojsonPath)
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
