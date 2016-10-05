/**
 * The template for the {@link HelpControl}.
 * Note that the modal popups are in the {@link IndexTemplate}.
 * 
 * @type {string}
 */
let HelpControlTemplate =
`<div class="help-container">
  <div class="panel help-control ecem">
    <button type="button" class="btn btn-default btn-help-usage" data-modal="helpUsageModal">Using the <br> demonstrator</button>
    <button type="button" class="btn btn-default btn-help-methods" data-modal="helpMethodsModal">Methods &amp; <br> assumptions</button>
    <button type="button" class="btn btn-default btn-help-results" data-modal="helpResultsModal">Key messages &amp; <br> pre-prepared graphics</button>
    <button type="button" class="btn btn-default btn-help-casestudies" data-modal="helpCasestudiesModal">Case studies</button>
  </div>
  <div class="btn-group dropup help-dropdown">
    <button type="button" class="btn btn-ecem dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      Help <span class="caret"></span>
    </button>
    <ul class="dropdown-menu">
      <li><a href="#" class="dropdown-help-usage" data-modal="helpUsageModal">Using the demonstrator</a></li>
      <li><a href="#" class="dropdown-help-methods" data-modal="helpMethodsModal">Methods &amp; assumptions</a></li>
      <li><a href="#" class="dropdown-help-results" data-modal="helpResultsModal">Key messages &amp; pre-prepared graphics</a></li>
      <li><a href="#" class="dropdown-help-casestudies" data-modal="helpCasestudiesModal">Case studies</a></li>
    </ul>
  </div>
</div>`

export default HelpControlTemplate