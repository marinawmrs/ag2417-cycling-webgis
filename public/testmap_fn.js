/**
 * ------------------------------------------------------------------------
 * File:        app.js.
 * Description: JS functions for visualising test map & pumps with pop-ups
 * Author:      marinawiemers
 * Created:     2025-09-22
 * Notes:       -
 * ------------------------------------------------------------------------
 */

var map = L.map('mapid');
var pumps_geojson;
var pumps_markers;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function onEachFeature(feature, layer) {
    if (feature.properties) {
        var popupContent = "Pump Name: " + feature.properties.name +
                           "<br>Address: " + feature.properties.address +
        layer.bindPopup(popupContent);
    }
}

function load_markers() {
    if(pumps_markers) {
        map.removeLayer(pumps_markers)
    }
    $.ajax({
        type: 'GET',
        url: '/api/get_pumps_geojson',
        async: false,
        success: function(data) {
            pumps_geojson = data
            pumps_markers=L.geoJSON(data, {onEachFeature:onEachFeature})
        }
    });
    if(pumps_markers) {
        pumps_markers.addTo(map);
        const bbox = turf.bbox(pumps_geojson);
        const southWest = [bbox[1], bbox[0]];
        const northEast = [bbox[3], bbox[2]];
        const bounds = L.latLngBounds(southWest, northEast);
        map.fitBounds(bounds);
    }
}
load_markers();






