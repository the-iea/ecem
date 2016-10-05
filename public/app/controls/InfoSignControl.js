import L from 'leaflet'
import EventMixin from '../util/EventMixin.js'
import {$$, HTMLone} from '../util/dom.js'

/**
 * The `click` event, signalling that the icon has been clicked.
 * 
 * @typedef {Object} InfoSignControl#click
 */

/**
 * A little info icon control which when clicked fires a `click` event.
 * 
 * @extends {L.Control}
 * @extends {EventMixin}
 * 
 * @emits {InfoSignControl#click} when the icon has been clicked
 */
export default class InfoSignControl extends EventMixin(L.Control) {
  /**
   * @param {string} [options.position='bottomright'] The position of the control (one of the map corners).
   *    Possible values are 'topleft', 'topright', 'bottomleft' or 'bottomright'.
   */
  constructor (options={}) {
    super(options.position ? {position: options.position} : {position: 'bottomright'})
  }
  
  /**
   * Creates the {@link HTMLElement} of the control, registers listeners, and returns it.
   * This method is called directly by Leaflet, use {@link L.Control#addTo} instead.
   * 
   * @override
   * @returns {HTMLElement}
   */
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