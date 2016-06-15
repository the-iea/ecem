export default `
<div id="container">
  <div id="ecem-banner" class="ecem">
    <div><img src="app/img/C3S-Banner2.svg"></div>
  </div>
  
  <div id="map"></div>
  
  <div class="modal fade" id="infoModal" tabindex="-1" role="dialog" aria-labelledby="infoModalLabel">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title" id="infoModalLabel">Acknowledgments</h4>
        </div>
        <div class="modal-body">
          <p>
            Background map data from <a href="http://www.osm.org">OpenStreetMap</a>
          </p>
          <p>
            Source datasets: <a href="http://www.e-highway2050.eu/">e-Highway2050 Cluster Borders</a>, ...
          </p>
          <p>
            Open Source software:
            <a href="https://github.com/Reading-eScience-Centre/covjson-reader">covjson-reader</a>,
            <a href="http://leafletjs.com/">Leaflet</a>,
            <a href="http://getbootstrap.com/">Bootstrap</a>,
            <a href="http://thednp.github.io/bootstrap.native/">bootstrap.native</a>,
            <a href="https://github.com/ebrelsford/Leaflet.loading">Leaflet.loading</a>,
            <!--<a href="http://c3js.org/">C3.js</a>,-->
            <a href="http://www.highcharts.com/">Highcharts</a>,
            <a href="https://github.com/zloirock/core-js">core-js</a>,
            <a href="https://github.com/github/fetch">github/fetch</a>
            <a href="http://jspm.io/">jspm</a>,
            <a href="https://github.com/systemjs/systemjs">SystemJS</a>,
            <a href="https://github.com/systemjs/plugin-css">systemjs/plugin-css</a>
            <a href="https://github.com/HuasoFoundries/systemjs-less-plugin">systemjs-less-plugin</a>,
            <a href="https://babeljs.io/">Babel</a>,
            <a href="https://github.com/jakubpawlowicz/clean-css">clean-css</a>            
          </p>
                 
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</div>
`