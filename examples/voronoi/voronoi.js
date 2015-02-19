
// Incomplete. There is no output. Instead, all voronoi vertices are drawn in red. See drawCircle function in main.js
function VoronoiTessellation(vertices) {

	var sites = {
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
		  })
	};
	
	function flip(side) {
		return side === "l" ? "r" : "l";
	}
	
	// Orders sites by y-coordinate.
	function PriorityQueue() {
	
		function queue() { }
		var events = [];
		
		queue.insert = function (event, type, arc) {			
			event.type = type;
			if(type === "circle") 
				event.arc = arc;
				
			for (var i = 0; i < events.length; i++) {
				var next = events[i];
				if (event.y > next.y ||(event.y == next.y && event.x > next.x)) continue;
				else break;
			}
			events.splice(i, 0, event);
			return event;
		}

		queue.remove = function (event) {
		
			var i;
			for (i = 0; i < events.length; i++) { 
				if(events[i] === event)
					break;
			}
			events.splice(i, 1);
		}

		queue.empty = function () { return events.length === 0; },

		queue.pop = function () {
			var event = events.shift();
			return event;
		}
		
		return queue;
	};	
	
	// Mathematical operations.
	var Geometry = {

		/*
		 * Returns the perpendicular bisector of two points in the form of ax + by = c as the triplet (a,b,c).
		 */
		bisect: function (s1, s2) {
			
			var m = Geometry.reciprocal(Geometry.slope(s1, s2));
			var midpoint = Geometry.midpoint(s1, s2);
			// y - y1 = m(x - x1) -> ax + y = c
			var a = -1 * m;
			var b = 1;
			var c = -1 * (m*midpoint.x - midpoint.y);
			
			return {
				a : a,
				b : b,
				c : c
			}
		},

		findCircleEvent: function(l, m, r, currentY) {
			
			if(!l || !m || !r || (l.p.x === r.p.x && l.p.y === r.p.y))
				return null;
				
			var e1 = Geometry.bisect(l.p, m.p);
			var e2 = Geometry.bisect(m.p, r.p);
			
			// Parallel vertical lines. 
			if(e2.a - e1.a === 0) 
				return null
			
			// Intersection of two lines.
			var x = (e2.c - e1.c) / (e2.a - e1.a);
			var y = e1.c - e1.a * x;
			
			var center = { x: x, y: y };
			
			// Breakpoint divergence tests.
			// Has difficulty with degenerate situation where the sites are on a common horizontal line.
			// See http://davidpritchard.org/graphics/msc_courses/cpsc516/report.pdf
			if(l.p.y > m.p.y) {
				if(center.x < l.p.x) return null;
			} else {
				if(center.x > m.p.x) return null;
			}
			
			if(m.p.y > r.p.y) {
				if(center.x < m.p.x) return null;
			} else {
				if(center.x > r.p.x) return null;
			}
			
			// We are converging!
			var radius = Geometry.distance(center, m.p); // or l.p or r.p
			
			if((center.y + radius).toFixed(6) <= parseFloat((currentY).toFixed(6)))
				return null;
			
			return { x: center.x, y: center.y + radius, r: radius };			
				
		},
		
		/*
		 * lp: the point representing the left region (the point responsible for the arc left of the breakpoint)
		 * rp: the point representing the right region 
		 * bisector: perpendicular bisector of lp and rp
		 * z: the y position of the sweep line
		 *
		 * Returns the x position of the breakpoint of interest (either the left or right breakpoint)
		 *
		 * The problem: Given two points A&B and the position of a horizontal line y=z, find the
		 * centers of the two circles that pass through A&B and is tangent w.r.t to line y=z.
		 * If A and B are Voronoi sites, and z is the y position of the sweep line, the centers of
		 * these circles represent the current position of the two breakpoints. Note that the
		 * perpendicular bisector of A&B must pass through the center of both circles. 
		 * 
		 * Here is an explanation of the mathmetics which has been precalculated for the general case:
		 *  http://math.stackexchange.com/questions/101986/how-to-determine-an-equation-of-a-circle-using-a-line-and-two-points-on-a-circle
		*/
		breakpoint: function (lp, rp, bisector, z) {
		
			var x = lp.x;
			var y = lp.y;
			var a = bisector.a;
			var c = bisector.c;	
			
			// Solve qA*x^2 + qB*x + qC = 0
			var qA = -1;
			var qB = 2*z*a + 2*x -2*y*a;
			var qC = parseFloat((-1 * (x*x + y*y - z*z + 2*z*c - 2*y*c)).toFixed(4));
			var roots = Geometry.roots(qA, qB, qC);	
			
			if(lp.y > rp.y) 
				return Math.max(roots.r1, roots.r2);
			else 
				return Math.min(roots.r1, roots.r2)
		},
		
		//Quadratic equation forumla. 
		roots: function(a, b, c) {
			var r1 = ((b*-1)+Math.sqrt((Math.pow(b,2))-4*a*c))/(2*a);
			var r2 = ((b*-1)-Math.sqrt((Math.pow(b,2))-4*a*c))/(2*a);
			return { r1: r1, r2: r2 };
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

		distance: function (s, t) {
			var dx = s.x - t.x,
				dy = s.y - t.y;
			return Math.sqrt(dx * dx + dy * dy);
		}
	};

	// Just a binary tree. leaves are arcs. inner nodes are breakpoints.
	function BeachLine() {
	
		function beachLine() { }
		var root = null;
		var empty = true;
		
		beachLine.empty = function() {
			return empty;
		}
		
		beachLine.initialInsert = function(p) {
			if(root === null) {
				root = createArc(p, null);
			}
			empty = false;
		}
		
		/*
		 * brokenArc: a leaf node (an arc) of the beach line
		 * newSite: the new site event
		 * edge: the perpendicular bisector of brokenArc.p and (newSite.x, newSite.y)
		 *
		 * Splits a single arc into three arcs. This means a leaf node
		 * is transformed into a subtree containing two inner nodes (two new breakpoints).
		 */
		beachLine.split = function(brokenArc, newSite, edge) {

			var newP = { x: newSite.x, y: newSite.y };		
			var lbp = createBp(brokenArc.p, newP, edge, brokenArc.side);
			var rbp = createBp(newP, brokenArc.p, edge, "r");
			lbp.r = rbp;
			rbp.parent = lbp;
			lbp.l = createArc(brokenArc.p, "l");
			lbp.l.parent = lbp;
			var newArc = createArc(newP, "l");
			rbp.l = newArc;
			rbp.l.parent = rbp;
			rbp.r = createArc(brokenArc.p, "r");
			rbp.r.parent = rbp;
			
			if(brokenArc.parent) {
				brokenArc.parent[brokenArc.side] = lbp;
				lbp.parent = brokenArc.parent;
			}
			else root = lbp;
			
			return {
				l: lbp.l,
				m: newArc,
				r: rbp.r
			}
		}
		
		// Removes the arc deleteArc from the tree.
		// Probably the most difficult part to understand. 
		beachLine.remove = function(deleteArc, y) {
			
			var lArc = this.leftArc(deleteArc);
			var rArc = this.rightArc(deleteArc);
		
			var grandParent;
			if(deleteArc.side === "l")
				grandParent = commonAncestor(deleteArc, lArc);
			else 
				grandParent = commonAncestor(deleteArc, rArc);
					
			grandParent.regions.l = lArc.p;
			grandParent.regions.r = rArc.p;
			grandParent.edge = Geometry.bisect(lArc.p, rArc.p);
		
			var removed = deleteArc.parent;
			
			// The node opposite of deleteArc is being moved, so its side may need to be adjusted. 
			removed[flip(deleteArc.side)].side = removed.side;
			
			// Removes the breakpoint from the tree.
			// Conceptually this line does this:
			// If we have A <-> B <-> C, then A is changed to point at C (B is the variable removed).
			removed.parent[removed.side] = removed[flip(deleteArc.side)];
			// But C still has a link to B, so point C at A.
			removed[flip(deleteArc.side)].parent = removed.parent;
			// Now we have A <-> C, but C may have switched sides in the tree, so fix it.
			// It will just be the side of removed.
			removed[flip(deleteArc.side)].side = removed.side;
			
			return {
				l: lArc,
				r: rArc
			}
		}
					
		/*
		 * Returns the arc (a leaf in the tree) that is above the given location.
 		 * In other terms, imagine a vertical ray shooting up from the site...
		 * which arc does it hit?
		 *
		 * This performs a binary search on the breakpoints (the internal nodes)
		 * to reach the leaf.
		 */
		beachLine.search = function(site) {
			return bpSearch(site, root);
		}
		
		// Logic for beachLine.search
		function bpSearch(site, node) {
			if(!node.l && !node.r) 
				return node;
				
			var breakpoint = Geometry.breakpoint(node.regions.l, node.regions.r, node.edge, site.y);
			
			// Binary search on the breakpoints.
			if(breakpoint > site.x) 
				return bpSearch(site, node.l);
			else if(breakpoint < site.x) 
				return bpSearch(site, node.r);
		}
		
		// Returns the arc right of arc or null if arc is the right-most arc.
		// Go one leaf right.
		beachLine.rightArc = function(arc) {
			var node = arc;
			while(node.side === "r" || node.side === null) {
				if(!node.parent) return null;
				node = node.parent;
			}
			node = node.parent.r;
			while(node.type != "arc") node = node.l;
			return node;		
		}
		
		// Returns the arc left of arc or null if arc is the left-most arc.
		// Go one leaf left.
		beachLine.leftArc = function(arc) {
			var node = arc;
			while(node.side === "l" || node.side === null) {
				if(!node.parent) return null;
				else node = node.parent;
			}
			node = node.parent.l;
			while(node.type != "arc") node = node.r;
			return node;
		}
		
		// Returns the left-most arc.
		beachLine.leftMostArc = function() {
			var node = root;
			while(node.type === "breakpoint")
				node = node.l;
			return node;
		}
				
		function depth(node) {
			d = 0;
			while(node.parent) {
				node = node.parent;
				d++;
			}
			return d;
		}
		
		// Find the first common ancestor of two nodes.
		// Used in delete to rearrange tree.
		function commonAncestor(n1, n2) {
			var d1 = depth(n1);
			var d2 = depth(n2);
			
			if(d1 === d2) 
				return walkUpTree(n1, n2);
				
			// Adjust depths to the same level.
			var lower, higher, lowerNode, higherNode;
			d1 < d2 ? 
				(lower = d2, lowerNode = n2, higher = d1, higherNode = n1) : 
				(lower = d1, lowerNode = n1, higher = d2, higherNode = n2);
			
			while(lower > higher) {
				lowerNode = lowerNode.parent;
				lower -= 1;
			}
			
			return walkUpTree(lowerNode, higherNode);
		}
		
		// Helper to commonAncestor.
		function walkUpTree(n1, n2) {
			while(n1 != n2) {
				n1 = n1.parent;
				n2 = n2.parent;
			}
			return n1; // or n2.
		}
		
		// Create a leaf node (arc) in the tree.
		function createArc(p, side) {
			return {
				p: p,
				parent: null,	
				side: side,
				type: "arc"
			}
		}
		
		// Create an inner node (breakpoint) in the tree.
		function createBp(l, r, edge, side) {
			return {
				regions: {
					l: l,
					r: r
				},
				edge: edge,
				side: side,
				parent: null,
				type: "breakpoint"
			}
		}

		return beachLine;
	}
	
	// ALGORITHM START.
	
	// Initialize data structures.
	queue = PriorityQueue();
	beach = BeachLine();
	
	// Add all sites to the queue.
	for(var i = 0; i < sites.list.length; i++) 
		queue.insert(sites.list[i], "site");
	
	while(!queue.empty()) {
		var event = queue.pop();
		if(event.type === "site") 
			handleSiteEvent(event);
		if(event.type === "circle") 
			handleCircleEvent(event);
	}
	
	function handleSiteEvent(event) {
		
		drawCircle(event.x, event.y, "blue"); //defined in main.js
		
		if(beach.empty()) {
			beach.initialInsert({ x: event.x, y: event.y });
			return;
		}
		
		var brokenArc = beach.search(event);
		
		if(brokenArc.event) {
			queue.remove(brokenArc.event);
			brokenArc.event = null;
		}
		
		var edge = Geometry.bisect(brokenArc.p, event);
		var arcs = beach.split(brokenArc, event, edge);
		var rr = beach.rightArc(arcs.r);
		var ll = beach.leftArc(arcs.l);
		var r = arcs.r, m = arcs.m, l = arcs.l;
		
		// We now have 5 consecutive arcs: ll, l, m, r, rr
		// The triples we must check are (ll, l, m) and (m, r, rr).
		// We don't need to check (l, m, r) because l and r come from the same parabola.
		
		// Check the triple where m is the left arc.
		checkTriple(m, r, rr, event.y);			
		// Check the triple where m is the right arc.
		checkTriple(ll, l, m, event.y);
	}
	
	function handleCircleEvent(event) {
		var deleteArc = event.arc;
		drawCircle(event.x, event.y - event.r, "red") // defined in main.js
		var neighborsOfRemoved = beach.remove(deleteArc, event.y);
		var l = neighborsOfRemoved.l;
		var r = neighborsOfRemoved.r;
						
		// Delete circle events on l and r. Note that m was already handled because we pulled it from the queue.
		if(l.event)
			queue.remove(l.event);
			l.event = null;
		if(r.event)
			queue.remove(r.event);
			r.event = null;
		
		var rr = beach.rightArc(r);
		var ll = beach.leftArc(l);
		
		// We now have 4 consecutive arcs: ll, l, r, rr (m was removed).
		// The triples we must check are (ll, l, r) and (l, r, rr).
		
		// Check the triple where l is the middle arc.
		checkTriple(ll, l, r, event.y);
		// Check the triple where r is the middle arc.
		checkTriple(l, r, rr, event.y);
				
	}

	// Checks for a valid circle event among three arcs and adds to the queue. 
	function checkTriple(l, m, r, y) {
		var validCircleEvent = Geometry.findCircleEvent(l, m, r, y);
		if(validCircleEvent) {
			var newEvent = queue.insert(validCircleEvent, "circle", m);
			m.event = newEvent;
		}
	}
}



