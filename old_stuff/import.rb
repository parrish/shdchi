require 'csv'
require 'net/http'
require 'json/ext'

api_key="xxx"
session_id='kjhkj9'

sql="INSERT INTO openpaths(the_geom,trace_timestamp,session_id) VALUES"
CSV.foreach("data/openpaths_jatorre.csv", {:headers => true}) do |row|
  sql=sql+"(ST_SetSRID(ST_Makepoint(#{row[1]},#{row[0]}),4326),'#{row[3]}','#{session_id}'),"
end


uri = URI('http://osm2.cartodb.com/api/v2/sql')
res = Net::HTTP.post_form(uri, 'q' => sql[0..-2], 'api_key' => api_key)

puts res


sql="
INSERT INTO openpaths_segments(the_geom,distance,start_timestamp,end_timestamp,speed,interv_sec,session_id) SELECT * FROM (

WITH segments as 
    (SELECT the_geom as the_geom_start,(SELECT the_geom from openpaths as e WHERE e.cartodb_id=s.cartodb_id+1) as the_geom_end,
trace_timestamp as start_date, (SELECT trace_timestamp from openpaths as e WHERE e.cartodb_id=s.cartodb_id+1) as end_date
 FROM openpaths as s ORDER BY cartodb_id)

SELECT ST_Multi(ST_MakeLine(the_geom_start,the_geom_end)) as the_geom, ST_Distance(the_geom_start::geography,the_geom_end::geography) as distance, start_date,end_date, 
CASE WHEN extract(epoch from (end_date-start_date))=0 THEN 0
ELSE ST_Distance(the_geom_start::geography,the_geom_end::geography)/extract(epoch from (end_date-start_date))  END as speed,
extract(epoch from (end_date-start_date)) as interv_sec,'#{session_id}' as session_id

FROM segments) as lala"

uri = URI('http://osm2.cartodb.com/api/v2/sql')
res = Net::HTTP.post_form(uri, 'q' => sql, 'api_key' => api_key)
puts res

sql="DELETE FROM openpaths_segments WHERE interv_sec=0"
uri = URI('http://osm2.cartodb.com/api/v2/sql')
res = Net::HTTP.post_form(uri, 'q' => sql, 'api_key' => api_key)








