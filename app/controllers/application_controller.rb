require 'csv'
require 'net/http'
require 'securerandom'

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
          FROM openpaths AS s ORDER BY cartodb_id
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
        
        FROM segments WHERE session_id='#{session_id}'
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
  
  def session_id
    params[:session] || @session_id
  end
  helper_method :session_id
  
  def api_key
    ENV['CARTODB_API_KEY']
  end
end
