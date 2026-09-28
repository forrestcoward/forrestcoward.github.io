(() => {
    'use strict';

    const status = document.getElementById('map-status');
    const loadButton = document.getElementById('map-load');
    const controls = document.getElementById('map-controls');
    const canvas = document.getElementById('route-map');
    const dialog = document.getElementById('map-photo-dialog');
    const viewerImage = document.getElementById('map-photo-image');
    const viewerTitle = document.getElementById('map-photo-title');
    const viewerLocation = document.getElementById('map-photo-location');
    const viewerOriginal = document.getElementById('map-photo-original');
    const viewerError = document.getElementById('map-photo-error');
    const previousButton = document.getElementById('map-photo-previous');
    const nextButton = document.getElementById('map-photo-next');
    let selectedDay = 0;
    let visiblePhotos = [];
    let currentPhoto = 0;
    let map;

    function reportError(message, error) {
        status.textContent = message;
        status.classList.add('map-warning');
        console.error(message, error);
    }

    if (!window.L || typeof tamarackMapData === 'undefined') {
        reportError('The interactive map could not load. The trail-map photo and all daily galleries are still available below.',
            new Error('Missing Leaflet or route data'));
        return;
    }

    let photos;
    try {
        photos = tamarackMapData.photos.map(photo => {
            const link = document.querySelector(`.photo a[href="images/${photo.file}"]`);
            if (!link) {
                throw new Error(`Missing gallery photo: ${photo.file}`);
            }
            const image = link.querySelector('img');
            const caption = link.closest('figure').querySelector('figcaption');
            const [folder, filename] = photo.file.split('/');
            return {
                ...photo,
                original: link.getAttribute('href'),
                preview: image.getAttribute('src'),
                thumbnail: `images/${folder}/thumbs/${filename}`,
                alt: image.alt,
                caption: caption.textContent.trim()
            };
        });
    } catch (error) {
        reportError('Photo locations could not be matched to the gallery. Please use the photos below.', error);
        return;
    }

    function locationText(photo) {
        const source = photo.source === 'gps' ? 'Location from photo GPS' : 'Estimated photo location';
        return `${source}. ${photo.note || ''}`.trim();
    }

    function updateViewer() {
        const photo = visiblePhotos[currentPhoto];
        viewerTitle.textContent = photo.caption;
        viewerImage.alt = photo.alt;
        viewerError.hidden = true;
        viewerImage.src = photo.preview;
        viewerOriginal.href = photo.original;
        viewerLocation.textContent = `Day ${photo.day} gallery. ${locationText(photo)}`;
        document.getElementById('map-photo-counter').textContent =
            `${currentPhoto + 1} of ${visiblePhotos.length}`;
        previousButton.disabled = currentPhoto === 0;
        nextButton.disabled = currentPhoto === visiblePhotos.length - 1;
    }

    function openPhoto(photo) {
        currentPhoto = visiblePhotos.indexOf(photo);
        updateViewer();
        dialog.showModal();
        document.body.classList.add('map-photo-open');
    }

    document.getElementById('map-photo-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => document.body.classList.remove('map-photo-open'));
    previousButton.addEventListener('click', () => {
        if (currentPhoto > 0) {
            currentPhoto--;
            updateViewer();
        }
    });
    nextButton.addEventListener('click', () => {
        if (currentPhoto < visiblePhotos.length - 1) {
            currentPhoto++;
            updateViewer();
        }
    });
    dialog.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            dialog.close();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            (event.key === 'ArrowLeft' ? previousButton : nextButton).click();
        }
    });
    viewerImage.addEventListener('error', () => {
        viewerError.hidden = false;
        console.error('Map photo preview failed to load:', viewerImage.src);
    });

    function makePopup(group) {
        const popup = document.createElement('div');
        popup.className = 'map-popup';
        const help = document.createElement('p');
        help.textContent = `${group.photos.length} photos near this area. Select a photo to enlarge it. Zoom in to separate nearby locations.`;
        popup.append(help);
        for (const photo of group.photos) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'map-photo-button';
            const image = document.createElement('img');
            image.src = photo.thumbnail;
            image.alt = '';
            const title = document.createElement('span');
            title.textContent = photo.caption;
            const location = document.createElement('small');
            location.textContent = locationText(photo);
            button.append(image, title, location);
            button.addEventListener('click', () => openPhoto(photo));
            popup.append(button);
        }
        return popup;
    }

    loadButton.hidden = false;
    status.textContent = 'Ready to explore. Load the map to request the OpenStreetMap basemap.';
    loadButton.addEventListener('click', () => {
        loadButton.disabled = true;
        try {
            canvas.hidden = false;
            map = L.map(canvas, { scrollWheelZoom: false, maxZoom: 18 });
            const tileFailures = new Set();
            const tiles = L.tileLayer(tamarackMapData.tileUrl, {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                referrerPolicy: 'strict-origin-when-cross-origin'
            });
            tiles.on('tileerror', event => {
                tileFailures.add(event.tile.src);
                status.classList.add('map-warning');
                status.textContent = 'Some map tiles could not load. Route sketches and photo markers still work; use the trail-map photo below for context.';
                console.warn('Map tile failed:', event.tile.src);
            });
            tiles.on('tileload', event => tileFailures.delete(event.tile.src));
            tiles.on('loading', () => tileFailures.clear());
            tiles.on('load', () => {
                if (tileFailures.size === 0) {
                    status.classList.remove('map-warning');
                    status.textContent = 'Basemap loaded. Dashed route lines are approximate, not a recorded track.';
                }
            });
            const localFile = window.location.protocol === 'file:';
            if (!localFile) {
                tiles.addTo(map);
            }
            L.control.scale({ imperial: true, metric: true }).addTo(map);
            const routeLayer = L.layerGroup().addTo(map);
            const stopLayer = L.layerGroup().addTo(map);
            const photoLayer = L.layerGroup().addTo(map);

            function renderPhotos() {
                photoLayer.clearLayers();
                const groups = groupMapPhotos(visiblePhotos, position => map.project(position, map.getZoom()));
                for (const group of groups) {
                    const photo = group.photos[0];
                    const estimated = group.photos.some(item => item.source === 'estimated');
                    const pin = document.createElement('span');
                    pin.className = `map-pin${estimated ? ' map-pin--estimated' : ''}`;
                    const image = document.createElement('img');
                    image.src = photo.thumbnail;
                    image.alt = '';
                    pin.append(image);
                    if (group.photos.length > 1) {
                        const count = document.createElement('span');
                        count.className = 'map-pin-count';
                        count.textContent = String(group.photos.length);
                        pin.append(count);
                    }
                    const title = group.photos.length === 1 ?
                        `${photo.caption} ${locationText(photo)}` :
                        `${group.photos.length} photos near this area${estimated ? ', including estimated locations' : ''}`;
                    const marker = L.marker(group.position, {
                        icon: L.divIcon({ html: pin, className: 'map-photo-icon', iconSize: [54, 54], iconAnchor: [27, 27] }),
                        title, alt: title, keyboard: true, riseOnHover: true
                    });
                    marker.on('add', () => {
                        const element = marker.getElement();
                        element.setAttribute('aria-label', title);
                        element.addEventListener('keydown', event => {
                            if (event.key === ' ') {
                                event.preventDefault();
                                marker.fire('click');
                            }
                        });
                    });
                    marker.addTo(photoLayer);
                    if (group.photos.length === 1) {
                        marker.on('click', () => openPhoto(photo));
                    } else {
                        marker.bindPopup(makePopup(group), { maxWidth: 260, minWidth: 200 });
                    }
                }
            }

            function selectDay(day) {
                selectedDay = day;
                visiblePhotos = photos.filter(photo => day === 0 || photo.day === day);
                const days = tamarackMapData.days.filter(item => day === 0 || item.id === day);
                routeLayer.clearLayers();
                stopLayer.clearLayers();
                map.closePopup();
                for (const route of days) {
                    L.polyline(route.points, {
                        color: route.color, weight: 4, opacity: .9, dashArray: '8 8'
                    }).bindTooltip(`Day ${route.id}: ${route.title} (approximate straight-line sketch)`).addTo(routeLayer);
                }
                for (const stop of tamarackMapData.stops.filter(item => day === 0 || item.days.includes(day))) {
                    L.circleMarker(stop.position, {
                        radius: 6, color: '#273e30', fillColor: '#fff', fillOpacity: 1, weight: 2
                    }).bindTooltip(stop.title).addTo(stopLayer);
                }
                for (const button of controls.querySelectorAll('[data-day]')) {
                    button.setAttribute('aria-pressed', String(Number(button.dataset.day) === day));
                }
                const bounds = L.latLngBounds([
                    ...days.flatMap(route => route.points), ...visiblePhotos.map(photo => photo.position)
                ]);
                map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14, animate: false });
                renderPhotos();
                document.getElementById('map-selection').textContent =
                    `${day === 0 ? 'All days' : `Day ${day}`}: ${visiblePhotos.length} photos.`;
            }

            for (const route of tamarackMapData.days) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'map-button';
                button.dataset.day = String(route.id);
                button.setAttribute('aria-pressed', 'false');
                const swatch = document.createElement('span');
                swatch.className = 'map-swatch';
                swatch.style.setProperty('--day-color', route.color);
                swatch.setAttribute('aria-hidden', 'true');
                button.append(swatch, `Day ${route.id}`);
                controls.insertBefore(button, document.getElementById('map-reset'));
            }
            controls.addEventListener('click', event => {
                const button = event.target.closest('button[data-day]');
                if (button) {
                    selectDay(Number(button.dataset.day));
                }
            });
            document.getElementById('map-reset').addEventListener('click', () => selectDay(selectedDay));
            map.on('zoomend', renderPhotos);
            controls.hidden = false;
            selectDay(0);
            loadButton.hidden = true;
            status.textContent = localFile ?
                'Local file preview: photo markers and route sketches work, but basemap tiles require viewing the site through an HTTP server or GitHub Pages.' :
                'Loading basemap tiles. The route and photo locations are ready.';
            status.classList.toggle('map-warning', localFile);
        } catch (error) {
            canvas.hidden = true;
            controls.hidden = true;
            loadButton.hidden = true;
            reportError('The interactive map could not be initialized. Please use the trail-map photo and daily galleries below.', error);
            if (map) {
                map.remove();
            }
        }
    }, { once: true });
})();
