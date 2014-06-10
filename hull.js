// concave hull

// get angle <prev - this - next>
L.LatLng.prototype.getAngle = function (prev, next){
    if(next.x == this.x && next.y == this.y)
        return -9000;
    if(next.x == prev.x && next.y == prev.y)
        return -360.0;
    angle = (Math.atan2(next.y - this.y, next.x - this.x) - Math.atan2(prev.y - this.y, prev.x - this.x)) * 180 / Math.PI;
    while (angle < 0)
        angle += 360.0;
    return angle;
}

L.LatLng.prototype.distance2 = function (other){
    var xx = this.x - other.x;
    var yy = this.y - other.y
    return xx*xx + yy*yy;
}

Array.prototype.pointInPolygon = function (point) {
/*    (c) https://github.com/substack/point-in-polygon
       ray-casting algorithm based on
       http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
*/
    var inside = false;
    for (var i = 0, j = this.length - 1; i < this.length; j = i++) {
        var xi = this[i].x, yi = this[i].y;
        var xj = this[j].x, yj = this[j].y;
        var intersect = ((yi > point.y) != (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

function ccw(p0, p1, p2){
    var epsilon = 1e-13;

    var dx1 = p1.x - p0.x;
    var dy1 = p1.y - p0.y;
    var dx2 = p2.x - p0.x;
    var dy2 = p2.y - p0.y;
    var d = dx1 * dy2 - dy1 * dx2;
    if(d > epsilon) return 1;
    if(d < -epsilon) return -1;
    if((dx1*dx2 < -epsilon) || (dy1*dy2 < -epsilon)) return -1;
    if((dx1*dx1+dy1*dy1) < (dx2*dx2+dy2*dy2)+epsilon) return 1;
    return 0;
}

function intersect(p1, p2, q1, q2){
    if( (p1.x == q1.x && p1.y == q1.y || p2.x == q2.x && p2.y == q2.y ) || 
        (p1.x == q2.x && p1.y == q2.y || p2.x == q1.x && p2.y == q1.y ))
            return false;

    return (ccw(p1,p2,q1) * ccw(p1,p2,q2) <=0) && (ccw(q1,q2,p1) * ccw(q1,q2,p2) <=0);
}
Array.prototype.intersect = function(p){
    for(var i = 1, l = this.length - 1; i < l; i++){
        if(intersect(this[i - 1], this[i], this[l], p))
            return true;
    }
    return false;
}
Array.prototype.concaveHull = function(maxDistance2){
    if(this.length <= 3)
        return this;
    var byY = this.slice();
    byY.sort(function(a, b){ return b.y - a.y;});
    if(DEBUG){
        var str = ""
        for(var i = 0, l = byY.length; i < l; i++)
            str +=  byY[i].name + ", "
        console.log("points: "+str);
    }
    var hull = [];

    var start = byY[0];
    if(DEBUG) console.log("start: "+start.name)
    hull.push(start);
    var curr = start;
    var prev = {};
    prev.y = curr.y;
    prev.x = curr.x + 1;
//    if(DEBUG)L.circleMarker(prev,{color:"#F00", radius:5, fillOpacity:1}).addTo(map);    

    var next;
    var count = 0;
    while(true){
        count++;
        if(DEBUG)L.circleMarker(curr,{color:"#F00", radius:3, fillOpacity:1}).addTo(map);
        byAngle = this.slice().sort(function(a, b){return curr.getAngle(prev, b) - curr.getAngle(prev, a);})

        if(DEBUG1){
            console.log("prev: "+prev.name)
            console.log("curr: "+curr.name)
            var str = ""
            for(var i = 0, l = byY.length; i < l; i++)
                str +=  byAngle[i].name + ":"+curr.getAngle(prev, byAngle[i])+", "
            console.log("points by angle: "+str);
        }
        for(var i = 0, l = byAngle.length; i < l; i++){
            if(DEBUG1) console.log(""+byAngle[i].name + ": " + 
                curr.distance2(byAngle[i]) + "("+curr.distanceTo(byAngle[i])+")" +
                (curr.distance2(byAngle[i]) > maxDistance2 ? "x" : "") + 
                " : "+hull.intersect(byAngle[i]));

            if(curr.distance2(byAngle[i]) < maxDistance2 && !hull.intersect(byAngle[i])){
                next = byAngle[i];
                break;
            }
        }

        if(!next){
            console.log("No poligon found!");
            return hull;
        }

        if(next == curr){
            console.log("something goes wrong...");
            return hull;
        }
        hull.push(next);
        if(DEBUG) {
            console.log("" + curr.name +"->"+next.name);
            L.polyline([curr, next], {color: 'red'}).addTo(map);
        }
        if(next == start){
            console.log("Done.");
            return hull;
        }

        prev = curr;
        curr = next;
        next = undefined;

        if(count > 1000){
            console.log("something goes very wrong...");
            return hull;
        }
    }
    return hull;
}
