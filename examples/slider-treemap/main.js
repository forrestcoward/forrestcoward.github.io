
var minTime = 1286321136837;
var maxTime =  1344384147997;

var normalTreemap;
var truncatedTreemap;
var slider;

function main() {
	
	var showTrunc = function() {
		normalTreemap.hide();
		truncatedTreemap.show();
	}
	
	var hideTrunc = function() {
		normalTreemap.show();
		truncatedTreemap.hide();	
	}
		
	var stopcb = function(min, max) { 
		minTime = min;
		maxTime = max;	

		var valueFunc = createBugValueFunc(min, max)
		normalTreemap.transition(valueFunc, 0, hideTrunc);
		truncatedTreemap.transition(valueFunc, 0);
	};
	
	var slidecb = function (min, max) { 
		showTrunc();
		truncatedTreemap.transition(createBugValueFunc(min, max), 300)
	};
	
	slider = TimeSlider("#slider", stopcb, slidecb).min(minTime).max(maxTime).draw();
	treemapBug(agile);
	//treemapLoc(agile);

}

function createBugValueFunc(min, max) {
	return function(d) {
		return numBugsInRange(d.bugdates, min, max);
	}
}

function getLayoutSize() {
    var v = document.getElementById("chart");
    return {
        width: v.offsetWidth,
        height: v.offsetHeight
    };
}

function numBugsInRange(bugdates, min, max) {
    var i, v = 0;
    for (i = 0; i < bugdates.length; i++) {
        var bugdate = new Date(bugdates[i]).getTime();
        if (bugdate >= min && bugdate <= max) {
            v++;
        }
    }
    return v;
}

function treemapBug(data) {

	var bugInfo = {
		max: maxTime,
		min: minTime
	}
	
	var valueFunc =  createBugValueFunc(bugInfo.min, bugInfo.max);
	var nameFunc = function (d) { return d.fullname; };
	var metric = "bugcount";
	var grouping = "file";
	var filters = ["agile"];
	
	var nDrawArgs = {
		metric: metric,
		grouping: grouping,
		valueFunc: valueFunc,
		nameFunc: nameFunc,
		sticky: true,
		bugInfo: bugInfo
	}
	
	normalTreemap = Treemap(data, "#chart", getLayoutSize());
	normalTreemap.draw(nDrawArgs);
	
	var tDrawArgs = nDrawArgs;
	tDrawArgs.truncateDepth = 8;
	
	truncatedTreemap = Treemap(data, "#trunc", getLayoutSize());
	truncatedTreemap.hide();
	truncatedTreemap.draw(tDrawArgs);
}

function treemapLoc(data) {
	
	var bugInfo = {
		max: maxTime,
		min: minTime
	}
	
	var valueFunc =  function (d) { return d.loc; };
	var nameFunc = function (d) { return d.fullname; };
	var metric = "loc";
	var grouping = "file";
	var filters = ["agile"];
	
	var drawArgs = {
		metric: metric,
		grouping: grouping,
		valueFunc: valueFunc,
		nameFunc: nameFunc,
		filterFunc: filterByNameFunc,
		filters: filters
	}
	
	locTreemap = Treemap(data, "#loc", getLayoutSize());
	locTreemap.draw(drawArgs);
}