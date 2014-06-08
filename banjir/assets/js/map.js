//map.js - JavaScript for j247-web map

/**
	Transforms a number into a formatted, comma separated string. e.g. `1234567`
	becomes `"1,234,567"`.

	@function
	@param {number} x the number to be formatted
*/
var formatNumberAsString = function(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
	Add a popup to the provided layer based on the provided feature's text property

	@param {object} feature - a GeoJSON feature
	@param {L.ILayer} layer - the layer to attach the popup to
*/
var markerPopup = function(feature, layer) {
	if (feature.properties) {
		markerMap[feature.properties.pkey] = layer;
		//Create reference list of markers
		layer.bindPopup(feature.properties.text.parseURL());
	}
};

/**
	Add a text popup to the provided layer

	@param {object} feature - a GeoJSON feature
	@param {L.ILayer} layer - the layer to attach the popup to
*/
var uncomfirmedMarkerPopup = function(feature, layer) {
	if (feature.properties) {
		if (document.documentElement.lang == 'in') {
			layer.bindPopup('Laporan belum dikonfirmasi. Twit pesanmu dengan menyebutkan @petajkt #banjir');
		} else {
			layer.bindPopup('Unconfirmed report. To confirm tweet @petajkt #banjir');
		}
	}
};

/**
	Get a map overlay layer from the geoserver

	@param {string} layer - the layer to be fetched
	@return {L.TileLayer} layer - the layer that was fetched from the server
*/
var getOverlay = function(layer) {
	return L.tileLayer.betterWms("http://gallo.ad.uow.edu.au:8080/geoserver/petajakarta/wms", {
		layers: "petajakarta:" + layer,
		format: "image/png",
		transparent: true
	});
};

/**
	Get GeoJSON representing flooding reports from the server

	@param {string} type - the type of report to get: `'confirmed'` or `'uncomfirmed'`
	@param {function} callback - a function to be called when data is finished loading
*/
var getReports = function(type, callback) {
	jQuery.getJSON('http://localhost:8080/banjir/data/reports.json?type=' + type, function(data) {
		callback(data);
	});
};

/**
	Plots confirmed points on the map as circular markers

	@param {object} reports - a GeoJSON object containing report locations
*/
var loadConfirmedPoints = function(reports) {

	loadTable(reports); //sneaky loadTable function.

	window.confirmedPoints = L.geoJson(reports, {
		pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, style_confirmed);
		},
		onEachFeature: markerPopup
	}).addTo(map);

	if (document.documentElement.lang == 'in') {
		map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Infomasi</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Menampilkan  '+formatNumberAsString(reports.features.length)+' laporan dikonfirmasi terakhir</a>');
	} else {
		map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Information</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Showing '+formatNumberAsString(reports.features.length)+' confirmed reports</a>');
	}
	map.spin(false);
};

/**
	Plots unconfirmed points on the map as circular markers

	@param {object} reports - a GeoJSON object containing report locations
*/
var loadUnConfirmedPoints = function(reports) {
	var a = L.geoJson(reports, {
		pointToLayer: function (feature, latlng) {
				return L.circleMarker(latlng, styleUnconfirmed);
		}, onEachFeature: uncomfirmedMarkerPopup
	}).addTo(map);
};

/**
	Centre the map on a given location and open a popup's text box

	@param {string} pkey - the key of the marker to display
	@param {number} lat - latitude to center on
	@param {number} lon - longitude to center on
*/
var centreMapOnPopup = function(pkey,lat,lon) {
	var m = markerMap[pkey];
	map.setView(m._latlng, 17);
	m.openPopup();
};

/**
	Center the map on the user's location if they're in jakarta

	@param {Position} position - the user's position
*/
var setViewJakarta = function(position) {
	if (position.coords.latitude >= -6.4354 && position.coords.latitude <= -5.9029 &&
		  position.coords.longitude >= 106.5894 && position.coords.longitude <= 107.0782) {
		map.setView(L.latLng(position.coords.latitude,position.coords.longitude), 17); // Set to the users current view
	}
};

//Initialise map
var latlon = new L.LatLng(-6.1924, 106.8317); //Centre Jakarta
var map = L.map('map').setView(latlon, 12); // Initialise map

//Check user location and alter map view accordingly
map.locate({setView:false});
if ('geolocation' in navigator) {
	navigator.geolocation.getCurrentPosition(setViewJakarta);
}

//Load layers
map.spin(true);

var base0 = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png').addTo(map);
var base1 = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

var precip = L.tileLayer('http://{s}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
	opacity: 0.5
});

var pressure = L.tileLayer('http://{s}.tile.openweathermap.org/map/pressure_cntr/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
	opacity: 0.5
});

var temp = L.tileLayer('http://{s}.tile.openweathermap.org/map/temp/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
	opacity: 0.5
});

//Ancillary layers control
if (document.documentElement.lang == 'in') {
	var baseMaps = {
		"OpenStreetMap": base0,
		"OpenStreetMap (warna)":base1
	};
} else {
	var baseMaps = {
    	"Open Street Map (B&W)": base0,
			"Open Street Map (Colour)": base1
		};
	}

var markerMap = {}; //Reference list of markers stored outside of Leaflet

// Styles for confirmed and unconfirmed points
var styleUnconfirmed = {
    radius: 4,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

var style_confirmed = {
    radius: 4,
    fillColor: "blue",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// URL replacement in tweets
String.prototype.parseURL = function() {
	return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
		return "<a target='_blank' href='"+url+"'>"+url+"</a>";
	});
};

// Load reports
$(function() {
	getReports('unconfirmed', loadUnConfirmedPoints);
	getReports('confirmed', loadConfirmedPoints);

	var overlayMaps = {};
	var waterwaysLayer = getOverlay('waterways');

	waterwaysLayer.addTo(map);

	if (document.documentElement.lang == 'in') {
		overlayMaps['<img src="/banjir/img/river.svg" heigh="32"/> Sungai'] = waterwaysLayer;
		overlayMaps['<img src="/banjir/img/pump.svg" height="32" alt="Pumps icon"/> Pompa'] = getOverlay('pumps');
		overlayMaps['<img src="/banjir/img/floodgate.svg" height="32" alt="Floodgate icon"/> Pintu air'] = getOverlay('floodgates');
	} else {
		overlayMaps['<img src="/banjir/img/river.svg" heigh="32"/> Waterways'] = waterwaysLayer;
		overlayMaps['<img src="/banjir/img/pump.svg" height="32" alt="Pumps icon"/> Pumps'] = getOverlay('pumps');
		overlayMaps['<img src="/banjir/img/floodgate.svg" height="32" alt="Floodgate icon"/> Floodgates'] = getOverlay('floodgates');
	}

	var layers = L.control.layers(baseMaps, overlayMaps, {position: 'bottomleft'}).addTo(map);
});


// Hack in the symbols for reports
if (document.documentElement.lang == 'in') {
	$('.leaflet-control-layers-overlays').append('</div><label><div class=c></div><span>Laporan dikonfirmasi dari jam terakhir</span></label><label><div class=u></div><span>Laporan belum dikonfirmasi</span></label>');
} else {
	$('.leaflet-control-layers-overlays').append('<label><div class=c></div><span>Confirmed reports</span></label><label><div class=u></div><span>Unconfirmed reports</span></label>');
}
