
function main() {

  	$("#refresh").click(function() {
		voronoi();
	});
	voronoi();
}

function voronoi() {
	var w = 960;
	var h = 500;
	var enclosing = [[0,0], [0, h+60], [w-500, h], [w-30, h/2], [w-200, 0]];
	var enclosing = [[0,0], [0, h+100], [w+100, h+100], [w+100, 0]];
	var enclosingPolygon = d3.geom.polygon(enclosing);
	
	var vertices = d3.range(15).map(function(d, i) {
	  return [Math.random() * (w-200), Math.random() * (h-200)];
	});
	
	$("#chart").empty();
    d3.select("#chart").append("svg").attr("width", w+100).attr("height", h+100);
	VoronoiTessellation(vertices);
	var voronoi = doVoronoi(vertices);
	draw("#chart", w, h, vertices, voronoi, enclosingPolygon);
}

function drawCircle(x, y, color) {
	d3.select("svg").append("circle")
	.attr("transform", "translate(" + x + "," + y + ")")
	.attr("r", 4)
	.style("fill", color);
	
	d3.select("svg").append("text")
	.attr("x", x+3)
	.attr("y", y)
	.text("(" + Math.round(x) + "," + Math.round(y) + ")");
}

function draw(location, width, height, vertices, voronoi, enclosingPolygon) {
		
	var svg = d3.select(location).select("svg");

	svg.selectAll("voronoi")
	.data(voronoi)
    .enter().append("path")
	.attr("class", function(d, i) { return i ? "q" + (i % 9) + "-9" : null; })
	.attr("d", function(d) {  
		return "M" + enclosingPolygon.clip(d).join("L") + "Z"; 
	});
	
	svg.selectAll("circle").data(vertices).enter().append("circle")
	.attr("transform", function(d) { 
	 	if(!isNaN(d[0])) {
	 		return "translate(" + d[0] + "," + d[1] + ")"; 
		}
	})
	.attr("r", function(d) { 
		return 2;
	});
}




