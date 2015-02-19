			
	/* Performs preprocessing on the data to add in filler nodes. */
	function addFillerValues(d, valueString, nameString, valueFunc, textFunc) {
		if(d.children) {
			var index;
			var sum = 0;
			for(index = 0; index < d.children.length; index++) {
				addFillerValues(d.children[index], valueString, nameString, valueFunc, textFunc);
				sum += valueFunc(d.children[index]);
			}
			
			var difference = valueFunc(d) - sum;
			var obj = { };
			obj[nameString] =  textFunc(d);
			obj[valueString] = difference;
			obj["type"] = "filler";
			d.children.push(obj);
		}
	}
	
	valueFunc = function(d) { return d.value; };
	nameFunc = function(d) { return d.name; };
	addFillerValues(myData, "value", "name", valueFunc, nameFunc);

	var padding = 0, width = 900, height = 500;
	var x = d3.scale.linear().domain([0, width]).range([0, width]);
	var y = d3.scale.linear().domain([0, height]).range([0, height]);

	var treemap = d3.layout.treemap()
		.sort(function (a, b) { return 0; })
		.round(false)
		.value(valueFunc);

	var svg = d3.select("#chart").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.style("shape-rendering", "crispEdges");

	var json = myData;
	initialize(json);
	layout(json);
	display(json);

	function initialize(theData) {
		theData.x = theData.y = 0;
		theData.dx = width;
		theData.dy = height;
		theData.depth = 0;
	}
	
	// Layouts out the children nodes in each parent, but this is done in a 1x1 box,
	// so after the layout the children values need to be scaled to the parent.
	function layout(d) {
		if (d.children) {
			treemap.nodes({ children: d.children });
			d.children.forEach(function (c) {
				c.x = d.x + c.x * d.dx;
				c.y = d.y + c.y * d.dy;
				c.dx *= d.dx;
				c.dy *= d.dy;
				c.parent = d;
				layout(c);
			});
		}
	}
	
	function display(d) {
		var g1 = svg.insert("g");
		recursiveDisplay(g1, d, 0);
	}

	function recursiveDisplay(g1, d, depth) {

		// For each child of the root, append a "g" and associate a single child with that "g".
		var g = g1.selectAll("g")
			.data(d.children)
			.enter().append("g");

		// Filters the selection, returning a new selection that contains only the elements for which the specified selector is true
		// For each "g" we just appended, add the class "children" if the node has children (it may not have any).
		g.filter(function (d) {
			return d.children;
		}).classed("children", true);

		// Add rects for children at this depth, but only if there are no children beneath. 
		g.selectAll("rect")
			.data(function (d) {
				// Don't worry about children here, we are going to hit them next iteration. 
				if(d.children) {
					return [];
				} else {
					return [d];
				}
			})
			.enter().append("rect")
			.attr("class", "child")
			.call(rect);
			
		// If the "g" holds a "filler" rect, add the class "fill"
		g.filter(function(d) {
			return d.type === "filler";
		}).classed("fill", true);
		
		// If the "g" does not have a class (it isn't "children" or "fill"), add the "nochildren" class.
		g.filter(function(d) {
			return !$(this).attr("class") === true;
		}).classed("nochildren", true);
		
		// Add hover events to "filler" rects.
		g.filter(function(d) {
			return d.type === "filler";
		}).on("mouseover", function(d) {
			$(this).parent().find("rect").css("fill", "#66C266");
			$(this).find("rect").css("fill", "#478847");
		}).on("mouseout", function(d) {
			$(this).parent().find("rect").css("fill", "none");
			$(this).find("rect").css("fill", "none");
		});
		
		// Add hover events to "nochildren" rects.
		g.filter(function(d) {
			return $(this).attr("class") === "nochildren";
		}).on("mouseover", function(d) {
			$(this).find("rect").css("fill", "#478847");
		}).on("mouseout", function(d) {
			$(this).find("rect").css("fill", "none");
		});

		// Add text for children at this depth.
		g.filter(function (d) {
			return !d.children;
		}).append("text")
			.attr("dy", ".75em")
			.text(nameFunc)
			.call(text);

		// Now do it for the next depth. The trick line here is "d3.select(this)". 
		g1.selectAll("g").each(function (d) {            
			if (d.children) {
				recursiveDisplay(d3.select(this), d, depth+1);
			}
		});
	}

	function text(text) {
		text.attr("x", function (d) { return x(d.x) + 6; })
			.attr("y", function (d) { return y(d.y) + 6; });
	}

	function rect(rect) {
		rect.attr("x", function (d) { return x(d.x); })
			.attr("y", function (d) { return y(d.y); })
			.attr("width", function (d) { return x(d.x + d.dx) - x(d.x); })
			.attr("height", function (d) { return y(d.y + d.dy) - y(d.y); });
	}
