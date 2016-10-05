/**
 * The template for the {@link TimePeriodControl}.
 * @type {string}
 */
let TimePeriodControlTemplate =
`<div class="timeperiod-control buttongroup-control panel panel-default">
  <div class="panel-heading text-center">
    <h5>Time Period</h5>
  </div>
  
  <div class="btn-group-vertical" role="group">
    <button type="button" class="btn btn-ecem btn-timeperiod-historic">Historic</button>
    <button type="button" disabled class="btn btn-ecem btn-timeperiod-seasonal-forecasts">Seasonal Forecasts</button>
    <button type="button" class="btn btn-ecem btn-timeperiod-climate-projections">Climate Projections</button>
  </div>
</div>`

export default TimePeriodControlTemplate