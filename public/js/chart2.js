function speedHistogram(data, axis) {
	var width = 477, height = 240;

	var chart = d3.select("#charts").append("svg")
	     .attr("class", "chart left")
	     .attr("id", "chart2")
	     .attr("width", width)
	     .attr("height", height)
			 .append("g")
			 	.attr("transform", "translate(0,0)");

	var x = d3.scale.linear()
	    .domain([0, d3.max(data)])
	    .range([0, width]);

	var y = d3.scale.ordinal()
	     .domain(data)
	     .rangeBands([0, height]);

	chart.selectAll("line")
					    .data(x.ticks(10))
					   .enter().append("line")
					     .attr("x1", x)
					     .attr("x2", x)
					     .attr("y1", 0)
					     .attr("y2", height)
					     .style("stroke", "#444");   

	chart.selectAll("rect")
	     .data(data)
	   .enter().append("rect")
	     .attr("y", y)
	     .attr("width", x)
	     .attr("height", y.rangeBand());

	chart.selectAll("text")
	     .data(data)
			   .enter().append("text")
			     .attr("x", x)
			     .attr("y", function(d) { return y(d) + y.rangeBand() / 2; })
			     .attr("dx", -3) // padding-right
			     .attr("dy", ".35em") // vertical-align: middle
			     .attr("text-anchor", "end") // text-align: right
			     .text(String);            
}