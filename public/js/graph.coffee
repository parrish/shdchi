class SegmentGroup
  @distanceTolerance = 100
  @speedTolerance = 5
  @groups = []
  
  @add: (segment) ->
    if @last is undefined
      @last = new SegmentGroup(segment)
      @groups.push @last
    else if Math.abs( segment.distance - _(@last.records).last().distance ) > SegmentGroup.distanceTolerance && Math.abs( segment.speed - @last.average('speed') ) > SegmentGroup.speedTolerance
      @last = new SegmentGroup(segment)
      @groups.push @last
    else
      @last.add segment
  
  constructor: (@records...) ->
  
  total: (prop) ->
    _(@records).reduce (total, record) ->
      total + record[prop]
    , 0
  
  average: (prop) ->
    @total(prop) / @records.length
  
  bounds: ->
    lats = _(@records).map (r) -> [r.start[0], r.end[0]]
    lons = _(@records).map (r) -> [r.start[1], r.end[1]]
    [lats, lons] = [_(lats).flatten(), _(lons).flatten()]
    
    [
      [_(lats).min(), _(lons).min()],
      [_(lats).max(), _(lons).max()]
    ]
  
  add: (segment) ->
    @records.push segment


class Segment
  @records = []
  
  @total: (prop) ->
    _(@records).reduce (total, record) ->
      total + record[prop]
    , 0
  
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
    Segment.records.push @
    SegmentGroup.add @
    @

processData = (data) ->
  new Segment(hash) for hash in data.features when hash.geometry isnt null

$ ->
  $.getJSON "http://parrish.cartodb.com/api/v2/sql?format=geojson&q=select * from segments_export limit 100", processData


window.Segment = Segment
window.SegmentGroup = SegmentGroup
