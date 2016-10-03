import ButtonGroupControl from './ButtonGroupControl.js'
import TEMPLATE_VARIABLESCONTROL from '../templates/control.Variables.js'
import {$, $$} from '../dom.js'

export default class VariablesControl extends ButtonGroupControl {
  constructor (options={}) {
    options.template = TEMPLATE_VARIABLESCONTROL
    options.names = ['energy', 'climate']
    options.classPrefix = '.btn-variables-'
    options.position = options.position || 'topleft'
    super(options)
    
    // checked by default (see also template)
    this.paramKey = 'T2M'
    
    this.on('change', ({mode}) => {
      let c = this.getContainer()
      let climate = $$('.climate-variables .btn-group-form-controls', c)
      let energy = $$('.energy-variables .btn-group-form-controls', c)
      if (mode === 'climate') {
        climate.style.display = ''
        energy.style.display = 'none'
      } else if (mode === 'energy') {
        climate.style.display = 'none'
        energy.style.display = ''
      }
    })
    
    this.on('add', () => {
      let c = this.getContainer()
      
      // by default, make climate active and hide energy
      let energy = $$('.energy-variables .btn-group-form-controls', c)
      energy.style.display = 'none'
        
      $('input[name="variable"]', c).forEach(input => input.addEventListener('click', () => {
        this.paramKey = input.value
        this.fire('paramchange', {paramKey: input.value})
      }))
    })
  }
}
