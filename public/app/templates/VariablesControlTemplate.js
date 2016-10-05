/**
 * The template for the {@link VariablesControl}.
 * @type {string}
 */
let VariablesControlTemplate =
`<div class="variables-control buttongroup-control panel panel-default">
  <div class="panel-heading text-center">
    <h5>Variables</h5>
  </div>
  
  <div class="btn-group-vertical climate-variables" role="group">
    <button type="button" class="btn btn-ecem btn-variables-climate">Climate</button>
    <div class="btn-group-form-controls">
      <div class="radio">
        <label><input type="radio" name="variable" value="T2M"> Air temperature at 2m</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="P"> Precipitation</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="SSRD"> Surface Solar Radiation</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="SH"> Sunshine hours</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="WS10"> Wind Speed at 10m</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="RH"> Relative humidity</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="RD"> River discharge</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="WT"> Water temperature</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="CC"> Cloud cover</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="SC"> Snow cover</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="SWE"> Snow Water equivalent</label>
      </div>
    </div>
  </div>
  <div class="btn-group-vertical energy-variables" role="group">
    <button type="button" class="btn btn-ecem btn-variables-energy">Energy</button>
    <div class="btn-group-form-controls">
      <div class="radio">
        <label><input type="radio" name="variable" value="???"> Demand</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="???"> Thermal</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="???"> Hydro</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="???"> Wind</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="???"> Solar (PV only)</label>
      </div>
      <div class="radio">
        <label><input type="radio" name="variable" value="???"> Bio</label>
      </div>
    </div>
  </div>
</div>`

export default VariablesControlTemplate
