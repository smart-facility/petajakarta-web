//map.js - JavaScript for j247-web map

//Initialise map
var latlon = new L.LatLng(-6.1924, 106.8317); //Centre Jakarta
var map = L.map('map').setView(latlon, 12); // Initialise map

//Check user location and alter map view accordingly
map.locate({setView:false});
if (navigator.geolocation) {
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
var overlayMaps = { /* not adding weather data at the moment */ };

var markerMap = {}; //Reference list of markers stored outside of Leaflet

// Styles for confirmed and unconfirmed points
var style_unconfirmed = {
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

// Style for waterways
var rivers = {
    "color": "blue",
    "weight": 2,
    "opacity": 0.65
};

// URL replacement in tweets
String.prototype.parseURL = function() {
	return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
		return "<a target='_blank' href='"+url+"'>"+url+"</a>";
	});
};

// Pretty number printing
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

//Add tweet message to popup
function markerPopup(feature, layer) {
	if (feature.properties) {
		markerMap[feature.properties.pkey] = layer;
		//Create reference list of markers
		layer.bindPopup(feature.properties.text.parseURL());
	}
}

function ucMarkerPopup(feature, layer) {
	if (feature.properties) {
		if (document.documentElement.lang == 'in') {
			layer.bindPopup('Laporan belum dikonfirmasi. Twit pesanmu dengan menyebutkan @petajkt #banjir');
		}
		else {
			layer.bindPopup('Unconfirmed report. To confirm tweet @petajkt #banjir');
		}
	}
}

//Get floodgates infrastructure
function getFloodgates() {
	floodgates = L.tileLayer.betterWms("http://gallo.ad.uow.edu.au:8080/geoserver/petajakarta/wms", {
    layers: 'petajakarta:floodgates',
    format: 'image/png',
    transparent: true,
    //attribution: "Floodgates © 2014 SMART Facility"
	});

	//Add to custom legend

	if (document.documentElement.lang == 'in') {
		overlayMaps['<img src="/img/floodgate.svg" height="32" alt="Floodgate icon"/> Pintu air'] = floodgates;
		}
	else {
		overlayMaps['<img src="/img/floodgate.svg" height="32" alt="Floodgate icon"/> Floodgates'] = floodgates;
		}
}

//Get floodgates infrastructure
function getPumps() {
	pumps = L.tileLayer.betterWms("http://gallo.ad.uow.edu.au:8080/geoserver/petajakarta/wms", {
    layers: 'petajakarta:pumps',
    format: 'image/png',
    transparent: true,
    //attribution: "Pumps © 2014 SMART Facility"
	});

	if (document.documentElement.lang == 'in') {
		overlayMaps['<img src="/img/pump.svg" height="32" alt="Pumps icon"/> Pompa'] = pumps;
	}
	else {
		overlayMaps['<img src="/img/pump.svg" height="32" alt="Pumps icon"/> Pumps'] = pumps;
		}
}

//Get waterways infrastructure
function getWaterways() {
waterways = L.tileLayer.betterWms("http://gallo.ad.uow.edu.au:8080/geoserver/petajakarta/wms", {
    layers: 'petajakarta:waterways',
    format: 'image/png',
    transparent: true,
    //attribution: "Waterways © 2014 SMART Facility"
	});

	//Load floodgates seperate to layers control
	waterways.addTo(map);

	if (document.documentElement.lang == 'in') {
		overlayMaps['<img src="/img/river.svg" heigh="32"/> Sungai'] = waterways;
	}
	else {
		overlayMaps['<img src="/img/river.svg" heigh="32"/> Waterways'] = waterways;
		}
}

//Get confirmed reports
function getConfirmedReports(callback, err) {
	jQuery.getJSON('http://petajakarta.org/banjir/data/reports.json?type=confirmed', function(data, err) {
		callback(data);
	});
}

//Get unconfirmed reports
function getUnConfirmedReports(callback, err) {
	jQuery.getJSON('http://petajakarta.org/banjir/data/reports.json?type=unconfirmed', function(data, err) {
		callback(data);
	});
}

//Create a map of tweets using Cluster Markers plugin - not currenty used.
function loadClusters(reports) {
	if (reports.features) {

		//loadTable(reports); //sneaky loadTable function...

		//Initialise empty marker group
		clusterMarkers = new L.markerClusterGroup();
		//Create markers from geoJson
		var clusterLayer = L.geoJson(reports, {onEachFeature:markerPopup});
		clusterMarkers.addLayer(clusterLayer);

		map.addLayer(clusterMarkers);

		$("#count").text('Showing '+numberWithCommas(reports.features.length)+' reports from the past hour');
		map.spin(false);
	}
}

//Put confirmed points on the map
function loadConfirmedPoints(reports) {

	loadTable(reports); //sneaky loadTable function.

	window.confirmedPoints = L.geoJson(reports, {
		pointToLayer: function(feature, latlng) {
			return L.circleMarker(latlng, style_confirmed);
		},
		onEachFeature: markerPopup
	}).addTo(map);

	if (document.documentElement.lang == 'in') {
		map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Infomasi</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Menampilkan  '+numberWithCommas(reports.features.length)+' laporan dikonfirmasi terakhir</a>');
	} else {
		map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Information</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Showing '+numberWithCommas(reports.features.length)+' confirmed reports</a>');
	}
	map.spin(false);
}

//Put unconfirmed points on the map
function loadUnConfirmedPoints(reports) {
	var a= L.geoJson(reports, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, style_unconfirmed);
		}, onEachFeature: ucMarkerPopup
	}).addTo(map);
}

//Centre the map on a given popup and open the text box
function centreMapOnPopup(pkey,lat,lon) {
	var m = markerMap[pkey];
	map.setView(m._latlng, 17);
	m.openPopup();
}

//Check if user location is in Jakarta and set map view accordingly
function setViewJakarta(e) {
	if (e.coords.latitude >= -6.4354 && e.coords.latitude <= -5.9029 && e.coords.longitude >= 106.5894 && e.coords.longitude <= 107.0782) {
		map.setView(L.latLng(e.coords.latitude,e.coords.longitude), 17); // Set to the users current view
	}
}

// Load reports
window.onload=getUnConfirmedReports(loadUnConfirmedPoints);getConfirmedReports(loadConfirmedPoints);getWaterways();getFloodgates();getPumps();var layers = L.control.layers(baseMaps, overlayMaps, {position: 'bottomleft'}).addTo(map);

// Hack in the symbols for reports
if (document.documentElement.lang == 'in') {
	$('.leaflet-control-layers-overlays').append('</div><label><div class=c></div><span>Laporan dikonfirmasi dari jam terakhir</span></label><label><div class=u></div><span>Laporan belum dikonfirmasi</span></label>');
} else {
	$('.leaflet-control-layers-overlays').append('<label><div class=c></div><span>Confirmed reports</span></label><label><div class=u></div><span>Unconfirmed reports</span></label>');
}
