var map;
$(function() {

		map = new L.Map('map_cartodb_container').setView(new L.LatLng(20,0), 2);

    var mapboxUrl = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png',
        mapbox = new L.TileLayer(mapboxUrl, {maxZoom: 17,attribution:"OpenStreetMap, Mapbox"});
    map.addLayer(mapbox,true);   
		
    	var style= "#openpaths_segments{"+
    		"polygon-opacity:0.7;"+
    	    "[prop_count<20]{polygon-fill:#415E9E;polygon-opacity:0.1;polygon-opacity:0.3;} "+
    	    "[prop_count>19]{polygon-fill:#6581B5;polygon-opacity:0.7}"+
    	    "[prop_count>25]{polygon-fill:#88A3CC}"+
    	    "[prop_count>35]{polygon-fill:#ACC6E3;}"+
    	    "[prop_count>50]{polygon-fill:#88A3CC;}"+
    	    "[prop_count>70]{polygon-fill:#F6BEB5;}"+
    	    "[prop_count>90]{polygon-fill:#E3928C;}"+
    	    "[prop_count>100]{polygon-fill:#CF6562;}"+
    	    "[prop_count>130]{polygon-fill:#BC3939;}"+
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

			url ="http://osm2.cartodb.com/api/v2/sql?q=SELECT sum(sqrt(1/(1-((speed/29979245)*(speed/29979245))))*interv_sec) - sum(interv_sec) As timelost, avg(speed) As avgspeed, sum(distance) As distance, ST_Area(ST_Extent(the_geom)::geometry,true) As area,(SELECT sum(carbon) from openpaths_flights as ofl WHERE ofl.session_id='" + window.cartodbSessionId + "') as total_carbon FROM openpaths_segments WHERE session_id='" + window.cartodbSessionId + "'";
			$.getJSON(url, function(data) {
			    r = data.rows[0];
					
					area = { val: r.area*0.000001, wales: r.area/20779000000 };
					distance = { val: r.distance, canyon: r.distance/433000 };
					avg_speed = { val: r.avgspeed*2.23693629 };
					timelost = { val: r.timelost*1000000 };
					
					//console.log(data);
					$("#avg_speed_value").html("<span class='stat-val'>"+avg_speed.val.toFixed(0)+"</span><span class='units'>mph</span>");
					$("#distance_value").html("<span class='stat-val'>"+distance.canyon.toFixed(0)+"</span><span class='units'>Grand Canyons</span>");
					$("#area_value").html("<span class='stat-val'>"+area.wales.toFixed(0)+"</span><span class='units'>Wales</span>");
					$("#timelost_value").html("<span class='stat-val'>"+timelost.val.toFixed(2)+"</span><span class='units'>ms</span>");
			  }); 
			
			url ="http://osm2.cartodb.com/api/v2/sql?q=SELECT ROUND(LOG(CAST(speed As numeric)),0) As speed_group, COUNT(*)/AVG(interv_sec) as count FROM openpaths_segments WHERE session_id='" + window.cartodbSessionId + "' AND speed > 0 GROUP BY ROUND(LOG(CAST(speed As numeric)),0) ORDER BY ROUND(LOG(CAST(speed As numeric)),0)";
			$.getJSON(url, function(data) {
			    r = data.rows;
          var counts = _(r).map(function(item) { return item.count });
					var groups = _(r).map(function(item) { return (Math.pow(10,item.speed_group)) });

					//console.log(groups, counts);
					window.speedHistogram(counts)
			  });
			
			$("#avg_speed_value").click(function() {
			  
			});  

});