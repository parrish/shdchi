var data = [4, 8, 15, 16, 23, 42, 65, 23, 78, 55];

var chart = d3.select("#charts").append("svg")
     .attr("class", "chart right")
     .attr("id", "chart1")
     .attr("width", 477)
     .attr("height", 240);

var x = d3.scale.linear()
    .domain([0, d3.max(data)])
    .range([0, 477]);

chart.selectAll("rect")
     .data(data)
   .enter().append("rect")
     .attr("y", function(d, i) { return i * 24; })
     .attr("width", x)
     .attr("height", 24); 
