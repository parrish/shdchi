var map;
$(function() {

		map = new L.Map('map_cartodb_container').setView(new L.LatLng(20,0), 2);


          var mapboxUrl = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png',
              mapbox = new L.TileLayer(mapboxUrl, {maxZoom: 17,attribution:"OpenStreetMap, Mapbox"});
          map.addLayer(mapbox,true);
          
          
		
		var style= "#openpaths_segments{"+
		"polygon-opacity:0.7;"+
	    "[prop_count<8]{polygon-fill:#415E9E;polygon-opacity:0.1;line-opacity:0.2} "+
	    "[prop_count>7]{polygon-fill:#6581B5;polygon-opacity:0.7}"+
	    "[prop_count>9]{polygon-fill:#88A3CC}"+
	    "[prop_count>13]{polygon-fill:#ACC6E3;}"+
	    "[prop_count>20]{polygon-fill:#88A3CC;}"+
	    "[prop_count>30]{polygon-fill:#F6BEB5;}"+
	    "[prop_count>40]{polygon-fill:#E3928C;}"+
	    "[prop_count>50]{polygon-fill:#CF6562;}"+
	    "[prop_count>100]{polygon-fill:#BC3939;}"+
	    "line-opacity:0.21;line-color:#000000;line-width:0.8;}";
	    
		var query="WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(CDB_XYZ_Extent({x},{y},{z}),CDB_XYZ_Resolution({z}) * 4),CDB_XYZ_Resolution({z}) * 4 ) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.cartodb_id) as prop_count FROM hgrid, openpaths_segments i WHERE ST_Intersects(i.the_geom_webmercator, hgrid.cell) AND session_id='" + window.cartodbSessionId + "' GROUP BY hgrid.cell";
		
		hexagons = new L.CartoDBLayer({
        map_canvas: 'map_canvas',
        map: map,
        user_name:"osm2",
        table_name: 'openpaths_segments',
        infowindow: false,
        tile_style:style,
        query: query,
        interactivity: false,
        auto_bound: false,
        debug: false
      });
      
      //Change the session_id
      url ="http://osm2.cartodb.com/api/v2/sql?q=SELECT ST_XMax(ST_Extent(the_geom)) as maxx,ST_YMax(ST_Extent(the_geom)) as maxy,ST_XMin(ST_Extent(the_geom)) as minx,ST_YMin(ST_Extent(the_geom)) as miny FROM openpaths_segments where session_id='" + window.cartodbSessionId + "'";
      $.getJSON(url, function(data) {
          r = data.rows[0];
          var southWest = new L.LatLng(r.miny,r.minx),
              northEast = new L.LatLng(r.maxy,r.maxx),
              bounds = new L.LatLngBounds(southWest, northEast);
          map.fitBounds(bounds);
        });
		



});