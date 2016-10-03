import L from 'leaflet'
import EventMixin from '../EventMixin.js'
import {$$, HTMLone} from '../dom.js'

/**
 * A little info icon control which when clicked fires a `click` event.
 */
export default class InfoSignControl extends EventMixin(L.Control) {
  constructor (options={}) {
    super(options.position ? {position: options.position} : {position: 'bottomright'})
  }
  
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