import ButtonGroupControl from './ButtonGroupControl.js'
import TEMPLATE_TIMEPERIODCONTROL from '../templates/control.TimePeriod.js'

export default class TimePeriodControl extends ButtonGroupControl {
  constructor (options={}) {
    options.template = TEMPLATE_TIMEPERIODCONTROL
    options.names = ['historic', 'seasonal-forecasts', 'climate-projections']
    options.classPrefix = '.btn-timeperiod-'
    options.position = options.position || 'topleft'
    super(options)
  }
}
