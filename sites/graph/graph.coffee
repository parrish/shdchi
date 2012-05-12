class MultiLineString
  constructor: (hash) ->
    @start = hash.geometry.coordinates[0][0]
    @end = hash.geometry.coordinates[0][1]
    @[prop] = val for prop, val of hash.properties

processData = (data) ->
  features = _.map data.features, (hash) -> new MultiLineString(hash)
  console.log features

$ ->
  $.getJSON "http://parrish.cartodb.com/api/v2/sql?format=geojson&q=select * from segments_export limit 10", processData
