import L from 'leaflet'
import EventMixin from '../EventMixin.js'
import {$$, HTMLone} from '../dom.js'

/**
 * Abstract control.
 * See TimePeriodControl and VariableControl for concrete implementations.
 */
export default class ButtonGroupControl extends EventMixin(L.Control) {
  /**
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
    // TODO don't manipulate style directly, should happen in CSS class
    el.style.fontWeight = 'bold'
    L.DomUtil.addClass(el, 'active')
    for (let name of this.options.names.filter(n => n !== nameToActivate)) {
      let el = $$(this.options.classPrefix + name, c)
      el.style.fontWeight = 'initial'
      L.DomUtil.removeClass(el, 'active')
    }
  }
}
