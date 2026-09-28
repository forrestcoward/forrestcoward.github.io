/* GPS coordinates were read locally from the original photos' EXIF metadata.
 * Non-geotagged photos are estimates based on nearby geotagged shots and the itinerary.
 * Days follow the blog galleries, not EXIF dates (the Twin Lake sunrise is the next morning).
 * Routes are straight-line sketches through waypoints, NOT recorded or traced trails.
 * To add a photo, add its gallery figure and a location entry below. Generate a
 * thumbs/ JPEG from its oriented web/ copy, fitting within 240x240px at quality 80.
 * Leaflet 1.9.4 is vendored locally with its license; only basemap tiles use a remote service.
 * Public landmark source: OpenStreetMap contributors, https://www.openstreetmap.org/copyright
 * Lone/Twin camps: nodes 3044815062/3044810835; summit: node 2689328017;
 * Sage Pass: endpoint of way 449626147. Other endpoints use nearby photo GPS.
 */
const tamarackMapData = (() => {
    const rowe = [49.0577, -114.011617];
    const ridge = [49.066439, -114.0606];
    const summit = [49.0694, -114.0481];
    const lone = [49.089917, -114.131472];
    const twin = [49.134472, -114.154436];
    const sageJunction = [49.136928, -114.152616];
    const sage = [49.138963, -114.159314];
    const goat = [49.163514, -114.091394];
    const redRock = [49.130967, -114.027294];

    return {
        tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        days: [
            {
                id: 1, color: '#a34224', title: 'Rowe to Lone Lake via Mount Lineham',
                points: [rowe, [49.059128, -114.076325], ridge, summit, ridge, lone]
            },
            {
                id: 2, color: '#23673b', title: 'Lone Lake to Twin Lakes, with Sage Pass',
                points: [lone, twin, sageJunction, sage, sageJunction, twin]
            },
            {
                id: 3, color: '#7147a1', title: 'Twin Lakes to Goat Lake via Avion Ridge',
                points: [twin, sageJunction, [49.159133, -114.137994],
                    [49.159189, -114.120294], [49.157097, -114.114967],
                    [49.160994, -114.107339], goat]
            },
            {
                id: 4, color: '#2464a0', title: 'Goat Lake to Red Rock Canyon',
                points: [goat, [49.160722, -114.081192], redRock]
            }
        ],
        stops: [
            { title: 'Start: Rowe trailhead', position: rowe, days: [1] },
            { title: 'Mount Lineham summit', position: summit, days: [1] },
            { title: 'Night 1: Lone Lake', position: lone, days: [1, 2] },
            { title: 'Night 2: Twin Lakes', position: twin, days: [2, 3] },
            { title: 'Sage Pass', position: sage, days: [2] },
            { title: 'Night 3: Goat Lake', position: goat, days: [3, 4] },
            { title: 'Finish: Red Rock Canyon', position: redRock, days: [4] }
        ],
        photos: [
            { file: 'day-1/packing.jpg', day: 1, position: [49.128708, -114.026536], source: 'gps', note: 'Pre-hike packing near Red Rock; not part of the walking route.' },
            { file: 'day-1/we-begin.jpg', day: 1, position: rowe, source: 'estimated', note: 'Placed at the Rowe trailhead using the geotagged trail-map photo.' },
            { file: 'overall/trail-map.jpg', day: 1, position: rowe, source: 'gps', note: 'The map board at Rowe trailhead.' },
            { file: 'day-1/ascending-the-ridge.jpg', day: 1, position: [49.059128, -114.076325], source: 'gps' },
            { file: 'day-1/upper-lower-lakes.jpg', day: 1, position: [49.0649, -114.0665], source: 'estimated', note: 'Estimated viewpoint on the ridge above the Rowe Lakes; not the lakes themselves.' },
            { file: 'day-1/mount-lineham.jpg', day: 1, position: ridge, source: 'estimated', note: 'Estimated ridge viewpoint looking toward Mount Lineham, near the geotagged Lineham Lakes shot.' },
            { file: 'day-1/lineham-lakes.jpg', day: 1, position: ridge, source: 'gps' },
            { file: 'day-1/lineham-chess.jpg', day: 1, position: [49.069692, -114.047436], source: 'gps' },
            { file: 'day-1/vast-land.jpg', day: 1, position: [49.071, -114.086], source: 'estimated', note: 'Approximate position beyond Lineham Ridge toward Lone Lake; no photo GPS is available.' },
            { file: 'day-2/day-2-meadow.jpg', day: 2, position: [49.121214, -114.146628], source: 'gps' },
            { file: 'day-2/lower-twin-lake.jpg', day: 2, position: [49.132, -114.1515], source: 'estimated', note: 'Estimated lakeshore location in the Twin Lakes area.' },
            { file: 'day-2/monopoly-deal.jpg', day: 2, position: [49.134733, -114.154669], source: 'gps' },
            { file: 'day-2/upper-twin-lake-morning.jpg', day: 2, position: [49.131975, -114.153042], source: 'gps', note: 'The morning after the Twin Lakes overnight; grouped with Day 2 as in the blog.' },
            { file: 'day-3/larch-trees.jpg', day: 3, position: [49.159133, -114.137994], source: 'gps' },
            { file: 'day-3/more-larch.jpg', day: 3, position: [49.159133, -114.137994], source: 'estimated', note: 'Placed near the geotagged larch photo taken about two minutes earlier.' },
            { file: 'day-3/climbing-avion-ridge.jpg', day: 3, position: [49.159189, -114.120294], source: 'gps' },
            { file: 'day-3/avion-ridge-view-2.jpg', day: 3, position: [49.157097, -114.114967], source: 'gps' },
            { file: 'day-3/avion-ridge-view.jpg', day: 3, position: [49.157097, -114.114967], source: 'estimated', note: 'Placed near the geotagged ridge view taken about a minute earlier.' },
            { file: 'day-3/looking-back-on-avion-ridge.jpg', day: 3, position: [49.160994, -114.107339], source: 'gps' },
            { file: 'day-4/rock-overlooking-goat-lake.jpg', day: 4, position: [49.162758, -114.091089], source: 'gps' },
            { file: 'day-4/goat-lake.jpg', day: 4, position: goat, source: 'gps' },
            { file: 'day-4/goat-lake-2.jpg', day: 4, position: goat, source: 'estimated', note: 'Estimated lakeside meal location at Goat Lake using the nearby geotagged lake photo; no photo GPS is available.' },
            { file: 'day-4/descending-goat-lake.jpg', day: 4, position: [49.160722, -114.081192], source: 'gps' },
            { file: 'day-4/rat-got-into-car.jpg', day: 4, position: redRock, source: 'gps' }
        ]
    };
})();

// Group overlapping thumbnails at the current zoom without changing stored photo coordinates.
function groupMapPhotos(photos, project, radius = 64) {
    const groups = [];
    for (const photo of photos) {
        const point = project(photo.position);
        const group = groups.find(candidate =>
            Math.hypot(candidate.point.x - point.x, candidate.point.y - point.y) < radius);
        if (group) {
            group.photos.push(photo);
        } else {
            groups.push({ point, position: photo.position, photos: [photo] });
        }
    }
    return groups;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tamarackMapData, groupMapPhotos };
}
