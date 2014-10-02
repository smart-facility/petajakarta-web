//map.js - JavaScript for PetaJakarta web map

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
var getInfrastructure = function(layer) {
	return new RSVP.Promise(function(resolve, reject){
		// Use live data
		jQuery.getJSON("http://petajakarta.org/banjir/data/api/v1/infrastructure/"+layer+"?format=topojson", function(data){
				if (data.features !== null){
					resolve(topojson.feature(data, data.objects.collection));
				} else {
					resolve(null);
				}
		});
	});
};

/**
	Add a text popup to the provided layer

	@param {object} feature - a GeoJSON feature
	@param {L.ILayer} layer - the layer to attach the popup to
*/
var infrastructureMarkerPopup = function(feature, layer){
	if (feature.properties){
		layer.bindPopup(feature.properties.name);
	}
};

/**
	Get TopoJSON representing flooding reports from the server

	@param {string} type - the type of report to get: `'confirmed'` or `'uncomfirmed'`
	@param {function} callback - a function to be called when data is finished loading

	Converts TopoJson to GeoJson using topojson
*/
var getReports = function(type) {
	return new RSVP.Promise(function(resolve, reject) {
		// Use live data
		jQuery.getJSON('http://petajakarta.org/banjir/data/api/v1/reports/'+type+'?format=topojson', function(data) {
		// Use fixture data
		// jQuery.getJSON('http://localhost:31338/' + type + '_reports.json', function(data) {
			if (data.features !== null){
				//Convert topojson back to geojson for Leaflet
				resolve(topojson.feature(data, data.objects.collection));
			} else {
				resolve(null);
			}
		});
	});

};


/**
	Get GeoJSON representing counts of reports in RW polygons
	@param {function} callback - a function to be called when data is finished loading
	@param {level} string - administrative boundary level to load. Can be 'rw' or 'village', also passed to load function for identification
*/
var getAggregates = function(level) {
	return new RSVP.Promise(function(resolve, reject) {
		jQuery.getJSON('http://petajakarta.org/banjir/data/api/v1/aggregates/live?format=topojson&level='+level, function(data) {
			resolve(topojson.feature(data, data.objects.collection));
		});
	});
};

/**
	Plots confirmed points on the map as circular markers
	@param {object} reports - a GeoJSON object containing report locations
*/
var loadConfirmedPoints = function(reports) {
	if (reports) {
		loadTable(reports); //sneaky loadTable function.

		window.confirmedPoints = L.geoJson(reports, {
			pointToLayer: function(feature, latlng) {
				return L.circleMarker(latlng, styleConfirmed);
			},
			onEachFeature: markerPopup
		});

		if (document.documentElement.lang == 'in') {
			map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Infomasi</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Menampilkan  '+formatNumberAsString(reports.features.length)+' laporan dikonfirmasi terakhir</a>');
		} else {
			map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Information</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Showing '+formatNumberAsString(reports.features.length)+' confirmed reports</a>');
		}
	} else {
		window.confirmedPoints = L.geoJson();

		if (document.documentElement.lang == 'in') {
			map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Infomasi</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Menampilkan 0 laporan dikonfirmasi terakhir</a>');
		} else {
			map.attributionControl.setPrefix('<a data-toggle="modal" href="#infoModal" id="info">Information</a> | <a data-toggle="modal" href="#reportsModal" id="reports_link">Showing 0 confirmed reports</a>');
		}
	}

	return window.confirmedPoints;
};

/**
	Plots unconfirmed points on the map as circular markers

	@param {object} reports - a GeoJSON object containing report locations
*/
var loadUnconfirmedPoints = function(reports) {
	if (reports) {
		window.unconfirmedPoints = L.geoJson(reports, {
			pointToLayer: function (feature, latlng) {
					return L.circleMarker(latlng, styleUnconfirmed);
			}, onEachFeature: uncomfirmedMarkerPopup
		});
	} else {
		window.unconfirmedPoints = L.geoJson();
	}

	return window.unconfirmedPoints;
};

/**
	Plots counts of reports in RW polygons

	@param {string} level - string - administrative boundary level to load. Can be 'rw' or 'village', should be passed from getfunction
	@param {object} aggregates - a GeoJSON object containing polygon features
*/

var aggregateLayers = {};

var loadAggregates = function(level, aggregates){
	var aggregateLayer = L.geoJson(aggregates, {style:styleAggregates, onEachFeature:labelAggregates});
	aggregateLayers[level] = aggregateLayer;
	return aggregateLayers[level];
};

/**
	Plots hydrological infrastructure on map

	@param {string} layer - string - name of infrastructure layer to load
	@param {object} infrastructure - a GeoJSON object containing infrastructure features
*/

var loadInfrastructure = function(layer, infrastructure){
	if(infrastructure) {
		if (layer == 'waterways'){
			window[layer] = L.geoJson(infrastructure, {style:styleInfrastructure[layer]});
		}
		else {

			window[layer] = L.geoJson(infrastructure, {
				pointToLayer: function (feature, latlng){
					return L.marker(latlng, {icon: styleInfrastructure[layer]});
				}, onEachFeature: infrastructureMarkerPopup
			});
		}
	}
	else {
			window[layer] = L.geoJson();
	}

	return window[layer];
};

var styleInfrastructure = {

	waterways:{
		color:'#3960ac',
		weight:2.5,
		opacity:1,
	},
	pumps:L.icon({
		iconUrl: '/banjir/img/pump.svg',
		iconSize: [28,28],
		iconAnchor: [14, 14],
		popupAnchor: [0, 0],
	}),
	floodgates:L.icon({
		iconUrl: '/banjir/img/floodgate.svg',
		iconSize: [28,28],
		iconAnchor: [14, 14],
		popupAnchor: [0, 0],
	})
};

/**
	Styles counts of reports in RW polygons

	@param {object} feature - individual Leaflet/GeoJSON feature object
	*/
function styleAggregates(feature) {
    return {
        fillColor: getColor(feature.properties.count),
        weight: 0,
				//disabled polygon borders for clarity
        //opacity: 1,
        //color: 'white',
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
					 d > 0	?	'#FFEDA0' :
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

var activeAggregate = null;

/**
	Visual highlighting of polygon when hovered over with the mouse

	@param {object} event - leaflet event object
*/
function highlightAggregate(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#333',
    opacity:1,
    dashArray: '',
    fillOpacity: 0.7
  });

  layer.bringToBack(); //buggy?

  info.update(layer.feature.properties);

  activeAggregate = layer;
}
/**
	Reset style of aggregate after hover over

	@param {object} event - leaflet event object
*/
function resetAggregate(e){
	var layer = e.target;

	layer.setStyle(styleAggregates(layer.feature));
	layer.bringToBack();

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
var info = L.control({'position':'topright'});
//Create info box
info.onAdd = function(map){
	this.flag = 1;
	this._div = L.DomUtil.create('div', 'info'); // Create a div with class info
	this.update();
	return this._div;
};

//Update info box
info.update = function(properties){

		this._div.innerHTML = '<h4>Number of reports</h4><br>'+(properties ? properties.level_name+': '+properties.count+' reports' : 'Hover over an area');
};

/**
	Legend box
*/
var legend = L.control({position:'bottomright'});

legend.onAdd = function (map){

	var div = L.DomUtil.create('div', 'info legend'),
	grades = [0,1, 5, 10, 15, 20, 25, 30],
	labels = [];

	// loop through density intervals and generate label with coloured square
	for (var i=0; i <grades.length; i++){
		div.innerHTML +=
			'<i style="background:'+getColor(grades[i]+1) + '"></i> '+
			grades[i] + (grades[i+1] ? '&ndash;' + grades[i+1]+'<br>':'+');
	}
	return div;
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

//Add legend
legend.addTo(map);

//Old Mapnik B&W rendering before aggregates layer was added
//var base0 = L.tileLayer('http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png').addTo(map);
//Using stamen toner-lite
var base0 = L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
	//attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20
}).addTo(map);
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

var styleConfirmed = {
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
	var overlayMaps = {};

	map.spin(true);

	var layers = L.control.layers(baseMaps, overlayMaps, {position: 'bottomleft'}).addTo(map);

	window.layerPromises = {
		confirmed: getReports('confirmed')
			.then(loadConfirmedPoints),
		unconfirmed: getReports('unconfirmed')
			.then(loadUnconfirmedPoints),
		subdistrict: getAggregates('subdistrict')
			.then(function(aggregates) {
				return loadAggregates('subdistrict', aggregates);
			}),
		village: getAggregates('village')
			.then(function(aggregates) {
				return loadAggregates('village', aggregates);
			}),
		rw: getAggregates('rw')
			.then(function(aggregates) {
				return loadAggregates('rw', aggregates);
			}),
		waterways: getInfrastructure('waterways')
			.then(function(waterways){
				return loadInfrastructure('waterways', waterways);
			}),
		pumps: getInfrastructure('pumps')
			.then(function(pumps){
				return loadInfrastructure('pumps', pumps);
			}),
		floodgates: getInfrastructure('floodgates')
			.then(function(floodgates){
				return loadInfrastructure('floodgates', floodgates);
			})
	};

	RSVP.hash(window.layerPromises).then(function(overlays) {
		// Add overlays to the layers control
		layers.addOverlay(overlays.confirmed, "Confirmed Reports");
		layers.addOverlay(overlays.unconfirmed, "Unconfirmed Reports");
		layers.addOverlay(overlays.subdistrict, "Aggregates (Subdistrict)");
		layers.addOverlay(overlays.village, "Aggregates (Village)");
		layers.addOverlay(overlays.rw, "Aggregates (rw)");
		layers.addOverlay(overlays.waterways, "Waterways");
		layers.addOverlay(overlays.pumps, "Pumps");
		layers.addOverlay(overlays.floodgates, "Floodgates");

		// Make overlays visible
		overlays.subdistrict.addTo(map);
		overlays.confirmed.addTo(map);
		overlays.waterways.addTo(map);
		overlays.pumps.addTo(map);
		overlays.floodgates.addTo(map);

		map.spin(false);
	});
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

	var hideAggregates = function() {
    if (activeAggregate) {
      activeAggregate.setStyle(styleAggregates(activeAggregate.feature));
      info.update();
      activeAggregate = null;
    }

		if (aggregateLayers) {
			if (aggregateLayers.subdistrict) {
				map.removeLayer(aggregateLayers.subdistrict);
			}
			if (aggregateLayers.village) {
				map.removeLayer(aggregateLayers.village);
			}
			if (aggregateLayers.rw) {
				map.removeLayer(aggregateLayers.rw);
			}
		}
	};

	if (zoom < 13) {
		hideAggregates();
		aggregateLayers.subdistrict.addTo(map);
		aggregateLayers.subdistrict.bringToBack();
	} else if (zoom >= 13 && zoom <= 14) {
		hideAggregates();
		aggregateLayers.village.addTo(map);
		aggregateLayers.village.bringToBack();
	} else if (zoom >= 15 && zoom < 16) {
		hideAggregates();
		aggregateLayers.rw.addTo(map);
		aggregateLayers.rw.bringToBack();
	} else {
		hideAggregates();
	}
});
