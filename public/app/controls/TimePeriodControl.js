import ButtonGroupControl from './ButtonGroupControl.js'
import TEMPLATE_TIMEPERIODCONTROL from '../templates/TimePeriodControlTemplate.js'

/**
 * A button group control for switching between different time periods,
 * currently Historic, Seasonal Forecasts, and Climate Projections.
 * 
 * Template: {@link TimePeriodControlTemplate}
 * 
 * @emits {ButtonGroupControl#add} after the control has been added to the map
 * @emits {ButtonGroupControl#change} when a different button is selected
 */
export default class TimePeriodControl extends ButtonGroupControl {
  /**
   * @param {string} [options.position='topleft'] The position of the control (one of the map corners).
   *    Possible values are 'topleft', 'topright', 'bottomleft' or 'bottomright'.
   * @param {string} [options.initialActive] If set, the name of the button that is initially active,
   *    one of `historic`, `seasonal-forecasts`, or `climate-projections`.
   */
  constructor (options={}) {
    options.template = TEMPLATE_TIMEPERIODCONTROL
    options.names = ['historic', 'seasonal-forecasts', 'climate-projections']
    options.classPrefix = '.btn-timeperiod-'
    options.position = options.position || 'topleft'
    super(options)
  }
}
