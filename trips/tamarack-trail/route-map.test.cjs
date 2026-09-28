const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { tamarackMapData: data, groupMapPhotos } = require('./route-map-data.js');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

test('every gallery original has exactly one map location and all image variants exist', () => {
    const originals = [...html.matchAll(/href="images\/((?:day-\d|overall)\/[^"/]+\.jpg)"/g)]
        .map(match => match[1]);
    assert.equal(originals.length, 24);
    assert.equal(new Set(data.photos.map(photo => photo.file)).size, data.photos.length);
    assert.deepEqual(data.photos.map(photo => photo.file).sort(), originals.sort());
    for (const photo of data.photos) {
        const [folder, name] = photo.file.split('/');
        for (const variant of [photo.file, `${folder}/web/${name}`, `${folder}/thumbs/${name}`]) {
            assert.ok(fs.existsSync(path.join(__dirname, 'images', variant)), variant);
        }
    }
});

test('GPS and estimated locations are explicit and within the trip area', () => {
    assert.equal(data.photos.filter(photo => photo.source === 'estimated').length, 8);
    assert.equal(data.photos.filter(photo => photo.source === 'gps').length, 16);
    for (const photo of data.photos) {
        assert.ok([1, 2, 3, 4].includes(photo.day));
        assert.ok(['gps', 'estimated'].includes(photo.source));
        if (photo.source === 'estimated') assert.ok(photo.note);
    }
    for (const [lat, lon] of [
        ...data.photos.map(photo => photo.position),
        ...data.stops.map(stop => stop.position),
        ...data.days.flatMap(day => day.points)
    ]) {
        assert.ok(Number.isFinite(lat) && lat >= 49.04 && lat <= 49.18);
        assert.ok(Number.isFinite(lon) && lon >= -114.18 && lon <= -114.00);
    }
});

test('daily sketches join overnight stops, include summit/pass returns, and omit the transfer', () => {
    assert.deepEqual(data.days.map(day => day.id), [1, 2, 3, 4]);
    for (let i = 1; i < data.days.length; i++) {
        assert.deepEqual(data.days[i - 1].points.at(-1), data.days[i].points[0]);
    }
    const first = data.days[0].points;
    assert.deepEqual(first[2], first[4]);
    const second = data.days[1].points;
    assert.deepEqual(second[2], second[4]);
    assert.deepEqual(second[1], second.at(-1));
    assert.notDeepEqual(first[0], data.photos.find(photo => photo.file.endsWith('/packing.jpg')).position);
});

test('overlap groups preserve every photo and separate at higher zoom', () => {
    const photos = [
        { file: 'a', position: [0, 0] },
        { file: 'b', position: [1, 1] },
        { file: 'c', position: [100, 100] }
    ];
    const snapshot = JSON.stringify(photos);
    const project = ([x, y]) => ({ x, y });
    const groups = groupMapPhotos(photos, project);
    assert.deepEqual(groups.map(group => group.photos.length), [2, 1]);
    assert.deepEqual(groups.flatMap(group => group.photos), photos);
    assert.equal(groupMapPhotos(photos, ([x, y]) => ({ x: x * 100, y: y * 100 })).length, 3);
    assert.equal(JSON.stringify(photos), snapshot);
    assert.deepEqual(groupMapPhotos([], project), []);
});

test('co-located photos stay browsable and daily filters retain all matching photos', () => {
    for (let day = 0; day <= 4; day++) {
        const photos = data.photos.filter(photo => day === 0 || photo.day === day);
        const grouped = groupMapPhotos(photos, ([lat, lon]) => ({ x: lon * 10000, y: lat * 10000 }));
        assert.equal(grouped.flatMap(group => group.photos).length, photos.length);
        assert.ok(photos.length > 0);
    }
    const larches = data.photos.filter(photo => /larch/.test(photo.file));
    assert.equal(groupMapPhotos(larches, ([x, y]) => ({ x: x * 1e9, y: y * 1e9 })).length, 1);
});
