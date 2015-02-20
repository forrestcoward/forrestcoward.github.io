// Draws a force diagram with the specified structure and layout.
// See https://github.com/mbostock/d3/wiki/Force-Layout for complete documentation on d3's force layout.
//
// graph: a mapping of strings to list of strings, encoding the visible links in graph
// hiddenGraph: a mapping of strings to list of strings, encoding hidden links in the graph (to help cluster certain nodes together that are not directly linked)
// width: the width of the diagram
// height: the height of the diagram
// id: the id of the element to place the diagram
// nodeClick: the node on click function
// nodeClass: the function that defines the class of each node
// layoutParameters: a dictionary of function/values that are passed to d3's force layout. If not provided, the default is used.
// The allowed keys are:
//      calculateNodeRadius: the function which calculates the radius of each node
//      calculateNodeCharge: the function which calculates the charge of each node (charge is global, and negative charge representions replusion)
//      calculateLinkDistance: the function which calculates/influences the distance of each link
//      calculateLinkStrength: the function which calculates the strength of each link (strength is a number between 0 and 1 inclusive)
//      friction: See d3 documentation, value between 0 and 1 inclusive
//      gravity: See d3 documentation, value greater than or equal to 0
//
function drawForceDiagram(graph, hiddenGraph, width, height, id, nodeClick, nodeClass, layoutParameters) {
    var links = [];
    var nodes = {};
    var outgoingLinks = {}; // Counts the number of outgoing links for each node
    var incomingLinks = {}; // Counts the number of incoming links for each node

    // Initialize the incoming/outgoing count dictionaries.
    for (var sku in graph) {
        var sourceName = sku;
        for (var index in graph[sku]) {
            var targetName = graph[sku][index]
            if (!(sourceName in incomingLinks)) { incomingLinks[sourceName] = 0; }
            if (!(sourceName in outgoingLinks)) { outgoingLinks[sourceName] = 0; }
            if (!(targetName in incomingLinks)) { incomingLinks[targetName] = 0; }
            if (!(targetName in outgoingLinks)) { outgoingLinks[targetName] = 0; }
        }
    }

    // Create the links, and also incoming/outgoing links for each node.
    for (var sku in graph) {
        var sourceName = sku;
        for (var index in graph[sku]) {
            var targetName = graph[sku][index];
            links.push({ source: sourceName, target: targetName, isLatent: false  });
            outgoingLinks[sourceName]++;
            incomingLinks[targetName]++;
        }
    }

    // Create the latent links, these are not included in the incoming/outgoing links count.
    for (var sku in hiddenGraph) {
        var sourceName = sku;
        for (var index in hiddenGraph[sku]) {
            var targetName = hiddenGraph[sku][index];
            links.push({ source: sourceName, target: targetName, isLatent: true });
        }
    }

    // Compute the nodes from the links.
    links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = { name: link.source, id: link.sourceId });
        link.target = nodes[link.target] || (nodes[link.target] = { name: link.target, id: link.targetId });
    });

    // Set some variables on each node that are accessible to the layout functions passed in.
    for (var key in nodes) {
        var node = nodes[key];
        node.incomingLinks = incomingLinks[key];
        node.outgoingLinks = outgoingLinks[key];
        node.links = node.incomingLinks + node.outgoingLinks;
    }

    // Create the force diagram.
    // See https://github.com/mbostock/d3/wiki/Force-Layout for complete documentation.
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height]);

    // Use supplied layout functions if they are provided.
    if ("calculateLinkDistance" in layoutParameters) force.linkDistance(layoutParameters["calculateLinkDistance"]);
    if ("calculateLinkStrength" in layoutParameters) force.linkStrength(layoutParameters["calculateLinkStrength"]);
    if ("calculateNodeCharge" in layoutParameters) force.charge(layoutParameters["calculateNodeCharge"]);
    if ("friction" in layoutParameters) force.friction(layoutParameters["friction"]);
    if ("gravity" in layoutParameters) force.gravity(layoutParameters["gravity"]);
    force.on("tick", tick).start();

    // Create the svg element for the diagram.
    var svg = d3.select(id).append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a path element for each link.
    var linkPathes = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) {
            if (!d.isLatent) { // Make the distinct between latent and non-latent links for visualization purposes.
                return "link-source-" + d.source["name"] + " link-target-" + d.target["name"];
            } else {
                return "link-source-latent" + d.source["name"] + " link-target-latent" + d.target["name"];
            }
        })
        .attr("fill", "none");

    calcNodeRadius = function (node) { return 3; }
    if ("calculateNodeRadius" in layoutParameters)
    {
        calcNodeRadius = layoutParameters["calculateNodeRadius"]
    }

    // Create a circle for each node.
    var circles = svg.selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("class", nodeClass)
        .attr("r", calculateNodeRadius)
        .on('mouseenter', function (d) {
            // On enter, show the node name, incoming, and outgoing links.
            d3.select(".text-" + d.name).text(d.name);
            d3.selectAll(".link-source-" + d.name).classed("link-source", true).attr("fill", "none");
            d3.selectAll(".link-target-" + d.name).classed("link-target", true).attr("fill", "none");
        })
        .on('mouseleave', function (d) {
            d3.select(".text-" + d.name).text("");
            d3.selectAll(".link-source-" + d.name).classed("link-source", false);
            d3.selectAll(".link-target-" + d.name).classed("link-target", false);
        })
        .on("click", nodeClick)
        .call(force.drag);

    // Create text for each node.
    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("class", function (d) { return "text-" + d.name; })
        .attr("x", 15)
        .attr("y", 12)
        .text(function (d) { return ""; });

    // Define how to update the simulation.
    function tick() {
        linkPathes.attr("d", link);
        circles.attr("transform", transform);
        text.attr("transform", transform);
    }

    function link(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        // This defines an arc, but the style is set so the arc is not filled in, only the stroke, making it look like an elliptical line.
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
}