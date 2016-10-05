import L from 'leaflet'
import EventMixin from '../util/EventMixin.js'
import {HTMLone} from '../util/dom.js'

/**
 * The `change` event, signalling that the button has been pressed.
 * 
 * @typedef {Object} ClusterModeControl#change
 * @property {boolean} clusters The new clusters mode. True = 'Hide Clusters'.
 */

/**
 * A single button that switches its text between 'Hide Clusters' and 'Show Clusters' when clicked.
 * The initial button state is 'Show Clusters'.
 * 
 * @extends {L.Control}
 * @extends {EventMixin}
 * 
 * @emits {ClusterModeControl#change} when the button is clicked
 */
export default class ClusterModeControl extends EventMixin(L.Control) {
  /**
   * @param {boolean} [options.clusters=false] The initial button state, True = 'Hide Clusters'.
   * @param {string} [options.position='topleft'] The position of the control (one of the map corners).
   *    Possible values are 'topleft', 'topright', 'bottomleft' or 'bottomright'.
   */
  constructor (options={}) {
    options.position = options.position || 'topleft'
    super(options)

    /**
     * Current clusters mode. True = 'Hide Clusters'.
     * 
     * @type {boolean}
     */
    this.clusters = options.clusters || false
  }
  
  /**
   * Creates the {@link HTMLElement} of the control, registers listeners, and returns it.
   * This method is called directly by Leaflet, use {@link L.Control#addTo} instead.
   * 
   * @override
   * @returns {HTMLElement}
   */
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
