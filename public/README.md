# Web application

The used package manager is [jspm](http://jspm.io/).

The user interface is created using the following packages:
- [Leaflet](http://leafletjs.com/) for the map
- [Bootstrap](http://getbootstrap.com/) for controls and modals
- [Highcharts](http://www.highcharts.com/) for plots

Data files are processed using the following libraries:
- [covjson-reader](https://github.com/Reading-eScience-Centre/covjson-reader) for reading [CovJSON](https://covjson.org) files
- [covutils](https://github.com/Reading-eScience-Centre/covutils) for handling units and internationalised strings in CovJSON files

Compatibility with older browsers is achieved through polyfills from the [core-js](https://github.com/zloirock/core-js) library.
