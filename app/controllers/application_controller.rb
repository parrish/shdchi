require 'csv'
require 'net/http'
require 'securerandom'
require 'json/ext'

class ApplicationController < ActionController::Base
  protect_from_forgery
  
  def index
    
  end
  
  def map
    
  end
  
  def upload
    @session_id = SecureRandom.hex 8
    post_paths
    post_segments
    post_cleanup
    post_geocode
    redirect_to map_path(session: @session_id)
  end
  
  protected
  
  def post_paths
    sql = 'INSERT INTO openpaths(the_geom,trace_timestamp,session_id) VALUES'
    rows = []
    CSV.foreach(params[:file].tempfile.path, headers: true) do |row|
      rows << "(ST_SetSRID(ST_Makepoint(#{row[1]},#{row[0]}),4326),'#{row[3]}','#{session_id}')"
    end
    
    sql += rows.join ','
    uri = URI 'http://osm2.cartodb.com/api/v2/sql'
    Net::HTTP.post_form uri, q: sql, api_key: api_key
  end
  
  def post_segments
    sql = <<-SQL
      INSERT INTO openpaths_segments(the_geom, distance, start_timestamp, end_timestamp, speed, interv_sec, session_id)
      SELECT * FROM (
        WITH segments AS (
          SELECT the_geom AS the_geom_start, (
            SELECT the_geom
            FROM openpaths AS e
            WHERE e.cartodb_id = s.cartodb_id + 1
          ) AS the_geom_end,
          trace_timestamp AS start_date, (
            SELECT trace_timestamp
            FROM openpaths AS e
            WHERE e.cartodb_id = s.cartodb_id + 1
          ) AS end_date
          FROM openpaths AS s WHERE session_id='#{session_id}' ORDER BY cartodb_id
        )
      
      SELECT ST_Multi(ST_MakeLine(the_geom_start, the_geom_end)) AS the_geom,
        ST_Distance(the_geom_start::geography, the_geom_end::geography) AS distance,
        start_date,
        end_date,
        CASE WHEN
          extract(epoch FROM (end_date - start_date)) = 0 THEN 0
        ELSE
          ST_Distance(the_geom_start::geography, the_geom_end::geography) / extract(epoch FROM (end_date - start_date))
        END AS speed,
        extract(epoch FROM (end_date - start_date)) AS interv_sec,'#{ session_id }' AS session_id
        
        FROM segments 
      ) AS lala
    SQL
    
    uri = URI 'http://osm2.cartodb.com/api/v2/sql'
    Net::HTTP.post_form uri, q: sql, api_key: api_key
  end
  
  def post_cleanup
    sql = 'DELETE FROM openpaths_segments WHERE interv_sec = 0'
    uri = URI 'http://osm2.cartodb.com/api/v2/sql'
    Net::HTTP.post_form uri, q: sql, api_key: api_key
    
    sql = 'ANALYZE openpaths_segments'
    uri = URI 'http://osm2.cartodb.com/api/v2/sql'
    Net::HTTP.post_form uri, q: sql, api_key: api_key
  end
  
  def post_geocode
    #find cities traveled
    sql="SELECT cartodb_id,
    (SELECT iata_faa FROM airports as a WHERE iata_faa <>'' ORDER BY a.the_geom <-> ST_StartPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as start_airport,
    (SELECT city FROM airports as a WHERE iata_faa <>'' ORDER BY a.the_geom <-> ST_StartPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as start_city,
    (SELECT iata_faa FROM airports as a WHERE iata_faa <>'' ORDER BY a.the_geom <-> ST_EndPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as end_airport,
    (SELECT city FROM airports as a WHERE iata_faa <>''  ORDER BY a.the_geom <-> ST_EndPoint(ST_GeometryN(o.the_geom,1)) LIMIT 1) as end_city,
    '#{ session_id }' as session_id

    FROM openpaths_segments as o WHERE  distance>100000 and speed>60 AND session_id='#{ session_id }'"

    uri = URI('http://osm2.cartodb.com/api/v2/sql')
    res = Net::HTTP.post_form(uri, 'q' => sql)
    result = JSON.parse(res.body)


    sql="INSERT INTO openpaths_flights(start_airport,start_city,end_airport,end_city,session_id,carbon) VALUES "
    result["rows"].each do |flight| 

      uri = URI('http://impact.brighterplanet.com/flights.json')
      res = Net::HTTP.post_form(uri, 
        'segments_per_trip' => 1,
        'trips' =>1,
        'origin_airport[iata_code]' =>flight["start_airport"],
        'destination_airport[iata_code]' =>flight["end_airport"]

        )
      result = JSON.parse(res.body)
      #puts result["decisions"]["carbon"]["object"]["value"]

      sql=sql+"('#{flight["start_airport"]}','#{flight["start_city"]}','#{flight["end_airport"]}','#{flight["end_city"]}','#{flight["session_id"]}','#{result["decisions"]["carbon"]["object"]["value"]}'),"
    end
    
    uri = URI 'http://osm2.cartodb.com/api/v2/sql'
    Net::HTTP.post_form uri, q: sql[0..-2], api_key: api_key
  end
  
  def session_id
    params[:session] || @session_id
  end
  helper_method :session_id
  
  def api_key
    ENV['CARTODB_API_KEY']
  end
end
