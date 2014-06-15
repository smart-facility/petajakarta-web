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
	Get GeoJSON representing counts of reports in RW polygons
	@param {function} callback - a function to be called when data is finished loading
	@param {level} string - administrative boundary level to load. Can be 'rw' or 'village', also passed to load function for identification
*/
var getAggregates = function(level, callback){
	jQuery.getJSON('http://localhost:8080/banjir/data/aggregates.json?level='+level, function(data) {
		callback(level, data);
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
	Plots counts of reports in RW polygons

	@param {string} level - string - administrative boundary level to load. Can be 'rw' or 'village', should be passed from getfunction
	@param {object} aggregates - a GeoJSON object containing polygon features
*/

var aggregate_layers = {};

var loadAggregates = function(level, aggregates){
	var agg_layer = L.geoJson(aggregates, {style:styleAggregates, onEachFeature:labelAggregates}).addTo(map);
	aggregate_layers[level] = agg_layer;
};

/**
	Styles counts of reports in RW polygons

	@param {object} feature - individual Leaflet/GeoJSON feature object
	*/
function styleAggregates(feature) {
    return {
        fillColor: getColor(feature.properties.count),
        weight: 0.8,
        opacity: 1,
        color: 'white',
        //dashArray: '3',
        fillOpacity: 0.7
    };
}

/**
	Return a colour based on input number - based on Color Brewer

	@param {integer} d - number representing some attribute (e.g. count)

*/
function getColor(d) {
    return d > 30 ? '#800026' :
           d > 25  ? '#BD0026' :
           d > 20  ? '#E31A1C' :
           d > 15  ? '#FC4E2A' :
           d > 10   ? '#FD8D3C' :
           d > 5   ? '#FEB24C' :
           d > 1   ? '#FED976' :
                      '#FFEDA0';
}

/**
	Set a popup label for an aggregate poplygon based on it's count attribute

	@param {object} feature - individual Leaflet/GeoJSON object
	@param {object}	layer - leaflet layer object
*/
function labelAggregates(feature, layer) {
		// commented pop up label as working on touch/info box
    // does this feature have a property named count?
  	/*if (feature.properties && feature.properties.count && feature.properties.level_name) {
        layer.bindPopup(JSON.stringify(feature.properties.level_name+': '+feature.properties.count+' reports'));
    }*/
		layer.on({
			mouseover: highlightAggregate,
			mouseout: resetAggregate,
			click: zoomToFeature
		});
}

/**
	Visual highlighting of polygon when hovered over with the mouse

	@param {object} event - leaflet event object
*/
function highlightAggregate(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }

		info.update(layer.feature.properties);
}

/**
	Reset style of aggregate after hover over

	@param {object} event - leaflet event object
*/
function resetAggregate(e){
	var layer = e.target;

	layer.setStyle(styleAggregates(layer.feature));
	//console.log(layer);

	info.update();
}


function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

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

/**
	Information box for aggregate details
*/
var info = L.control();
//Create info box
info.onAdd = function(map){
	this._div = L.DomUtil.create('div', 'info'); // Create a div with class info
	this.update();
	return this._div;
};

//Update info box
info.update = function(properties){

		this._div.innerHTML = '<h4>Number of reports</h4><br>'+(properties ? properties.level_name+': '+properties.count+' reports' : 'Hover over an area');
};

//Initialise map
var latlon = new L.LatLng(-6.1924, 106.8317); //Centre Jakarta
var map = L.map('map').setView(latlon, 12); // Initialise map

//Check user location and alter map view accordingly
map.locate({setView:false});
if ('geolocation' in navigator) {
	navigator.geolocation.getCurrentPosition(setViewJakarta);
}

//Add info box
info.addTo(map);

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
	getAggregates('rw', loadAggregates);

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

/**
	Listen for map zoom events and load required layers
*/
map.on('zoomend', function(e){

	var zoom  = map.getZoom();
	console.log((aggregate_layers.rw));
	//if (zoom >= 13){
	//	getAggregates('rw', loadAggregates);
	//	console.log('>=13');
	//}

	//console.log(JSON.stringify(window.aggregates));
	if (zoom < 13){
		//if (window.aggregates && window.aggregates.rw){
			if (aggregate_layers.rw){
				map.removeLayer(aggregate_layers.rw);
			}
		}
	else if (zoom >= 13){
		aggregate_layers.rw.addTo(map);
	}

});
