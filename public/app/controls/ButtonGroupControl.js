import L from 'leaflet'
import EventMixin from '../util/EventMixin.js'
import {$$, HTMLone} from '../util/dom.js'

/**
 * The `add` event, signalling that the control has been added to the map.
 * 
 * @typedef {Object} ButtonGroupControl#add
 */

/**
 * The `change` event, signalling that a different button has been pressed.
 * 
 * @typedef {Object} ButtonGroupControl#change
 * @property {string} name The button name.
 */

/**
 * Abstract control.
 * 
 * See {@link TimePeriodControl} and {@link VariablesControl} for concrete implementations.
 * 
 * @extends {L.Control}
 * @extends {EventMixin}
 * 
 * @emits {ButtonGroupControl#add} after the control has been added to the map
 * @emits {ButtonGroupControl#change} when a different button is selected
 */
export default class ButtonGroupControl extends EventMixin(L.Control) {
  /**
   * @param {string} [options.position='topleft'] The position of the control (one of the map corners).
   *    Possible values are 'topleft', 'topright', 'bottomleft' or 'bottomright'.
   * @param {string} [options.initialActive] If set, the name of the button that is initially active/pressed.
   * @param {string} options.template The HTML template to use.
   * @param {string} options.classPrefix The CSS class prefix of the button elements.
   * @param {Array<string>} options.names The button names, used as CSS class suffix and in events.
   */
  constructor (options={}) {
    options.position = options.position || 'topleft'
    super(options)
    this.on('add', () => {
      if (this.options.initialActive) {
        this._setActive(this.options.initialActive)
      }
    })
  }
  
  /**
   * Creates the {@link HTMLElement} of the control, registers listeners, and returns it.
   * This method is called directly by Leaflet, use {@link ButtonGroupControl#addTo} instead.
   * 
   * @override
   * @returns {HTMLElement}
   */
  onAdd () {
    let el = HTMLone(this.options.template)
    L.DomEvent.disableClickPropagation(el)
    L.DomEvent.on(el, 'mousewheel', L.DomEvent.stopPropagation)
    for (let name of this.options.names) {
      $$(this.options.classPrefix + name, el).addEventListener('click', () => {
        this._setActive(name)
        this.fire('change', {name})
      })
    }
    return el
  }
  
  /**
   * Adds the control to the given map.
   * 
   * @override
   * @param {L.Map} map The map this control should be added to.
   */
  addTo (map) {
    super.addTo(map)
    this.fire('add')
    return this
  }
  
  _setActive (nameToActivate) {
    /** 
     * The name of the currently active button.
     * 
     * @type {string}
     */
    this.name = nameToActivate

    let c = this.getContainer()

    for (let name of this.options.names) {
      $$(this.options.classPrefix + name, c).classList.remove('active')
    }
    $$(this.options.classPrefix + nameToActivate, c).classList.add('active')
  }
}
