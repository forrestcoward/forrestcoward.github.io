var width = 900,
	height = 500,
	color = d3.scale.category20c();

var treemap = d3.layout.treemap()
	.size([width, height])
	.sticky(true)
	.value(function(d) { return d.value; });

var div = d3.select("#default").append("div")
	.style("position", "relative")
	.style("width", width + "px")
	.style("height", height + "px");

div.data([myData2]).selectAll("div")
	.data(treemap.nodes)
	.enter().append("div")
	.attr("class", "cell")
	.style("background", function(d) { return d.children ? color(d.name) : null; })
	.call(cell)
	.text(function(d) { return d.children ? null : d.name; });


 function cell() {
   this
       .style("left", function(d) { return d.x + "px"; })
       .style("top", function(d) { return d.y + "px"; })
       .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
       .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
 }