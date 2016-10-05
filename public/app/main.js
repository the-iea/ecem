// polyfills
import 'core-js/es6'
import 'fetch'

// the main app
import App from './App.js'

let app = new App()

window.api = {
  map: app.map
}
