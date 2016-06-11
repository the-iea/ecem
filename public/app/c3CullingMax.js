import c3 from 'c3'

let isValue = c3.chart.internal.fn.isValue

// https://github.com/c3js/c3/pull/1400
c3.chart.fn.axis.cullingMax = function(max){
    var $$ = this.internal, config = $$.config;
  if(arguments.length){
    if(isValue(max)){
      config.axis_x_tick_culling_max = max;
      $$.redraw({
        withUpdateXAxis:true,            
        withY: false,
        withSubchart: false,
        withEventRect: false,
        withTransitionForAxis: false
      });
    }
  }else{
    return config.axis_x_tick_culling_max;
  }
};