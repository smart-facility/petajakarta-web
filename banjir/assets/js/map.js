//map.js - JavaScript for PetaJakarta web map

/**
*@file LeafletJS map to display data from cognicity server (PetaJakarta.org)
*@copyright (c) Tomas Holderness & SMART Infrastructure Facility January 2014
*@module map
*/

// URL replacement in tweets
String.prototype.parseURL = function() {
	return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
		return "<a target='_blank' href='"+url+"'>"+url+"</a>";
	});
};

/*
* Specify layernames
*/
var layernames = {};
if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id'){
	layernames.confirmed = 'Laporan Banjir';
	layernames.verified = 'Laporan BPBD';
	layernames.waterways = 'Aliran Air';
	layernames.pumps = 'Pompa Air';
	layernames.floodgates = 'Pintu Air';
	layernames.floodheights = {
		title:'Tinggi Banjir',
		tentative_areas:'Hati-Hati'
	};
	layernames.floodgauges = 'Tinggi Muka Air';
}
else {
	layernames.confirmed = 'Flood Reports';
	layernames.verified = 'BPBD Reports';
	layernames.waterways = 'Waterways';
	layernames.pumps = 'Pumps';
	layernames.floodgates = 'Floodgates';
	layernames.floodheights = {
		title:'Flood Heights',
		tentative_areas:'Use Caution'
		};
	layernames.floodgauges = 'River Gauges';

}

/**
	Format popup with an embedded tweet

	@param {object} feature - a GeoJSON feature representing a report
*/
var tweetPopup = function(feature){
	var popup = '<div id="tweet-container" style="width:220px; height:auto; max-height:220px; overflow-y:scroll"><blockquote class="twitter-tweet"><a target="_blank"  href="'+feature.properties.url+'">'+feature.properties.text+'</a></blockquote></div>';
	if (feature.properties.status == 'verified'){
		popup = '<div style="padding:5px"><img src="/banjir/img/bpbd_dki.png" height="35px;"> @BPBDJakarta <i>Retweeted</i></div><div id="tweet-container" style="width:220px; height:auto; max-height:220px; overflow-y:scroll;"><blockquote class="twitter-tweet"><a target="_blank"  href="'+feature.properties.url+'">'+feature.properties.text+'</a></blockquote></div>';
	}
	return popup;
};
/**
	Format popup with a Detik report

	@param {object} feature - a GeoJSON feature representing a report
*/
var detikPopup = function(feature){
	var popup = '<div id="detik-container" style="width:220px; height:220px; overflow-y:scroll; background-color:white;"><div class="media"><a class="pull-left" href="#"><img class="media-object" src="/banjir/img/logo_detik.png" height="22"></a><div class="media-body"><h4 style="font-size:18px; line-height:1.2;" class="media-heading">PASANGMATA.COM</h4></div></div><p class="lead" style="margin:4px;font-size:16px;">'+feature.properties.title+'</p><img class="img-responsive" src="'+feature.properties.image_url+'" width="210"/><h5>'+feature.properties.text+'</h5><h5>'+feature.properties.created_at.replace('T',' ')+'</h5><a href="'+feature.properties.url+'" target="_blank">'+feature.properties.url+'</a></div>';
	return popup;
};

/**
	Format popup with a Qlue report

	@param {object} feature - a GeoJSON feature representing a report
*/

var qluePopup = function(feature){
	var popup = '<div id="qlue-container" style="width:220px; height:220px; overflow-y:scroll; background-color:white;"><div class="media"><a class="pull-left" href="#"><img class="media-object" src="/banjir/img/logo_qlue.png" height="32"></a></div><p class="lead" style="margin-bottom:4px;margin-top:4px;font-size:16px;">'+feature.properties.title+'</p><img class="img-responsive" src="'+feature.properties.image_url.replace('http://','https://')+'" width="210"/><h5>'+feature.properties.text+'</h5><h5>'+feature.properties.created_at.replace('T',' ')+'</div>';
	return popup;
};

/**
	Add a popup to the provided layer based on the provided feature's text property

	@param {object} feature - a GeoJSON feature
	@param {L.ILayer} layer - the layer to attach the popup to
*/
var markerPopup = function(feature, layer) {
	if (feature.properties) {
		markerMap[feature.properties.pkey] = layer;
		// Render as tweet
		if (feature.properties.source == 'twitter'){
			layer.bindPopup(tweetPopup(feature), {autoPanPadding:([0,140])});
		}
		// Render as Detik report
		else if (feature.properties.source == 'detik'){
			layer.bindPopup(detikPopup(feature), {autoPanPadding:([0,60])});
		}

		// Render as Qlue
		else if (feature.properties.source == 'qlue'){
			layer.bindPopup(qluePopup(feature), {autoPanPadding:([0,60])});
		}

		// Default to text rendering
		else {

			var message = "";
			if (feature.properties.title && feature.properties.title.length !== 0){
				message += feature.properties.title;
			}
			if (feature.properties.text && feature.properties.text.length !==0){
				message += '&#151'+feature.properties.text;
			}
			layer.bindPopup(message, {autoPanPadding:([0,60])});
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
		jQuery.getJSON("/banjir/data/api/v2/infrastructure/"+layer+"?format=topojson", function(data){
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
	Returns floodgauge icon and color based on siaga (alert) level

	@param {level} integer - the alert level (1-4)
*/
var getSiagaLevelIconography = function(level){
	switch (level) {
		case 1:
			return {'color':'#FF4000','icon':'floodgauge_1.svg'};
		case 2:
			return {'color':'#FF8000','icon':'floodgauge_2.svg'};
		case 3:
			return {'color':'#F7D358','icon':'floodgauge_3.svg'};
		default:
			return {'color':'#01DF01','icon':'floodgauge.svg'};
	}
};

/**
	Format popup with a floodgauge report

	@param {object} feature - a GeoJSON feature representing a report
*/
var floodgaugePopoup = function(feature){

	var label = 'Water Level (cm)';
	if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id'){
			label = 'Tinggi Muka Air (cm)';
	}
	var popup = '';
	if (feature.properties !== null){
		popup = '<div id="floodgauge-container" style="width:220px; height:220px; overflow-y:scroll"><div class="media"><img class="media-object pull-left" src="/banjir/img/dki_jayaraya.png" height="22"/><img class="media-object pull-left" src="/banjir/img/bpbd_dki.png" height="22"/><h4 style="font-size:18px; line-height:1.2;" class="media-heading pull-left">'+feature.properties.gaugenameid+'</h4></div>'+label+'&nbsp;&nbsp|&nbsp;&nbsp;<span style="color:black; background-color:'+getSiagaLevelIconography(feature.properties.observations[feature.properties.observations.length-1].warninglevel).color+'">'+feature.properties.observations[feature.properties.observations.length-1].warningnameid+'</span><canvas id="gaugeChart" class="chart" width="210" height="180"></canvas></div>';
	}
	else {
		popup = 'Data not available | Tidak ada data';
	}
	return popup;
};

/**
	Add a text popup to the floodgauge layer

	@param {object} feature - a GeoJSON feature
	@param {L.ILayer} layer - the layer to attach the popup to
*/
var floodgaugeMarker = function(feature, layer){
	if (feature.properties){
		layer.bindPopup(floodgaugePopoup(feature),{autoPanPadding:([0,60])});
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
		jQuery.getJSON('/banjir/data/api/v2/reports/'+type+'?format=topojson', function(data) {
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
	Get TopoJSON representing a single confirmed flooding report

	@param {integer} id - the unique id of the confirmed report to get

	For single point feature GeoJSON is smaller than TopoJSON
*/
var getReport = function(id) {
	return new RSVP.Promise(function(resolve, reject){
		jQuery.getJSON('/banjir/data/api/v2/reports/confirmed/'+id+'?format=geojson', function(data){
			if (data.features !== null){
				resolve(data);
			}
				else {
					resolve(null);
				}
		});
	});
};

/**
	Get GeoJSON representing current flooding
	@param {function} callback - a function to be called when data is finished loading
*/
var getREM = function(callback) {
	jQuery.getJSON('/banjir/dims_flooded.geojson', function(data){
		callback(data);
	})
	.fail(function(){
		console.log('getREM(): Error fetching REM data');
	});
};

/**
	Load GeoJSON representing current flooding
	@param {object} data - geojson polygon representation of affected areas
*/
var loadREM = function(data){
	window.floodheights = L.geoJson(data, {clickable: false, style:function(feature){
		switch (feature.properties.affected) {
			case 1: return {fillColor:"#045a8d",weight:1,color:"#045a8d", opacity:0.8,fillOpacity: 0.8};
			case 2: return {fillColor:"#3399FF",weight:1,color:"#3399FF", opacity:0.8,fillOpacity: 0.7};
			case 3: return {fillColor:"#9fd2f2",weight:1,color:"#9fd2f2", opacity:0.8,fillOpacity: 0.8};
			case 4: return {fillColor:"yellow", weight:0,fillOpacity:0.6};

			//default: return {color:"rgba(0,0,0,0)",weight:0,fillOpacity:0};
		}
	}}).addTo(map).bringToBack();
	//heightsLegend.addTo(map);
	$('#legendbox').append(heightsLegend);
	layerControl.addOverlay(window.floodheights, layernames.floodheights.title);
};

/** Style confirmed reports
		@param {object} feature - geojson report feature
*/
var iconConfirmedReports = function(feature){
	//default confirmed style
	var myicon = L.divIcon({className: 'div-icon-confirmed', html:'<p><span class="glyphicon glyphicon-tint" aria-hidden="true"></span></p>', popupAnchor:[5,0]});
	//else return verified style
	if (feature.properties.status == 'verified'){
		myicon = L.divIcon({className: 'div-icon-verified', html:'<p><span class="glyphicon glyphicon-tint" aria-hidden="true"></span></p>', popupAnchor:[5,0]});
	}
	return (myicon);
};

/**
	Plots confirmed points on the map as circular markers
	@param {object} reports - a GeoJSON object containing report locations
*/
var loadConfirmedPoints = function(reports) {
	if (reports) {
		loadTable(reports); //sneaky loadTable function.
		// badge reports button
		window.reportsBadge.textContent = reports.features.length;

		// create points
		window.confirmedPoints = L.geoJson(reports, {
			pointToLayer: function(feature, latlng) {
				var zIndexOffset = 0;
				if (feature.properties.status == 'verified') zIndexOffset = 1000;
				return  L.marker(latlng, {icon:iconConfirmedReports(feature), zIndexOffset: zIndexOffset});
			},
			onEachFeature: markerPopup
		});
  } else {
		window.confirmedPoints = L.geoJson(null, {
			pointToLayer: function(feature, latlng) {
				var zIndexOffset = 0;
				if (feature.properties.status == 'verified') zIndexOffset = 1000;
				return  L.marker(latlng, {icon:iconConfirmedReports(feature), zIndexOffset: zIndexOffset});
			},
			onEachFeature: markerPopup
		});
	}

	return window.confirmedPoints;
};

/**
	If a unique ID is specified in the URL, zoom to this point, getting specified point if need.
 	@param {object} report - a GeoJSON object contiaing report location and metadata
*/
var showURLReport = function() {
	//Test if URL parameter present
	if ($.url('?report')){
			//Check if Integer
			var id = parseInt($.url('?report'));
			var err;
			if ( !validateNumberParameter(id,0) ) err = new Error( "'report id parameter is invalid" );
			if (err) {
				console.log(err);
				return;
			}
			//Zoom to object if exists
			if (markerMap.hasOwnProperty(id)){
				centreMapOnPopup(id);
			}

			else {
				//Else attempt to get from server
				var promise = getReport(id);
				promise.then(function(data){
					window.confirmedPoints.addData(data);
					centreMapOnPopup(id);
					});
				}
			}
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
		else if (layer == 'floodgauges'){

			window[layer] = L.geoJson(infrastructure, {
				pointToLayer: function(feature, latlng) {
					return L.marker(latlng, {icon: L.icon(
																			{iconUrl:'/banjir/img/'+getSiagaLevelIconography(feature.properties.observations[feature.properties.observations.length-1].warninglevel).icon,
																				iconSize: [22,22],
																				iconAnchor: [11, 11],
																				popupAnchor: [0, 0], }
																			)});
				}, onEachFeature: floodgaugeMarker
			}).addTo(map);
			$('#legendbox').append(gaugesLegend);
		}
		else {
			window[layer] = L.geoJson(infrastructure, {
				pointToLayer: function(feature, latlng) {
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
		weight:0.9,
		opacity:1,
	},
	pumps:L.icon({
		iconUrl: '/banjir/img/pump.svg',
		iconSize: [22,22],
		iconAnchor: [11, 11],
		popupAnchor: [0, 0],
	}),
	floodgates:L.icon({
		iconUrl: '/banjir/img/floodgate.svg',
		iconSize: [22,22],
		iconAnchor: [11, 11],
		popupAnchor: [0, 0],
	})
};

/**
	Centre the map on a given location and open a popup's text box.

	Turn on point layer if required.

	@param {string} pkey - the key of the marker to display
	@param {number} lat - latitude to center on
	@param {number} lon - longitude to center on
*/
var centreMapOnPopup = function(pkey,lat,lon) {
	if (map.hasLayer(window.confirmedPoints) === false){
		window.confirmedPoints.addTo(map).bringToFront();
	}

	var m = markerMap[pkey];
	map.setView(m._latlng, 17);
	m.openPopup();
};

/**
	Center the map on the user's location if they're in jakarta & add a pin to show location
	See http://leafletjs.com/examples/mobile.html for reference implementation.

	@param {Position} position - the user's position as provided by client browser
*/
var setViewJakarta = function(position) {
	if (position.coords.latitude >= -6.4354 && position.coords.latitude <= -5.9029 &&
		  position.coords.longitude >= 106.5894 && position.coords.longitude <= 107.0782) {
				map.setView(L.latLng(position.coords.latitude,position.coords.longitude), 17, {animate:true}); // Set to the users current view
				// Color the user location button as feedback
				$('.leaflet-control-location-button').css("background-image", "url(/banjir/img/location-icon-blue.png)");
				$('.leaflet-retina .leaflet-control-location-button').css("background-image", "url(/banjir/img/location-icon-2x-blue.png)");

				//Remove existing marker if present
				if (window.bluedot){
					map.removeLayer(window.bluedot);
				}
				// Add new marker
				window.bluedot = L.marker([position.coords.latitude,position.coords.longitude]);
				window.bluedot.addTo(map);
	}
};

// Create timestamp control
var timestamp = L.control({'position':'topright'});

/**
	Toggle timestamp on map based on checkbox behaviour

	@param {Boolean} checkbox - true/false representation of checkbox state
*/
var toggle_timestamp = function(checkbox){

	if (checkbox === true){
		timestamp.addTo(map);
	}
	else {
		if (timestamp._map){
			map.removeControl(timestamp);
		}
	}
};
// Create timestamp text
timestamp.onAdd = function(map){
	var time = String(new Date()).slice(4,21);
	this._div = L.DomUtil.create('div', 'info timestamp');
	this._div.innerHTML = time;
	return this._div;
};

// map legend
var mapLegend = L.control({position:'bottomright'});

mapLegend.onAdd = function(map) {
	var div = L.DomUtil.create('div', 'info legend');
	div.innerHTML += '<div id="legendbox"><div class="sublegend"><div><span class="div-icon-confirmed-legend glyphicon glyphicon-tint" aria-hidden="true" style="margin-left:1px;"></span>&nbsp;'+layernames.confirmed+'</div><div><span class="div-icon-verified-legend glyphicon glyphicon-tint" aria-hidden="true" style="margin-right:1px;"></span>'+layernames.verified+'</div></div></div>';
	return div;
};

//flood heights scale
var heightsLegend = '<div id="heightsLegend"><div class="sublegend"><div style="font-weight:bold">'+layernames.floodheights.title+'</div><div><i class="color" style="background:#045a8d;"></i><span>&nbsp;>140cm</span></div><div><i class="color" style="background:#3399FF"></i><span>&nbsp;>70cm </span></div><div><i class="color" style="background:#9fd2f2"></i><span>&nbsp;>0cm </span></div><i class="color" style="background:yellow"></i><span>&nbsp;'+layernames.floodheights.tentative_areas+'</span></div></div>';

//flood gauges legend
var siagaNames = {};
if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id'){
	siagaNames[1] = 'Siaga I';
	siagaNames[2] = 'Siaga II';
	siagaNames[3] = 'Siaga III';
	siagaNames[4] = 'Siaga IV';
}
else {
		siagaNames[1] = 'Alert Level 1';
		siagaNames[2] = 'Alert Level 2';
		siagaNames[3] = 'Alert Level 3';
		siagaNames[4] = 'Alert Level 4';
}
var gaugesLegend = '<div id="gaugesLegend"><div class="sublegend"><div style="font-weight:bold">'+layernames.floodgauges+'</div><div><img src="/banjir/img/floodgauge_1.svg" height="18px;" width="auto" /><span>&nbsp;'+siagaNames[1]+'</span></div><div><img src="/banjir/img/floodgauge_2.svg" height="18px;" width="auto" /><span>&nbsp;'+siagaNames[2]+'</span></div><div><img src="/banjir/img/floodgauge_3.svg" height="18px;" width="auto" /><span>&nbsp;'+siagaNames[3]+'</span></div><div><img src="/banjir/img/floodgauge.svg" height="18px;" width="auto" /><span>&nbsp;'+siagaNames[4]+'</span></div></div>';

//infrastructure legend items
var pumpsLegend = '<div id="pumpsLegend"><div class="sublegend"><div><img src="/banjir/img/pump.svg" height="18px;" width="auto" /><span>&nbsp;'+layernames.pumps+'</span></div></div>';
var floodgatesLegend =  '<div id="floodgatesLegend"><div class="sublegend"><div><img src="/banjir/img/floodgate.svg" height="18px;" width="auto" /><span>&nbsp;'+layernames.floodgates+'</span></div></div>';
var waterwaysLegend = '<div id="waterwaysLegend"><div class="sublegend"><div><span style="background-color:#3960ac; font-size:6px;padding-top:8px;margin-left:8px;margin-right:5px;">&nbsp;</span><span>&nbsp;'+layernames.waterways+'</span></div></div>';

// Reports control
var reportsControl = L.control({position:'bottomleft'});
reportsControl.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'leaflet-control');

  var reportsLink = L.DomUtil.create('a', 'leaflet-control-reports-button', div);
  //reportsLink.textContent = "<span class='badge'>4</span>";
  reportsLink.setAttribute('data-toggle', 'modal');
  reportsLink.setAttribute('href', '#reportsModal');

	window.reportsBadge = L.DomUtil.create('span', 'badge progress-bar-danger', reportsLink);

  return div;
};

var infoControl = L.control({position:'bottomleft'});

infoControl.onAdd = function(map) {
  var div = L.DomUtil.create('div', 'leaflet-control');
  var infoLink = L.DomUtil.create('a', 'leaflet-control-info-button', div);
  infoLink.textContent = "Information";
  infoLink.setAttribute('data-toggle', 'modal');
  infoLink.setAttribute('href', '#infoModal');

  return div;
};

var locationControl = L.control({position:'bottomleft'});

locationControl.onAdd = function(map){
	var div = L.DomUtil.create('div', 'leaflet-control');
	var locationLink = L.DomUtil.create('a', 'leaflet-control-location-button', div);
	locationLink.textContent = 'Current Location';
	locationLink.setAttribute('href', '#');
	locationLink.setAttribute('onclick', 'navigator.geolocation.getCurrentPosition(setViewJakarta); return false;');

	return div;
};

//Initialise map
var latlon = new L.LatLng(-6.1924, 106.8317); //Centre Jakarta
var map = L.map('map', {zoomControl:true}).setView(latlon, 12); // Initialise map
map.attributionControl.setPrefix('');

//Specify default image path for Leaflet
L.Icon.Default.imagePath = '/banjir/css/images/';

//Check user location and alter map view accordingly
if (window.isTouch){
	map.locate({setView:false});
	if ('geolocation' in navigator) {
		navigator.geolocation.getCurrentPosition(setViewJakarta);
	}
}

// Reports control
infoControl.addTo(map);
reportsControl.addTo(map);
locationControl.addTo(map);

// Basemap - check for HD/Retina display
// See: http://www.robertprice.co.uk/robblog/2011/05/detecting_retina_displays_from_javascript_and_css-shtml/
var tileformat = '.png128';
if (window.devicePixelRatio > 1) {
	tileformat = '@2x.png128';
}
var base = L.tileLayer('https://api.mapbox.com/v4/petajakarta.lcf40klb/{z}/{x}/{y}'+tileformat+'?access_token=pk.eyJ1IjoicGV0YWpha2FydGEiLCJhIjoiTExKVVZ5TSJ9.IFf5jeFKz2iwMpBi5N3kUg').addTo(map);
var markerMap = {}; //Reference list of markers stored outside of Leaflet

var loadPrimaryLayers = function(layerControl) {
	var layerPromises = {
		confirmed: getReports('confirmed')
			.then(loadConfirmedPoints)};

	return new RSVP.Promise(function(resolve, reject) {
		RSVP.hash(layerPromises).then(function(overlays) {
			layerControl.addBaseLayer(overlays.confirmed, layernames.confirmed);
			overlays.confirmed.addTo(map);
			map.spin(false);

			resolve(layerControl);
		}, reject);
	});
};

var loadSecondaryLayers = function(layerControl) {
	return new RSVP.Promise(function(resolve, reject) {
		secondaryPromises = {
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
				}),
			floodgauges: getInfrastructure('floodgauges')
				.then(function(floodgauges){
					return loadInfrastructure('floodgauges', floodgauges);
				})
		};

		RSVP.hash(secondaryPromises).then(function(overlays) {
			// Add overlays to the layer control
			showURLReport(); //once point layers loaded zoom to report specified in URL
			layerControl.addOverlay(overlays.floodgauges, layernames.floodgauges);
			layerControl.addOverlay(overlays.pumps, layernames.pumps);
			layerControl.addOverlay(overlays.floodgates, layernames.floodgates);
			layerControl.addOverlay(overlays.waterways, layernames.waterways);
		});
	});
};

// Load reports
$(function() {
	map.spin(true);
	window.layerControl = L.control.layers({}, {}, {position: 'bottomleft'}).addTo(map);
	loadPrimaryLayers(window.layerControl).then(loadSecondaryLayers);
	getREM(loadREM);
});

/**
	Listen for map events and load required layers
*/
map.on('overlayremove', function(event){
	if (event.layer == window.floodheights){
		$('#heightsLegend').remove();
	}
	else if (event.layer == window.floodgauges){
		$('#gaugesLegend').remove();
	}
	else if (event.layer == window.pumps){
		$('#pumpsLegend').remove();
	}
	else if (event.layer == window.waterways){
		$('#waterwaysLegend').remove();
	}
	else if (event.layer == window.floodgates){
		$('#floodgatesLegend').remove();
	}
});

map.on('overlayadd', function(event){
	if (event.layer == window.floodheights){
		//heightsLegend.addTo(map);
		$('#legendbox').append(heightsLegend);
	}
	else if (event.layer == window.floodgauges) {
		$('#legendbox').append(gaugesLegend);
	}
	else if (event.layer == window.pumps) {
		$('#legendbox').append(pumpsLegend);
	}
	else if (event.layer == window.waterways) {
		$('#legendbox').append(waterwaysLegend);
	}
	else if (event.layer == window.floodgates) {
		$('#legendbox').append(floodgatesLegend);
	}
});

/**
	Ask popups to render using Twitter embedded tweets
*/
map.on('popupopen', function(popup){

	if ($('tweet-container')){
			twttr.widgets.load($('.leaflet-popup-content'));
		}
	if ($('floodgauge-container')){
		if (popup.popup._source.feature.properties !== null){
				var properties = popup.popup._source.feature.properties;
				var ctx = $("#gaugeChart").get(0).getContext("2d");
				var data = {
					labels : [],
					datasets : [{
						label: "",
						fillColor: "rgba(151,187,205,0.2)",
						strokeColor: "rgba(151,187,205,1)",
						pointColor: "rgba(151,187,205,1)",
						pointStrokeColor: "#fff",
						pointHighlightFill: "#fff",
						pointHighlightStroke: "rgba(151,187,205,1)",
						data: []
					}]
				};
				for (var i = 0; i < properties.observations.length; i++){
					data.labels.push(properties.observations[i].measuredatetime.slice(11,16));
					data.datasets[0].data.push(properties.observations[i].depth);
				}
				var gaugeChart = new Chart(ctx).Line(data, {bezierCurve:true, scaleLabel: "<%= ' ' + value%>"});
			}
		}
});

// Finally, add the legend
mapLegend.addTo(map);
