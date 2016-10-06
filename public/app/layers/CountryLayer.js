import L from 'leaflet'
import {darken} from './util.js'

/**
 * Returns an object containing path style options for the country polygon matching the given GeoJSON feature.
 * Currently, the path options are static and do not depend on the country.
 * 
 * @see http://leafletjs.com/reference-1.0.0.html#path-option
 * 
 * @param {boolean} [fill=true] Whether to fill the polygon, by default true.
 */
function getCountryStyle (feature, fill=true) {
  return {
    color: 'black',
    weight: 2,
    opacity: 1,
    fill,
    fillOpacity: 1,
    fillColor: '#ADD8E6'
  }
}

/**
 * Returns an object containing path style options for the country polygon matching the given GeoJSON feature when highlighted.
 * Currently, the path options are static and do not depend on the country.
 * 
 * @see http://leafletjs.com/reference-1.0.0.html#path-option
 * 
 * @param {boolean} [fill=true] Whether to fill the polygon, by default true.
 */
function getHighlightedCountryStyle (feature, fill=true) {
  let style = getCountryStyle(feature, fill)
  style.fillColor = darken(style.fillColor, 0.1)
  return style
}

/**
 * Returns a Leaflet marker containing the country code label for the given country feature layer.
 * 
 * Note that this function can only be called once the given feature layer was added to a map.
 * 
 * @param {L.Layer} The GeoJSON feature layer corresponding to a country.
 * @returns {L.Marker}
 */
function getCountryLabelMarker (featureLayer) {
  // Note that getCenter() can only be called after the layer has been added to a map
  let code = featureLayer.feature.properties.country_code
  // AT has weird centroid position, use bbox center instead
  let pos = code === 'AT' ? featureLayer.getBounds().getCenter() : featureLayer.getCenter()
  return L.marker(pos, {
    interactive: false,
    icon: L.divIcon({
      className: 'polygon-label',
      // a standard Bootstrap label
      html: '<h5><span class="label label-default">' + code + '</span></h5>'
    })
  })
}

/**
 * Loads the given GeoJSON URL and returns a Leaflet GeoJSON layer that contains a child layer for each country.
 * 
 * Each country layer has an associated country label layer which is not part of the returned GeoJSON layer.
 * Once the GeoJSON layer is added to a map, then the label layers are added to the same map as well,
 * and removed again once the GeoJSON layer is removed.
 * It is currently not possible to easily access the label layers programmatically after this function returns.
 * 
 * The returned GeoJSON layer listens for the following custom events:
 * - `fill`/`nofill` - when received, enables/disables polygon filling
 * - `showmarkers`/`hidemarkers` - when received, adds/removes all country labels
 * 
 * @param {string} geojsonPath The GeoJSON URL to load.
 * @returns {L.GeoJSON} The GeoJSON layer with all the countries in it.
 */
export function loadCountryLayer (geojsonPath) {    
  return fetch(geojsonPath)
    .then(response => response.json())
    .then(countries => {
      // the country polygons
      let fill = true
      let layer = L.geoJson(countries, {
        style: feature => getCountryStyle(feature),
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', () => layer.setStyle(getHighlightedCountryStyle(feature, fill)))
          layer.on('mouseout', () => layer.setStyle(getCountryStyle(feature, fill)))
        }
      }).on('add', () => {
        // setting zindex is not supported for vector layers
        layer.bringToFront()
      })
      
      // The below allows to control polygon filling by sending a `fill`/`nofill` event to the country layer.
      // This is needed when clusters are displayed. Then the countries are just shown as outlines.
      // The logic for that is in the {@link App} class.
      layer.on('fill', () => {
        fill = true
        layer.setStyle({fill})
      }).on('nofill', () => {
        fill = false
        layer.setStyle({fill})
      })

      // the country labels
      let markers
      layer.on('add showmarkers', () => {
        if (!markers) {
          markers = layer.getLayers().map(getCountryLabelMarker)
        }
        // TODO is there a proper way to access the map instance? (_map is internal)
        markers.forEach(l => l.addTo(layer._map))
      }).on('remove hidemarkers', () => {
        markers.forEach(l => l.remove())
      })
      
      return layer
  })
}
