import L from 'leaflet'
import Modal from 'bootstrap-native/lib/modal-native.js'
import Dropdown from 'bootstrap-native/lib/dropdown-native.js'
import {$, $$, HTMLone} from '../util/dom.js'
import TEMPLATE_HELPCONTROL from '../templates/HelpControlTemplate.js'

/**
 * A help bar with several buttons which open popup modals when clicked.
 * 
 * Note that this is not a Leaflet control, but rather simply has to be added to a Leaflet map HTMLElement.
 * 
 * Template: {@link HelpControlTemplate}
 */
export default class HelpControl {
  /**
   * Creates the help control and returns the HTML element that has to be added to a Leaflet map HTML element.
   * 
   * @returns {HTMLElement}
   */
  static createElement () {
    let el = HTMLone(TEMPLATE_HELPCONTROL)
    L.DomEvent.disableClickPropagation(el)
    
    new Dropdown($$('.help-dropdown .dropdown-toggle', el))

    for (let menuEl of $('[data-modal]', el)) {
      menuEl.addEventListener('click', () => {
        new Modal($$('#' + menuEl.dataset.modal)).open()
      })
    }

    return el
  }
}