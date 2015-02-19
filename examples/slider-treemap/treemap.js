// treemap.js 
// depends on d3.v3.js, jquery

// Defines the Treemap class built on d3 treemap layout. 
// public API: draw, hide, show, clear, transition
// Must call draw before a call to transition.

// Notes: 
// * Be aware that d3 treemap operations can become quite slow with large amount of data. If you are going to be
// constantly transitioning on a large treemap, overlaying 2 treemaps - one truncated and one not - is an
// effective technique. 
//
// * Using sticky=true results in suboptimal node layouts and gets worse with lots of transitions. If you don't need
// to transition use sticky=false for an optimal layout.

function Treemap(data, parent, dimensions) {
	
	var data = jQuery.extend(true, {}, data);
	var parent = parent;
	var width = dimensions.width;
	var height = dimensions.height;
	var x = d3.scale.linear().domain([0, width]).range([0, width]);
    var y = d3.scale.linear().domain([0, height]).range([0, height]);
	var transitionComplete = true;
	var d3treemap = null;
	var maxDepth = 0, bugsLeft = 0, firstSplitDepth = 0;

	treemap.draw = function(drawArgs) {
		
		// drawArgs.metric, drawArgs.grouping, drawArgs.valueFunc, drawArgs.nameFunc are required. 
		var sticky = typeof drawArgs.sticky !== 'undefined' ? drawArgs.sticky : false;
		var truncateDepth = typeof drawArgs.truncateDepth !== 'undefined' ? drawArgs.truncateDepth : null;
		var bugInfo = typeof drawArgs.bugInfo !== 'undefined' ? drawArgs.bugInfo : null;
		
		treemap(drawArgs.metric, drawArgs.grouping, drawArgs.valueFunc, drawArgs.nameFunc, drawArgs.sticky, truncateDepth, bugInfo);
		
		return treemap;
	}
	
	function treemap(metric, grouping, valueFunc, nameFunc, sticky, truncateDepth, bugInfo) { 
	
		go(); // begin draw
		var root;
		
		function go() {
		
			examine(data, 0, bugInfo);
			firstSplitDepth = findFirstSplit(data, 0);
		
			if(bugsLeft === 0 && metric === "bugcount") {
				$(parent).text("No bugs in time range.");
				return;
			}
			
			if(truncateDepth != null) truncateTree(data, 0, truncateDepth);
		
			d3treemap = d3.layout.treemap().round(false).value(valueFunc).size([width, height]).sticky(sticky);
			root = d3.select(parent).append("block").attr("width", width).attr("height", height);

			initialize(data);
			d3treemap.nodes(data);
			display(data);
		}

		function initialize(d) {
			d.x = d.y = 0;
			d.dx = width;
			d.dy = height;
			d.depth = 0;
		}
		
		function display(d) {
			var g1 = root.insert("block");
			
			var colorInfo = {
				lowerHue: 0,
				upperHue: 360,
				value: 100,
				saturation: 100
			}
			
			recursiveDisplay(g1, d, 0, colorInfo);
		}

		// A recursive display algorithm isn't nessecary to draw all the nodes
		// on the screen: we could just append the nodes into a div list. However, to acheive
		// spectrum/depth coloring we go recursively. 
		function recursiveDisplay(g1, d, depth, colorInfo) {

			// For each child of the root, append a "g" and associate a single child with that "g".
			var g = g1.selectAll("block")
				.data(d.children)
				.enter().append("block");

			// Add rects for children at this depth, but only if there are no children beneath. 
			g.selectAll("block")
				.data(function (d, depth) {
					if (d.children) return [];
					else return [d];
				})
				.enter().append("block")
				.classed("cell", true)
				.attr("id", function (d) { 
				return d.fullname + "." + parent; 
				})
				.call(cell)
				.style("background", hsvToRgb(colorInfo.lowerHue, colorInfo.saturation, colorInfo.value))
				.text(function(d) { return d.children ? null : truncateText(d, width, height) });

			
			var cwc = 0;
			var count = 0;
			var numChildren = d.children.length;
			d.children.forEach(function (c) {
				if (c.hasOwnProperty("children") && c.area > 0) cwc++;
			});
			
			// Coloring algorithm -
			// At each split divide the available hue spectrum into increments, but leave buffer space
			// so different groups aren't too similar in color. Reduce saturation and value going down the tree.
			//
			// Increase rainbowVariation to decrease range of available color. Needs to be at least 1. 
			
			var rainbowVariation = 2;
			var increment = (colorInfo.upperHue - colorInfo.lowerHue) / (cwc + rainbowVariation);
			var buffer = increment/cwc;
			
			g1.selectAll("block").each(function (d) {
				if (d.children) {
					if (cwc > 1) {
					
						var newColorInfo = {};
						newColorInfo.lowerHue = colorInfo.lowerHue + (increment + buffer) * count;
						newColorInfo.upperHue = colorInfo.lowerHue + increment * (count + 1) + buffer * count;
						
						if(numChildren > (cwc*2)/3) { // Don't reduce color if no files at this level.
							var val = 35 / ((maxDepth-firstSplitDepth));
							var sat = 100 / ((maxDepth-firstSplitDepth));
							newColorInfo.value = colorInfo.value - val;
						    newColorInfo.saturation = colorInfo.saturation - sat;
						}
						
						count++;
						recursiveDisplay(d3.select(this), d, depth+1, newColorInfo);
						
					} else {
						recursiveDisplay(d3.select(this), d, depth+1, colorInfo);
					}
				}
			});
		}
	
	}
	
	treemap.clear = function() {
		$(parent).empty();
		return treemap;
	}
	
	treemap.hide = function() {
		$(parent).hide();
		return treemap;
	}
	
	treemap.show = function() {
		$(parent).show();
		return treemap;
	}
	
	treemap.transition = function(valueFunc, duration, callback) {

		if(d3treemap === null) throw new Error("Must call treemap.draw at least once before calling treemap.transition")
		
		if(transitionComplete) {
			transitionComplete = false;
			d3treemap.value(valueFunc);
			d3treemap.nodes(data);

			d3.selectAll(parent + " block .cell")
				.transition()
				.text(function(d) { return truncateText(d, width, height); })
				.duration(duration)
				.call(cell);
			
			setTimeout(function() { 
				transitionComplete = true;
				if(callback) callback();
			}, duration + (duration + 50) / 3);
		}
	}
	
	// Computes max depth and total bug count.
	function examine(d, depth, bugInfo) {
		maxDepth = Math.max(depth, maxDepth);
		if (d.children) {
			var index = 0;
			for (index = 0; index < d.children.length; index++) {
				var child = d.children[index];

				if (bugInfo != null && child.bugcount != 0 && child.hasOwnProperty('bugdates')) {
					var bugs = numBugsInRange(child.bugdates, bugInfo.min, bugInfo.max)
					bugsLeft += bugs;
				}

				examine(child, depth + 1, bugInfo);
				
			}
		}
	}

	function cell() {
	   this
		   .style("left", function(d) { return d.x + "px"; })
		   .style("top", function(d) { return d.y + "px"; })
		   .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
		   .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
	 }
	 
	function truncateText(d, width, height) {
		var smallarea = d.area < .0005;
		var smallw = (d.dx / width) < .02;
		var smallh = (d.dy / height) < .02;

		if (smallw || smallh || smallarea) return "";
		return d.name;
	}

	return treemap;
}

function intToHex(i) {
    var hex = parseInt(i).toString(16);
    return (hex.length < 2) ? "0" + hex : hex;
}

function hsvToRgb(h,s,v) {

    var s = s / 100,
         v = v / 100;

    var hi = Math.floor((h/60) % 6);
    var f = (h / 60) - hi;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    var rgb = [];

    switch (hi) {
        case 0: rgb = [v,t,p];break;
        case 1: rgb = [q,v,p];break;
        case 2: rgb = [p,v,t];break;
        case 3: rgb = [p,q,v];break;
        case 4: rgb = [t,p,v];break;
        case 5: rgb = [v,p,q];break;
    }

    var r = Math.min(255, Math.round(rgb[0]*256)),
        g = Math.min(255, Math.round(rgb[1]*256)),
        b = Math.min(255, Math.round(rgb[2]*256));

    return "#" + intToHex(r) + intToHex(g) + intToHex(b);

}	

// Finds the first depth where there are two or more children. 
function findFirstSplit(d, currentDepth) {
	if(d.children.length > 2) return currentDepth;
	else return findFirstSplit(d.children[0], currentDepth + 1);
}
	
// Bubbles up "loc", "bugcount", "bugdates" metrics to node d. 
function reduceChild(d) {
    var bugcount = 0;
	var loc = 0;
    var dates = [];
    if (d.children) {
        var index;
        for (index = 0; index < d.children.length; index++) {
            var child = d.children[index];
            var r = reduceChild(child);
            bugcount += r.bugcount;
			loc += r.loc;
            dates = dates.concat(r.bugdates);
        }
    } else {
        return {
			loc: d.loc,
            bugcount: d.bugcount,
            bugdates: d.bugdates
        }
    }

    return {
		loc: loc,
        bugcount: bugcount,
        bugdates: dates
    }
}

// Truncates the tree, bubbling up data for nodes below truncateDepth.
function truncateTree(d, currentDepth, truncateDepth) {
    if (d.children) {
        if (currentDepth === truncateDepth) {
            var r = reduceChild(d);
			d.loc = r.loc;
            d.bugcount = r.bugcount;
            d.bugdates = r.bugdates;
            delete d["children"];
        } else {
            var index;
            for (index = 0; index < d.children.length; index++) {
                truncateTree(d.children[index], currentDepth + 1, truncateDepth);
            }
        }
    } else if (currentDepth === truncateDepth) {
        d.bugcount = d.bugcount;
        d.bugdates = d.bugdates;
		d.loc = d.loc;
    }
}


