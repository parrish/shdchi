class MultiLineString
  @records = []
  
  @total: (prop) ->
    _(@records).reduce (total, record) ->
      record[prop]
  
  @average: (prop) ->
    @total(prop) / @records.length
  
  @bounds: ->
    lats = _(@records).map (r) -> [r.start[0], r.end[0]]
    lons = _(@records).map (r) -> [r.start[1], r.end[1]]
    [lats, lons] = [_(lats).flatten(), _(lons).flatten()]
    
    [
      [_(lats).min(), _(lons).min()],
      [_(lats).max(), _(lons).max()]
    ]
  
  constructor: (hash) ->
    @start = hash.geometry.coordinates[0][0]
    @end = hash.geometry.coordinates[0][1]
    @[prop] = val for prop, val of hash.properties
    MultiLineString.records.push @

processData = (data) ->
  new MultiLineString(hash) for hash in data.features

$ ->
  $.getJSON "http://parrish.cartodb.com/api/v2/sql?format=geojson&q=select * from segments_export limit 10", processData


window.MultiLineString = MultiLineString
