import L from 'leaflet'
import {darken} from './util.js'

/**
 * Mapping from cluster colour indices to hex colour strings.
 * The special key 99 is used when no colour index is specified.
 */
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

/**
 * Returns an object containing path style options for the cluster polygon matching the given GeoJSON feature.
 * 
 * @see http://leafletjs.com/reference-1.0.0.html#path-option
 */
function getClusterStyle (feature) {
  return {
    color: 'black',
    weight: 0.5,
    opacity: 1,
    fillOpacity: 1,
    fillColor: CLUSTER_COLOURS[parseInt(feature.properties.color_idx)] || CLUSTER_COLOURS[99]
  }
}

/**
 * Returns an object containing path style options for the cluster polygon matching the given GeoJSON feature when highlighted.
 * 
 * @see http://leafletjs.com/reference-1.0.0.html#path-option
 */
function getHighlightedClusterStyle (feature) {
  let style = getClusterStyle(feature)
  style.fillColor = darken(style.fillColor, 0.1)
  return style
}


/**
 * Returns a Leaflet marker containing the cluster code label for the given cluster feature layer.
 * 
 * Note that this function can only be called once the given feature layer was added to a map.
 * 
 * @param {L.Layer} The GeoJSON feature layer corresponding to a cluster.
 * @returns {L.Marker}
 */
function getClusterLabelMarker (featureLayer) {
  // Note that getCenter() can only be called after the layer has been added to a map
  return L.marker(featureLayer.getCenter(), {
    interactive: false,
    icon: L.divIcon({
      className: 'polygon-label',
      // a standard Bootstrap label
      html: '<h5><span class="label label-default">' + featureLayer.feature.properties.cluster_code + '</span></h5>'
    })
  })
}

/**
 * Loads the given GeoJSON URL and returns a Leaflet GeoJSON layer that contains a child layer for each cluster.
 * 
 * Each cluster layer has an associated cluster label layer which is not part of the returned GeoJSON layer.
 * Once the GeoJSON layer is added to a map, then the label layers are added to the same map as well,
 * and removed again once the GeoJSON layer is removed.
 * It is currently not possible to easily access the label layers programmatically after this function returns.
 * 
 * @param {string} geojsonPath The GeoJSON URL to load.
 * @returns {L.GeoJSON} The GeoJSON layer with all the clusters in it.
 */
export function loadClusterLayer (geojsonPath) {
  return fetch(geojsonPath)
    .then(response => response.json())
    .then(clusters => {
      // the cluster polygons
      let layer = L.geoJson(clusters, {
        style: getClusterStyle,
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', () => layer.setStyle(getHighlightedClusterStyle(feature)))
          layer.on('mouseout', () => layer.setStyle(getClusterStyle(feature)))
        }
      }).on('add', () => {
        // setting zindex is not supported for vector layers
        layer.bringToBack()
      })
      
      // the cluster labels
      let markers      
      layer.on('add', () => {
        if (!markers) {
          markers = layer.getLayers().map(getClusterLabelMarker)
        }
        // TODO is there a proper way to access the map instance? (_map is internal)
        markers.forEach(l => l.addTo(layer._map))
      }).on('remove', () =>
        markers.forEach(l => l.remove())
      )
      
      return layer
  })
}
