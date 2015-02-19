    // d3.js implementation of Fortune's algorith.
	
	// Adapted from Nicolas Garcia Belmonte's JIT implementation:
    // http://blog.thejit.org/2010/02/12/voronoi-tessellation/
    // http://blog.thejit.org/assets/voronoijs/voronoi.js
    // See lib/jit/LICENSE for details.

    // Notes:
    //
    // This implementation does not clip the returned polygons, so if you want to
    // clip them to a particular shape you will need to do that either in SVG or by
    // post-processing with d3.geom.polygon's clip method.
    //
    // If any vertices are coincident or have NaN positions, the behavior of this
    // method is undefined. Most likely invalid polygons will be returned. You
    // should filter invalid points, and consolidate coincident points, before
    // computing the tessellation.

    /**
     * @param vertices [[x1, y1], [x2, y2], …]
     * @returns polygons [[[x1, y1], [x2, y2], …], …]
     */
    var doVoronoi = function (vertices) {
        var polygons = vertices.map(function () { return []; });

        d3_voronoi_tessellate(vertices, function (e) {
            var s1, s2, x1, x2, y1, y2;
				
            if (e.a === 1 && e.b >= 0) {
                s1 = e.ep.r;
                s2 = e.ep.l;
            } else {
                s1 = e.ep.l;
                s2 = e.ep.r;
            }
            if (e.a === 1) {
                y1 = s1 ? s1.y : -1e6;
                x1 = e.c - e.b * y1;
                y2 = s2 ? s2.y : 1e6;
                x2 = e.c - e.b * y2;
            } else {
                x1 = s1 ? s1.x : -1e6;
                y1 = e.c - e.a * x1;
                x2 = s2 ? s2.x : 1e6;
                y2 = e.c - e.a * x2;
            }
            var v1 = [x1, y1],
                v2 = [x2, y2];
				
            polygons[e.region.l.index].push(v1, v2);
            polygons[e.region.r.index].push(v1, v2);
        });

        // Reconnect the polygon segments into counterclockwise loops.
        return polygons.map(function (polygon, i) {
            var cx = vertices[i][0],
                cy = vertices[i][1];
            polygon.forEach(function (v) {
                v.angle = Math.atan2(v[0] - cx, v[1] - cy);
            });
            return polygon.sort(function (a, b) {
                return a.angle - b.angle;
            }).filter(function (d, i) {
                return !i || (d.angle - polygon[i - 1].angle > 1e-10);
            });
        });
    };

    var d3_voronoi_opposite = { "l": "r", "r": "l" };

    function d3_voronoi_tessellate(vertices, callback) {

        var Sites = {
            list: vertices
              .map(function (v, i) {
                  return {
                      index: i,
                      x: v[0],
                      y: v[1],
					  weight: v[2]
                  };
              })
			  // Sort by acsending y values first, then acsending x. 
              .sort(function (a, b) {
                  return a.y < b.y ? -1
                    : a.y > b.y ? 1
                    : a.x < b.x ? -1
                    : a.x > b.x ? 1
                    : 0;
              }),
            bottomSite: null
        };

        var EdgeList = {
            list: [],
            leftEnd: null,
            rightEnd: null,

            init: function () {
                EdgeList.leftEnd = EdgeList.createHalfEdge(null, "l");
                EdgeList.rightEnd = EdgeList.createHalfEdge(null, "l");
                EdgeList.leftEnd.r = EdgeList.rightEnd;
                EdgeList.rightEnd.l = EdgeList.leftEnd;
                EdgeList.list.unshift(EdgeList.leftEnd, EdgeList.rightEnd);
            },

			// Constructs a half edge object. 
            createHalfEdge: function (edge, side) {
                return {
                    edge: edge,
                    side: side,
                    vertex: null,
                    "l": null,
                    "r": null
                };
            },

			// he represents a half edge.
			// lb is a pointer into the binary tree. ??
            insert: function (lb, he) {
				// he.r = he.l = null
                he.l = lb;
                he.r = lb.r;
                lb.r.l = he;
                lb.r = he;
            },

			// site: site object
			// returns a half edge (leaf node?)
            leftBound: function (site) {
                var he = EdgeList.leftEnd;
				he = he.r;

				while(he != EdgeList.rightEnd && Geom.rightOf(he, site)) {
					he = he.r;
				}
				
                he = he.l;
                return he;
            },

            del: function (he) {
                he.l.r = he.r;
                he.r.l = he.l;
                he.edge = null;
            },

            right: function (he) {
                return he.r;
            },

            left: function (he) {
                return he.l;
            },

            leftRegion: function (he) {
                return he.edge == null
                    ? Sites.bottomSite
                    : he.edge.region[he.side];
            },

            rightRegion: function (he) {
                return he.edge == null
                    ? Sites.bottomSite
                    : he.edge.region[d3_voronoi_opposite[he.side]];
            }
        };

        var Geom = {

			// Returns an edge object that represents the line (in the form of ax + by = c) that bisects two sites.
            bisect: function (s1, s2) {
			
                var newEdge = {
                    region: { "l": s1, "r": s2 },
                    ep: { "l": null, "r": null }
                };
				
				var m = Geom.reciprocal(Geom.slope(s1, s2));
				var midpoint = Geom.midpoint(s1, s2);
				// y - y1 = m(x - x1) -> ax + y = c
				var a = -1 * m;
				var b = 1;
				var c = -1 * (m*midpoint.x - midpoint.y);
				
				newEdge.a = a;
				newEdge.b = b;
				newEdge.c = c;
				return newEdge;
				
            },

			// Returns a coordinate (x,y) that is the intersection of two half edge objects. 
            intersect: function (el1, el2) {
                var e1 = el1.edge,
                    e2 = el2.edge;
                if (!e1 || !e2 || (e1.region.r == e2.region.r)) {
                    return null;
                }
                var d = (e1.a * e2.b) - (e1.b * e2.a);
                if (Math.abs(d) < 1e-10) {
                    return null;
                }
                var xint = (e1.c * e2.b - e2.c * e1.b) / d,
                    yint = (e2.c * e1.a - e1.c * e2.a) / d,
                    e1r = e1.region.r,
                    e2r = e2.region.r,
                    el,
                    e;
					
				
                if ((e1r.y < e2r.y) || (e1r.y == e2r.y && e1r.x < e2r.x)) {
                    el = el1;
                    e = e1;
                } else {
                    el = el2;
                    e = e2;
                }
                var rightOfSite = (xint >= e.region.r.x);
				
                if ((rightOfSite && (el.side === "l")) || (!rightOfSite && (el.side === "r"))) {
                    return null;
                }
                return {
                    x: xint,
                    y: yint
                };
            },

			// Returns a bool.
            rightOf: function (he, p) {
                var e = he.edge,
                    topsite = e.region.r,
                    rightOfSite = (p.x > topsite.x);
					
                if (rightOfSite && (he.side === "l")) {
                    return 1; // true
                }
                if (!rightOfSite && (he.side === "r")) {
                    return 0; // false
                }
				
				var yl = e.c - e.a * p.x,
					t1 = p.y - yl,
					t2 = p.x - topsite.x,
					t3 = yl - topsite.y;

				above = (t1 * t1) > (t2 * t2 + t3 * t3);
                return he.side === "l" ? above : !above;
            },

			// Used to reconstruct the diagram.
            endPoint: function (edge, side, site) {
                edge.ep[side] = site;
                if (!edge.ep[d3_voronoi_opposite[side]]) return;
                callback(edge);
            },
			
			powerDistance: function(s1, s2) {
				return 0;
			},
			
			midpoint: function(a, b) {
				return {
					x: Math.abs((a.x + b.x) / 2),
					y: Math.abs((a.y + b.y) / 2)
				}
			},
			
			reciprocal: function(a) {
				return -1 * (1/a);
			},
			
			slope: function(a, b) {
				return (a.y-b.y)/(a.x-b.x);
			},
	
			// Computes the Euclidean distance between two coordinates (x, y)
            distance: function (s, t) {
                var dx = s.x - t.x,
                    dy = s.y - t.y;
				var r = Math.sqrt(dx * dx + dy * dy);
                return r;
            }
        };

		// Current state of the sweep line.
		// Only circle events get stored in the queue, site events get popped off of Sites (after being sorted)
        var EventQueue = {
            list: [],

			// half edge: the half edge to insert.
			// site: the site event. 
			// offset: y distance from the site to the center of the circle (the voronoi vortex).
            insert: function (he, site, offset) {
                he.vertex = site;
                he.ystar = site.y + offset;
				
                for (var i = 0, list = EventQueue.list, l = list.length; i < l; i++) {
                    var next = list[i];
                    if (he.ystar > next.ystar ||
                      (he.ystar == next.ystar && site.x > next.vertex.x)) {
                        continue;
                    } else {
                        break;
                    }
                }
                list.splice(i, 0, he);
            },

            del: function (he) {
                for (var i = 0, ls = EventQueue.list, l = ls.length; i < l && (ls[i] != he) ; ++i) { }
                ls.splice(i, 1);
            },

            empty: function () { return EventQueue.list.length === 0; },

            min: function () {
                var elem = EventQueue.list[0];
                return {
                    x: elem.vertex.x,
                    y: elem.ystar
                };
            },

            extractMin: function () {
				var r = EventQueue.list.shift();
                return r;
            }
        };

        EdgeList.init();
		// Get and draw the first site. 
        Sites.bottomSite = Sites.list.shift();
		// drawCircle(Sites.bottomSite.x, Sites.bottomSite.y, "blue");

        var newSite = Sites.list.shift(), newIntStar;
        var lbnd, rbnd, llbnd, rrbnd, bisector;
        var bot, top, temp, p, v;
        var e, pm;

        while (true) {
		
            if (!EventQueue.empty()) {
                newIntStar = EventQueue.min();
            }
			
            if (newSite && (EventQueue.empty()
              || newSite.y < newIntStar.y 
              || (newSite.y == newIntStar.y
              && newSite.x < newIntStar.x))) {
			  
                lbnd = EdgeList.leftBound(newSite);
                rbnd = EdgeList.right(lbnd);
				
                bot = EdgeList.rightRegion(lbnd);
                e = Geom.bisect(bot, newSite);		
				
                bisector = EdgeList.createHalfEdge(e, "l");
                EdgeList.insert(lbnd, bisector);
                p = Geom.intersect(lbnd, bisector);
                if (p) {
                    EventQueue.del(lbnd);
					var radius = Geom.distance(p, newSite);
                    EventQueue.insert(lbnd, p, radius);
                }
				
                lbnd = bisector;
                bisector = EdgeList.createHalfEdge(e, "r");
                EdgeList.insert(lbnd, bisector);
                p = Geom.intersect(bisector, rbnd);
                if (p) {
                    EventQueue.insert(bisector, p, Geom.distance(p, newSite));
                }
                newSite = Sites.list.shift();
				
            } else if (!EventQueue.empty()) { 
			
                lbnd = EventQueue.extractMin();
                llbnd = EdgeList.left(lbnd);
                rbnd = EdgeList.right(lbnd);
                rrbnd = EdgeList.right(rbnd);
                bot = EdgeList.leftRegion(lbnd);
                top = EdgeList.rightRegion(rbnd);
                v = lbnd.vertex;

                Geom.endPoint(lbnd.edge, lbnd.side, v);
                Geom.endPoint(rbnd.edge, rbnd.side, v);
                EdgeList.del(lbnd);
                EventQueue.del(rbnd);
                EdgeList.del(rbnd);
				
                pm = "l";
                if (bot.y > top.y) {
                    temp = bot;
                    bot = top;
                    top = temp;
                    pm = "r";
                }
				
                e = Geom.bisect(bot, top);
                bisector = EdgeList.createHalfEdge(e, pm);
				
                EdgeList.insert(llbnd, bisector);
                Geom.endPoint(e, d3_voronoi_opposite[pm], v);
				
                p = Geom.intersect(llbnd, bisector);
                if (p) {
                    EventQueue.del(llbnd);
                    EventQueue.insert(llbnd, p, Geom.distance(p, bot));
                }
                p = Geom.intersect(bisector, rrbnd);
                if (p) {
                    EventQueue.insert(bisector, p, Geom.distance(p, bot));
                }
            } else {
                break;
            }
        }//end while

        for (lbnd = EdgeList.right(EdgeList.leftEnd) ;
            lbnd != EdgeList.rightEnd;
            lbnd = EdgeList.right(lbnd)) {
            callback(lbnd.edge);
        }
    }

	
	
	