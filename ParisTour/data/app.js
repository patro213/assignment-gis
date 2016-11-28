var mapGeo;
var directions;
var circle = null;
var gRadius = 50;
var myLayer = null;
var myLayer1 = null;
var heat = null;
var river = null;
var checkedInAppendData = [];
var geoJsonHeatMapArray = [];
var lat, lng;
var listingEl = document.getElementById('feature-listing');
var gSelectedCheckboxTypes = [];
var directionsLayer = null;
var directionsRoutesControl = null;
var clicked = false;

self.port.on("initMap", function () {
    L.mapbox.accessToken = 'pk.eyJ1IjoicGF0cm8yMTMiLCJhIjoiY2l0cmJhanA1MDAwazJ1cGs0c3doY3BqOSJ9.gTljHHCJgabGk8Y1Dvp9nA';
    var map = L.mapbox.map('map', 'mapbox.streets').setView([48.85449395305341, 2.348155975341797], 12);
    mapGeo = map;

    directions = L.mapbox.directions({
        profile: 'mapbox.walking',
        system: 'metric'
    });

    console.log("Map initialization: OK");
    self.port.emit("initCheckboxes");
    self.port.on("initCheckboxesReturn", function (selectedCheckboxTypes) {
        gSelectedCheckboxTypes = selectedCheckboxTypes;
    });
    console.log("Checkbox initialization: OK");
    mapGeo.on('click', function (t) {
        lat = t.latlng.lat;
        lng = t.latlng.lng;
        showCircle(lat, lng, gRadius * 10);
        if (gSelectedCheckboxTypes != 0) showSelectedData(lat, lng, gRadius * 10, gSelectedCheckboxTypes);
    });
});

self.port.on('checkedCheckboxes', function (selectedCheckboxTypes) {
    gSelectedCheckboxTypes = selectedCheckboxTypes;
    if (circle != null) {
        if (selectedCheckboxTypes.length != 0) {
            checkedInAppendData = [];
            if (myLayer != null) mapGeo.removeLayer(myLayer);
            if (myLayer1 != null) mapGeo.removeLayer(myLayer1);
            showSelectedData(lat, lng, gRadius * 10, gSelectedCheckboxTypes);
        }
        else {
            if (myLayer != null) mapGeo.removeLayer(myLayer);
            if (myLayer1 != null) mapGeo.removeLayer(myLayer1);
            $('#appendData').hide();
            mapGeo.removeLayer(circle);
            circle = null;
        }
    }
});

self.port.on('sliderChange', function (radius) {
    showCircle(lat, lng, radius * 10);
    if (gSelectedCheckboxTypes != 0 && circle != null) showSelectedData(lat, lng, radius * 10, gSelectedCheckboxTypes);
    gRadius = radius;
});

self.port.on('findHotels', function () {
    if (checkedInAppendData.length != 0) {
        findHotels();
    }
    else {
        self.port.emit("noPlaceChcecked");
    }
});

self.port.on('showHeatMap', function (show) {
    if (show) {
        showHeatMap();
    }
    else {
        if (heat != null) mapGeo.removeLayer(heat);
    }
});

self.port.on('showRiver', function (show) {
    if (show) {
        showRiver();
    }
    else {
        if (river != null) mapGeo.removeLayer(river);
    }
});

function showCircle(lat, lng, radius) {
    if (myLayer != null) mapGeo.removeLayer(myLayer);
    if (myLayer1 != null) mapGeo.removeLayer(myLayer1);
    if (circle != null) mapGeo.removeLayer(circle);
    checkedInAppendData = [];

    if (lat != null && lng != null) {
        circle = L.circle([lat, lng], radius, {
            color: 'red',
            opacity: 0.3,
            fillColor: 'red',
            fillOpacity: 0.3
        }).addTo(mapGeo);
    }
}

function showSelectedData(lat, lng, radius, selectedCheckboxTypes) {
    var radiusData = {
        lat: lat,
        lng: lng,
        radius: radius,
        selectedTypes: selectedCheckboxTypes
    };

    var jsonRadiusData = JSON.stringify(radiusData);

    $.ajax({
        url: "http://localhost:8080/showSelectedData",
        type: 'POST',
        dataType: 'json',
        data: jsonRadiusData,
        contentType: 'application/json',
        mimeType: 'application/json',
        success: function (data, textStatus, jqXHR) {

            if (myLayer != null) mapGeo.removeLayer(myLayer);
            if (river != null) mapGeo.removeLayer(river);
            if (directionsLayer != null) mapGeo.removeLayer(directionsLayer);
            $('#distance').hide();
            myLayer = addDataToMap(data);

            appendData(data);

            self.port.emit('hideRiverText');

        },
        error: function (
            data, status, er) {
            alert("error: " + data + " status: " + status + " er:" + er);
        }
    });
}

function findHotels() {
    var pointWithTypeAndTitleArray = [];
    checkedInAppendData.forEach(function (element) {
        pointWithTypeAndTitleArray.push(new PointWithTypeAndTitle(
            element.geometry.coordinates[0],
            element.geometry.coordinates[1]
        ));
    });

    var jsonPointWithTypeAndTitleArray = JSON.stringify(pointWithTypeAndTitleArray);

    $.ajax({
        url: "http://localhost:8080/findHotels",
        type: 'POST',
        dataType: 'json',
        data: jsonPointWithTypeAndTitleArray,
        contentType: 'application/json',
        mimeType: 'application/json',
        success: function (data, textStatus, jqXHR) {

            if (myLayer != null) mapGeo.removeLayer(myLayer);

            myLayer = addDataToMap(data);
        },
        error: function (data, status, er) {
            alert("error: " + data + " status: " + status + " er:" + er);
        }
    });
}

function showHeatMap() {
    $.ajax({
        url: "http://localhost:8080/heatMap",
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        mimeType: 'application/json',
        success: function (data, textStatus, jqXHR) {
            geoJsonHeatMapArray = [];
            data.forEach(createHeatMapPointsFromData);

            heat = L.heatLayer(geoJsonHeatMapArray, {
                radius: 25,
                blur: 5,
                maxZoom: 18,
                gradient: {0.4: 'blue', 0.5: 'lime', 0.6: 'yellow', 0.7: 'yellow', 0.8: 'red'}
            }).addTo(mapGeo);
        },
        error: function (data, status, er) {
            alert("error: " + data + " status: " + status + " er:" + er);
        }
    });
}

function showRiver() {

    var radiusData = {
        lat: lat,
        lng: lng,
        radius: gRadius * 10
    };

    var jsonRadiusData = JSON.stringify(radiusData);

    $.ajax({
        url: "http://localhost:8080/showRiver",
        type: 'POST',
        dataType: 'json',
        data: jsonRadiusData,
        contentType: 'application/json',
        mimeType: 'application/json',
        success: function (data, textStatus, jqXHR) {

            river = addDataToMap(data);

        },
        error: function (data, status, er) {
            alert("error: " + data + " status: " + status + " er:" + er);
        }
    });
}

function appendData(features) {
    $("#feature-listing").empty();

    if (features.length) {
        $('#appendData').show();
        features.forEach(function (feature) {
            var prop = feature.prop;
            var item = document.createElement('a');
            item.target = '_blank';
            item.textContent = prop.title;
            item.addEventListener('mouseover', function () {
                if (myLayer != null) mapGeo.removeLayer(myLayer);
                if (directionsLayer != null) mapGeo.removeLayer(directionsLayer);
                myLayer = addDataToMap(feature);
            });
            item.addEventListener('click', function () {
                if (item.style.background == "red none repeat scroll 0% 0%") {
                    var i = checkedInAppendData.indexOf(feature);
                    if (i != -1) {
                        checkedInAppendData.splice(i, 1);
                    }
                    item.style.background = "#f8f8f8";
                    item.style.color = "black";
                    item.style.fontWeight = "normal";
                }
                else {
                    checkedInAppendData.push(feature);
                    item.style.background = "red";
                    item.style.color = "white";
                    item.style.fontWeight = "800";
                }
            });
            item.addEventListener('mouseout', function () {
                if (checkedInAppendData.length != 0) {
                    if (myLayer != null) mapGeo.removeLayer(myLayer);
                    if (myLayer1 != null) mapGeo.removeLayer(myLayer1);
                    myLayer1 = addDataToMap(checkedInAppendData)
                }
                else {
                    if (myLayer != null) mapGeo.removeLayer(myLayer);
                    if (myLayer1 != null) mapGeo.removeLayer(myLayer1);
                    myLayer = addDataToMap(features)
                }
            });
            listingEl.appendChild(item);
        });
    }
    else {
        $('#appendData').hide();
    }
}

function createHeatMapPointsFromData(item, index) {
    geoJsonHeatMapArray.push([item.coordinates[1], item.coordinates[0]]);
}

function markerSymbolOption(symbol) {
    return L.icon({
        iconUrl: './marker-symbols/' + symbol + '.png',
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -28]
    });
}

function popupContent(feature, latlng) {
    return "<strong>" + feature.prop.title + "</strong> " + "<br>" + feature.prop.markersymbol + "<br>" + "<strong>Poloha:</strong> " + degToDms(latlng.lat) + " - " + degToDms(latlng.lng);
}

function addDataToMap(feature) {
    return L.geoJson(feature, {
        pointToLayer: function (feature, latlng) {
            switch (feature.prop.markersymbol) {
                case 'cinema':
                    return bindMarker(feature, latlng, "cinema");
                case 'theatre':
                    return bindMarker(feature, latlng, "theatre");
                case 'bar':
                    return bindMarker(feature, latlng, "bar");
                case 'hotel':
                    return bindMarker(feature, latlng, "hotel");
                case 'museum':
                    return bindMarker(feature, latlng, "museum");
                case 'gallery':
                    return bindMarker(feature, latlng, "gallery");
            }
        }
    }).addTo(mapGeo);
}

function PointWithTypeAndTitle(lng, lat) {
    this.lng = lng;
    this.lat = lat;
}

function degToDms(deg) {
    var d = Math.floor(deg);
    var minfloat = (deg - d) * 60;
    var m = Math.floor(minfloat);
    var secfloat = (minfloat - m) * 60;
    var s = Math.round(secfloat);

    if (s == 60) {
        m++;
        s = 0;
    }
    if (m == 60) {
        d++;
        m = 0;
    }
    return (d + "°" + m + "'" + s + "\"");
}

function bindMarker(feature, latlng, markersymbol) {
    return L.marker(latlng, {icon: markerSymbolOption(markersymbol)})
        .bindPopup(popupContent(feature, latlng), {closeButton: false})
        .on('mouseover', function (e) {
            this.openPopup();
        })
        .on('mouseout', function (e) {
            this.closePopup();
        })
        .on('click', function (e) {
            if (!clicked) {
                if (directionsLayer != null) mapGeo.removeLayer(directionsLayer);
                directions.setOrigin(L.latLng(latlng.lat, latlng.lng));
                clicked = true;
            }
            else if (clicked) {
                directions.setDestination(L.latLng(latlng.lat, latlng.lng));
                var opts = {
                    callback: function (e) {
                        $('#distance').text("Dĺžka trasy: " + distanceFormat(e.distance)).show();
                    }
                };
                directions.query(opts);
                directionsLayer = L.mapbox.directions.layer(directions).addTo(mapGeo);
                directionsRoutesControl = L.mapbox.directions.routesControl('routes', directions).addTo(mapGeo);
                clicked = false;
            }
        });
}

function distanceFormat(m) {
    if (m >= 100000) return (m / 1000).toFixed(0) + ' km';
    if (m >= 10000) return (m / 1000).toFixed(1) + ' km';
    if (m >= 1000) return (m / 1000).toFixed(2) + ' km';
    if (m >= 100) return (m ).toFixed(1) + ' m';
    return m.toFixed(0) + ' m';
}