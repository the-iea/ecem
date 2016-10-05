import ButtonGroupControl from './ButtonGroupControl.js'
import TEMPLATE_VARIABLESCONTROL from '../templates/VariablesControlTemplate.js'
import {$, $$} from '../util/dom.js'

/**
 * The `add` event, signalling that the control has been added to the map.
 * 
 * @typedef {Object} VariablesControl#paramchange
 * @property {string} paramKey The name of the selected variable.
 */

/**
 * A button group control for switching between different climate/energy variable dropdowns
 * and selecting a specific variable using radio buttons.
 * 
 * Note that the dropdowns are an extension to the ButtonGroupControl class.
 * 
 * Template: {@link VariablesControlTemplate}
 * 
 * @emits {ButtonGroupControl#add} after the control has been added to the map
 * @emits {ButtonGroupControl#change} when a different button is selected
 * @emits {VariablesControl#variablechange} when a different variable is selected
 */
export default class VariablesControl extends ButtonGroupControl {

  /**
   * @param {string} [options.position='topleft'] The position of the control (one of the map corners).
   *    Possible values are 'topleft', 'topright', 'bottomleft' or 'bottomright'.
   * @param {string} [options.initialActive] If set, the name of the button that is initially active,
   *    either `climate` or `energy`.
   * @param {string} [options.initialVariable='T2M'] If set, the name of the variable that is initially selected,
   *    see template for possible values.
   */
  constructor (options={}) {
    options.template = TEMPLATE_VARIABLESCONTROL
    options.names = ['energy', 'climate']
    options.classPrefix = '.btn-variables-'
    options.position = options.position || 'topleft'
    options.initialVariable = options.initialVariable || 'T2M'
    super(options)
    
    /**
     * The currently selected variable.
     * @type {string}
     */
    this.variable = options.initialVariable
    
    this.on('change', ({name}) => {
      let c = this.getContainer()

      // collapse all dropdowns
      $('.btn-group-form-controls', c).forEach(el => el.style.display = 'none')

      // expand the selected dropdown
      $$('.' + name + '-variables .btn-group-form-controls', c).style.display = ''
    })
    
    this.on('add', () => {
      let c = this.getContainer()

      // select initial variable if specified
      if (this.options.initialVariable) {
        let radio = $$('input[name="variable"][value="' + this.options.initialVariable + '"]', c)
        radio.checked = true
      }
        
      // register event listeners for variables
      $('input[name="variable"]', c).forEach(input => input.addEventListener('click', () => {
        this.variable = input.value
        this.fire('variablechange', {variable: input.value})
      }))

      // show initial dropdown
      if (this.options.initialActive) {
        this.fire('change', {name: this.options.initialActive})
      }
    })
  }
}
