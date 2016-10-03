import L from 'leaflet'
import EventMixin from '../EventMixin.js'
import {HTMLone} from '../dom.js'

export default class ClusterModeControl extends EventMixin(L.Control) {
  constructor (options={}) {
    super(options.position ? {position: options.position} : {position: 'topleft'})
    this.callback = options.callback
    this.clusters = false
  }
  
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