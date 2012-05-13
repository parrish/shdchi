require 'csv'
require 'net/http'
require 'json/ext'

session_id='kjhkj9'

#find cities traveled
sql="SELECT cartodb_id,
(SELECT iata_faa FROM airports as a WHERE iata_faa <>'' ORDER BY a.the_geom <-> ST_StartPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as start_airport,
(SELECT city FROM airports as a WHERE iata_faa <>'' ORDER BY a.the_geom <-> ST_StartPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as start_city,
(SELECT iata_faa FROM airports as a WHERE iata_faa <>'' ORDER BY a.the_geom <-> ST_EndPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as end_airport,
(SELECT city FROM airports as a WHERE iata_faa <>''  ORDER BY a.the_geom <-> ST_EndPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as end_city

FROM openpaths_segments as o WHERE  distance>100000 and speed>60 AND session_id='822e872e41763ab5'"

uri = URI('http://osm2.cartodb.com/api/v2/sql')
res = Net::HTTP.post_form(uri, 'q' => sql)
result = JSON.parse(res.body)

result["rows"].each do |flight| 

  uri = URI('http://impact.brighterplanet.com/flights.json')
  res = Net::HTTP.post_form(uri, 
    'segments_per_trip' => 1,
    'trips' =>1,
    'origin_airport[iata_code]' =>flight["start_airport"],
    'destination_airport[iata_code]' =>flight["end_airport"]

    )
  result = JSON.parse(res.body)
  puts result["decisions"]["carbon"]
  
  
  
end



