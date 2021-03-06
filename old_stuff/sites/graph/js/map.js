$(function() {
  var cartodbMapOptions = {
          zoom: 2,
          center: new google.maps.LatLng(0,0),
          disableDefaultUI: true,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };


  // Init the map
  var carto_embed_map = new google.maps.Map(document.getElementById("map_cartodb_container"),cartodbMapOptions);
  window.carto_embed_map = carto_embed_map;

  // Setup your map styles
  $.ajax({
    url:TILEHTTP + '://' + cartodb_user_name + '.' + TILESERVER + '/tiles/' + cartodb_table_name + '/map_metadata',
    type: 'GET',
    dataType: 'jsonp',
    success:function(result){
      map_style = $.parseJSON(result.map_metadata);
      if (map_style!=null) {
        if (map_style.google_maps_base_type=="satellite") {
          carto_embed_map.setOptions({mapTypeId: google.maps.MapTypeId.SATELLITE});
        } else if (map_style.google_maps_base_type=="terrain") {
          carto_embed_map.setOptions({mapTypeId: google.maps.MapTypeId.TERRAIN});
        } else {
          carto_embed_map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
        }

        // Get coordinates and zoom
        if (map_style.zoom && map_style.longitude && map_style.latitude) {
          carto_embed_map.setZoom(map_style.zoom);
          carto_embed_map.setCenter(new google.maps.LatLng(map_style.latitude,map_style.longitude));
        } else {
          getCartoDBBBox();
        }
      } else {
        getCartoDBBBox();
        carto_embed_map.setOptions({mapTypeId: google.maps.MapTypeId.ROADMAP});
        map_style = {};
        map_style.google_maps_customization_style = [ { stylers: [ { saturation: -65 }, { gamma: 1.52 } ] }, { featureType: "administrative", stylers: [ { saturation: -95 },{ gamma: 2.26 } ] }, { featureType: "water", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "administrative.locality", stylers: [ { visibility: 'off' } ] }, { featureType: "road", stylers: [ { visibility: "simplified" }, { saturation: -99 }, { gamma: 2.22 } ] }, { featureType: "poi", elementType: "labels", stylers: [ { visibility: "off" } ] }, { featureType: "road.arterial", stylers: [ { visibility: 'off' } ] }, { featureType: "road.local", elementType: "labels", stylers: [ { visibility: 'off' } ] }, { featureType: "transit", stylers: [ { visibility: 'off' } ] }, { featureType: "road", elementType: "labels", stylers: [ { visibility: 'off' } ] },{ featureType: "poi", stylers: [ { saturation: -55 } ] } ];
      }

      // Custom tiles
      carto_embed_map.setOptions({styles: map_style.google_maps_customization_style});
    },
    error: function(e){}
  });


  // Necessary params for wax and infowindow
  var cartodb_params = {
        cartodb_sql         : cartodb_sql,
        cartodb_style       : cartodb_style,
        cartodb_user_name   : cartodb_user_name,
        cartodb_table_name  : cartodb_table_name,
        cartodb_table_id    : cartodb_table_id,
        cartodb_map         : carto_embed_map,
        cartodb_map_canvas  : 'map_cartodb_container'
      }


  // Add wax interaction
  addCartoDBInteraction(cartodb_params);


  function getCartoDBBBox(corners) {
    // If request getCartoDBBox, get from helpers
    if (!corners) {
      gettingTableBounds(cartodb_table_name,getCartoDBBBox);
    } else {
      if (!$.isEmptyObject(corners)) {
        var bounds = new google.maps.LatLngBounds(corners.sw, corners.ne);
        carto_embed_map.fitBounds(bounds);
      }              
    }
  }


  // Wax interaction
  function addCartoDBInteraction(params) {
    var currentCartoDbId,
        tilejson = generateTileJson(params);
        infowindow = new CartoDBInfowindow(params);
        cache_buster = 0;
    
    var waxOptions = {
      callbacks: {
        out: function(){
          params.cartodb_map.setOptions({draggableCursor: 'default'});
        },
        over: function(feature, div, opt3, evt){
          params.cartodb_map.setOptions({draggableCursor: 'pointer'});
        },
        click: function(feature, div, opt3, evt){
          infowindow.open(feature,evt.latLng);
        }
      },
      clickAction: 'full'
    };
    
    var wax_tile = new wax.g.connector(tilejson);
    params.cartodb_map.overlayMapTypes.insertAt(0,wax_tile);
    var interaction = wax.g.interaction(params.cartodb_map, tilejson, waxOptions);


    // Generate tilejson
    function generateTileJson(params) {
      var core_url = TILEHTTP + '://' + params.cartodb_user_name + '.' + TILESERVER;  
      var base_url = core_url + '/tiles/' + params.cartodb_table_name + '/{z}/{x}/{y}';
      var tile_url = base_url + '.png?cache_buster=0';
      var grid_url = base_url + '.grid.json';
  
      // SQL?
      if (params.cartodb_sql) {
        var query = 'sql=' + params.cartodb_sql;
        tile_url = wax.util.addUrlData(tile_url, query);
        grid_url = wax.util.addUrlData(grid_url, query);
      }

      // Style
      if (params.cartodb_style) {
        var style = 'style=' + params.cartodb_style;
        tile_url = wax.util.addUrlData(tile_url,style);
        grid_url = wax.util.addUrlData(grid_url,style);
      }

  
      // Build up the tileJSON
      return {
        blankImage: TILEHTTP + '://cartodb.s3.amazonaws.com/embed/blank_tile.png', 
        tilejson: '1.0.0',
        scheme: 'xyz',
        tiles: [tile_url],
        grids: [grid_url],
        tiles_base: tile_url,
        grids_base: grid_url,
        formatter: function(options, data) {
            currentCartoDbId = data.cartodb_id;
            return data.cartodb_id;
        },
        cache_buster: function(){
            return params.cache_buster;
        }
      };
    };
  };


  // Zoom bindings
  $('a.cartodb_map_embed_zoom_in').click(function(ev){
    ev.preventDefault();
    carto_embed_map.setZoom(carto_embed_map.getZoom()+1);
  });
  $('a.cartodb_map_embed_zoom_out').click(function(ev){
    ev.preventDefault();
    carto_embed_map.setZoom(carto_embed_map.getZoom()-1);
  });
});



/**
 * CartoDB Infowindow
 * Needed:
 *  user_name, table_name, map_canvas, map_key??(no)
 **/

function CartoDBInfowindow(params) {
  this.latlng_ = new google.maps.LatLng(0,0);
  this.feature_;
  this.map_ = params.cartodb_map;
  this.columns_;
  this.offsetHorizontal_ = -107;
  this.width_ = 214;
  this.setMap(params.cartodb_map);
  this.params_ = params;
  this.getActiveColumns(params);
};


CartoDBInfowindow.prototype = new google.maps.OverlayView();


CartoDBInfowindow.prototype.getActiveColumns = function(params) {
  var that = this;
  $.ajax({
    url: TILEHTTP + '://' + params.cartodb_user_name + '.' + TILESERVER + '/tiles/' + params.cartodb_table_name + '/infowindow?'+ 'map_key=' + (params.cartodb_map_key || '')+'&callback=?',
    dataType: 'jsonp',
    success:function(result){
      var columns = $.parseJSON(result.infowindow);
      if (columns) {
        that.columns_ = parseColumns(columns);
      } else {
        that.columns_ = "*";
      }

    },
    error: function(e){}
  });
  
  function parseColumns(columns) {
    var str = '';
    for (p in columns) {
      if (columns[p] && p!='the_geom_webmercator' && p!='the_geom') {
        str+=p+',';
      }
    }
    return str.substr(0,str.length-1);
  }
}


CartoDBInfowindow.prototype.draw = function() {
  var me = this;
  
  var div = this.div_;
  if (!div) {
    div = this.div_ = document.createElement('DIV');
    div.className = "cartodb_infowindow";

    div.innerHTML = '<a href="#close" class="close">x</a>'+
                    '<div class="outer_top">'+
                      '<div class="top">'+
                      '</div>'+
                    '</div>'+
                    '<div class="bottom">'+
                      '<label>id:1</label>'+
                    '</div>';
    
    $(div).find('a.close').click(function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      me.hide();
    });

    google.maps.event.addDomListener(div, 'click', function (ev) {
      ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
    });
    google.maps.event.addDomListener(div, 'dblclick', function (ev) {
      ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
    });
    google.maps.event.addDomListener(div, 'mousedown', function (ev) {
      ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
      ev.stopPropagation ? ev.stopPropagation() : window.event.cancelBubble = true;
    });
    google.maps.event.addDomListener(div, 'mouseup', function (ev) {
      ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
    });
    google.maps.event.addDomListener(div, 'mousewheel', function (ev) {
    	ev.stopPropagation ? ev.stopPropagation() : window.event.cancelBubble = true;
    });
    google.maps.event.addDomListener(div, 'DOMMouseScroll', function (ev) {
    	ev.stopPropagation ? ev.stopPropagation() : window.event.cancelBubble = true;
    });
    
    var panes = this.getPanes();
    panes.floatPane.appendChild(div);

    div.style.opacity = 0;
  }

  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
  if (pixPosition) {
    div.style.width = this.width_ + 'px';
    div.style.left = (pixPosition.x - 49) + 'px';
    var actual_height = - $(div).height();
    div.style.top = (pixPosition.y + actual_height + 5) + 'px';
  }
};


CartoDBInfowindow.prototype.setPosition = function() {
  if (this.div_) { 
    var div = this.div_;
    var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
    if (pixPosition) {
      div.style.width = this.width_ + 'px';
      div.style.left = (pixPosition.x - 49) + 'px';
      var actual_height = - $(div).height();
      div.style.top = (pixPosition.y + actual_height + 5) + 'px';
    }
    this.show();
  }
}


CartoDBInfowindow.prototype.open = function(feature,latlng){
  var that = this;
  that.feature_ = feature;
  that.latlng_ = latlng;
  
  // If the table is private, you can't run any api methods without being
  $.ajax({
    method:'get',
    url: TILEHTTP + '://'+ this.params_.cartodb_user_name + '.' + SQL_SERVER + '/api/v1/sql/?q='+escape('select '+that.columns_+' from '+ this.params_.cartodb_table_name + ' where cartodb_id=' + feature)+'&callback=?',
    dataType: 'jsonp',
    success: function(result) {
      positionateInfowindow(result.rows[0]);
    },
    error: function(e) {}
  });
 
  function positionateInfowindow(variables) {
    if (that.div_) {
      var div = that.div_;
              
      // Remove the list items
      $('div.cartodb_infowindow div.outer_top div.top').html('');

      for (p in variables) {
        if (p!='cartodb_id' && p!='cdb_centre') {
          $('div.cartodb_infowindow div.outer_top div.top').append('<label>'+p+'</label><p class="'+((variables[p]!=null)?'':'empty')+'">'+(variables[p] || 'empty')+'</p>');
        }
      }
      
      $('div.cartodb_infowindow div.bottom label').html('id: <strong>'+feature+'</strong>');
      that.moveMaptoOpen();
      that.setPosition();     
    }
  }
} 


CartoDBInfowindow.prototype.hide = function() {
  if (this.div_) {
    var div = this.div_;
    $(div).animate({
      top: '+=' + 10 + 'px',
      opacity: 0},
      100, 'swing',
      function () {
        div.style.visibility = "hidden";
      }
    );
  }
}


CartoDBInfowindow.prototype.show = function() {
  if (this.div_) {
    var div = this.div_;
    div.style.opacity = 0;
    div.style.visibility = "visible";
    $(div).animate({
      top: '-=' + 10 + 'px',
      opacity: 1},
      250
    );
  }
}


CartoDBInfowindow.prototype.isVisible = function(marker_id) {
  if (this.div_) {
    var div = this.div_;
    if (div.style.visibility == 'visible' && this.feature_!=null) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}


CartoDBInfowindow.prototype.moveMaptoOpen = function() {
  var left = 0;
  var top = 0;
  var div = this.div_;
  var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.latlng_);

  if ((pixPosition.x + this.offsetHorizontal_) < 0) {
    left = (pixPosition.x + this.offsetHorizontal_ - 20);
  }
  
  if ((pixPosition.x + 180) >= ($('#'+this.params_.cartodb_map_canvas).width())) {
    left = (pixPosition.x + 180 - $('#'+this.params_.cartodb_map_canvas).width());
  }
  
  if ((pixPosition.y - $(div).height()) < 0) {
    top = (pixPosition.y - $(div).height() - 30);
  }
      
  this.map_.panBy(left,top);
}