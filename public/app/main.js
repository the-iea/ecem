// polyfills
import 'core-js/es6'
import 'fetch'

// the main app
import App from './App.js'

let app = new App()

// exposes a debug API to the browser console
// Try that:
// api.map.setZoom(6)
// api.app.showCountryHistoricPlot('RO', 'T2M')
window.api = {
  map: app.map,
  app
}
