import L from 'leaflet'
import Modal from 'bootstrap-native/lib/modal-native.js'
import Dropdown from 'bootstrap-native/lib/dropdown-native.js'
import {$$, HTMLone} from '../dom.js'
import TEMPLATE_HELPCONTROL from '../templates/control.Help.js'

/**
 * Not a real leaflet control, but rather has to be added to the #map element.
 */
export default class HelpControl extends L.Class { 
  createElement () {
    let el = HTMLone(TEMPLATE_HELPCONTROL)
    L.DomEvent.disableClickPropagation(el)
    
    new Dropdown($$('.help-dropdown .dropdown-toggle', el))
    
    for (let name of ['usage', 'methods', 'results', 'casestudies']) {
      for (let menuEl of [$$('.btn-help-' + name, el), $$('.dropdown-help-' + name, el)]) {
        menuEl.addEventListener('click', () => {
          let uc = name.charAt(0).toUpperCase() + name.slice(1)
          new Modal($$('#help' + uc + 'Modal')).open()
        })
      }
    }
    return el
  }
}