// slider.js
// depends on: jquery, jquery-ui

// Defines the TimeSlider class - a dual slider between two javascript dates built on jquery.
//
// Public API: slider.min, slider.max, slider.location, slider.draw, slider.hide, slider.show
// Requires an HTML setup like this:

/*
<div id=location>    	   
	<div id=location +"-min"></div>
	<div id=location +"-max"></div>
	<div id=location +"-left"></div>
	<div id=location +"-right"></div>
</div>

Note: In future can create min,max,left,right divs for users dynamically instead of them specifying it in HTML. 
*/

function TimeSlider(location, stopCallback, slideCallback) {
 
    var location = location;
    var callback = callback;
    var tOffset = "-23px";
    var lOffset = 2.1;
    var pDif = 5;
	var min = 0;
    var max = 1;
	var minLabel = $(location + "-min");
	var maxLabel = $(location + "-max");
	var leftLabel = $(location + "-left");
	var rightLabel = $(location + "-right");

    function slider() {
        $(location).slider({
            range: true,
            min: min,
            max: max,
            values: [min, max],

            slide: function (event, ui) {
                onMove(event, ui);
                slideCallback(ui.values[0], ui.values[1]);
            },

            stop: function (event, ui) {
                onMove(event, ui);
                stopCallback(ui.values[0], ui.values[1]);
            }

        });

        minLabel.text(displayDate(new Date(min)) + " (first bug fix)");
        maxLabel.text(displayDate(new Date(max)) + " (latest bug fix)");
    }

    
    function onMove(event, ui) {
        var handle = $(".ui-slider-handle");
        var lp = handle[0].style.left;
        var rp = handle[1].style.left;
        var lv = parseFloat(lp.substring(0, lp.length - 1));
        var rv = parseFloat(rp.substring(0, rp.length - 1));
        var dif = rv - lv;

        if (dif > pDif) {
            leftLabel.text(displayDate(new Date(ui.values[0])));
            leftLabel.css("left", (lv - lOffset).toString() + "%");
            leftLabel.css("top", tOffset);
        } else {
            leftLabel.text("");
        }

        rightLabel.text(displayDate(new Date(ui.values[1])));
        rightLabel.css("left", (rv - lOffset).toString() + "%");
        rightLabel.css("top", tOffset);
    }

    slider.draw = function () {
        slider();
        return slider;
    }

    slider.min = function (value) {
        if (!arguments.length) return min;
        min = value;
        return slider;
    };

    slider.max = function (value) {
        if (!arguments.length) return max;
        max = value;
        return slider;
    };

    slider.location = function (value) {
        if (!arguments.length) return location;
        location = value;
        return slider;
    };
	
	slider.hide = function() {
		$(location).hide();
		return slider;
	}
	
	slider.show = function() {
		$(location).show();
		return slider;
	}
	
	function displayDate(date) {
		var year = date.getUTCFullYear();
		var month = date.getUTCMonth();
		var day = date.getUTCDate();
		return (month+1) + "/" + day + "/" + year;
	}

    return slider;
    
}