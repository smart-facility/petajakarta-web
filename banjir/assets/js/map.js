//map.js - JavaScript for PetaJakarta web map

/**
*@file LeafletJS map to display data from cognicity server (PetaJakarta.org)
*@copyright (c) Tomas Holderness & SMART Infrastructure Facility January 2014-2016
*@module map
*/

var petajakarta = {
	// Default configuration
	config: {
		// The ID of the element which will become the map
		elementId: "map",
		// The start of the URL for the web server serving the map resources (CSS, JS, HTML)
		urlPrefix: '/banjir/',
		// The start of the URL to the API server
		serverUrlPrefix: 'https://petajakarta.org/banjir/',
		// The start of the URL to the REM API server
		remServerUrlPrefix: 'https://rem.petajakarta.org/banjir/'
	},
	// Useful status variables
	status: {
		lang: null,
		embedded: null
	}
};

petajakarta.start = function() {
	// Fetch the map HTML include from the server
	petajakarta.status.lang = $("html").attr('lang') ? $("html").attr('lang') : 'id';
	petajakarta.loadedIncludes = new RSVP.Promise( function(resolve, reject) {
		$("#includes").load(
			petajakarta.config.urlPrefix + petajakarta.status.lang + '/map-include/',
			function( response, status, xhr ) {
				if (status==='error') {
					reject(status);
				} else {
					resolve();
				}
			}
		);
	}).catch( function(e) {
		// TODO Handle error
	});

	// Are we in embedded mode?
	petajakarta.status.embedded = $("#"+petajakarta.config.elementId).hasClass('embedded');

  petajakarta.isTouch = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

	//Check user location and alter map view accordingly
	if (petajakarta.isTouch){
        L_PREFER_CANVAS = true; //Leaflet canvas rendering
	}

	// Labels for the layers in the legend, localised in start()
	petajakarta.layernames = {};

	if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id'){
		petajakarta.layernames.confirmed = 'Laporan Banjir';
		petajakarta.layernames.verified = 'Laporan BPBD';
		petajakarta.layernames.waterways = 'Aliran Air';
		petajakarta.layernames.pumps = 'Pompa Air';
		petajakarta.layernames.floodgates = 'Pintu Air';
		petajakarta.layernames.floodheights = {
			title: 'Tinggi Banjir',
			tentative_areas: 'Hati-Hati'
		};
		petajakarta.layernames.floodgauges = 'Tinggi Muka Air';
	} else {
		petajakarta.layernames.confirmed = 'Flood Reports';
		petajakarta.layernames.verified = 'BPBD Reports';
		petajakarta.layernames.waterways = 'Waterways';
		petajakarta.layernames.pumps = 'Pumps';
		petajakarta.layernames.floodgates = 'Floodgates';
		petajakarta.layernames.floodheights = {
			title: 'Flood Heights',
			tentative_areas: 'Use Caution'
		};
		petajakarta.layernames.floodgauges = 'River Gauges';
	}

	petajakarta.styleInfrastructure = {
		waterways:{
			color:'#3960ac',
			weight:0.9,
			opacity:1,
		},
		pumps:L.icon({
			iconUrl: petajakarta.config.urlPrefix + 'img/pump.png',
			iconSize: [22,22],
			iconAnchor: [11, 11],
			popupAnchor: [0, 0],
		}),
		floodgates:L.icon({
			iconUrl: petajakarta.config.urlPrefix + 'img/floodgate.png',
			iconSize: [22,22],
			iconAnchor: [11, 11],
			popupAnchor: [0, 0],
		})
	};

	// Create timestamp control
	petajakarta.timestamp = L.control({'position':'topright'});

	/**
		Toggle timestamp on map based on checkbox behaviour

		@param {Boolean} checkbox - true/false representation of checkbox state
	*/
	petajakarta.toggle_timestamp = function(checkbox){

		if (checkbox === true){
			petajakarta.timestamp.addTo(petajakarta.map);
		} else {
			if (petajakarta.timestamp._map){
				petajakarta.map.removeControl(petajakarta.timestamp);
			}
		}
	};
	// Create timestamp text
	petajakarta.timestamp.onAdd = function(map){
		var time = String(new Date()).slice(4,21);
		this._div = L.DomUtil.create('div', 'info timestamp');
		this._div.innerHTML = time;
		return this._div;
	};

	// map legend
	petajakarta.mapLegend = L.control({position:'bottomright'});

	petajakarta.mapLegend.onAdd = function(map) {
		var div = L.DomUtil.create('div', 'info legend');
		div.innerHTML += '<div id="legendbox"><div class="sublegend"><div><span class="div-icon-confirmed-legend glyphicon glyphicon-tint" aria-hidden="true" style="margin-left:1px;"></span>&nbsp;'+petajakarta.layernames.confirmed+'</div><div><span class="div-icon-verified-legend glyphicon glyphicon-tint" aria-hidden="true" style="margin-right:1px;"></span>'+petajakarta.layernames.verified+'</div></div></div>';
		return div;
	};

	//flood heights scale
	petajakarta.heightsLegend = '<div id="heightsLegend"><div class="sublegend"><div style="font-weight:bold">'+petajakarta.layernames.floodheights.title+'</div><div><i class="color" style="background:#CC2A41;"></i><span>&nbsp;&gt; 150 cm</span></div><div><i class="color" style="background:#FF8300"></i><span>&nbsp;71 cm &ndash; 150 cm </span></div><div><i class="color" style="background:#FFFF00"></i><span>&nbsp;10 cm &ndash; 70 cm</span></div><i class="color" style="background:#A0A9F7"></i><span>&nbsp;'+petajakarta.layernames.floodheights.tentative_areas+'</span></div></div>';
	//flood gauges legend
	petajakarta.siagaNames = {};
	if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id'){
		petajakarta.siagaNames[1] = 'Siaga I';
		petajakarta.siagaNames[2] = 'Siaga II';
		petajakarta.siagaNames[3] = 'Siaga III';
		petajakarta.siagaNames[4] = 'Siaga IV';
	} else {
		petajakarta.siagaNames[1] = 'Alert Level 1';
		petajakarta.siagaNames[2] = 'Alert Level 2';
		petajakarta.siagaNames[3] = 'Alert Level 3';
		petajakarta.siagaNames[4] = 'Alert Level 4';
	}
	petajakarta.gaugesLegend = '<div id="gaugesLegend"><div class="sublegend"><div style="font-weight:bold">'+petajakarta.layernames.floodgauges+'</div><div><img src="'+petajakarta.config.urlPrefix+'img/floodgauge_1.png" height="18px;" width="auto" /><span>&nbsp;'+petajakarta.siagaNames[1]+'</span></div><div><img src="'+petajakarta.config.urlPrefix+'img/floodgauge_2.png" height="18px;" width="auto" /><span>&nbsp;'+petajakarta.siagaNames[2]+'</span></div><div><img src="'+petajakarta.config.urlPrefix+'img/floodgauge_3.png" height="18px;" width="auto" /><span>&nbsp;'+petajakarta.siagaNames[3]+'</span></div><div><img src="'+petajakarta.config.urlPrefix+'img/floodgauge.png" height="18px;" width="auto" /><span>&nbsp;'+petajakarta.siagaNames[4]+'</span></div></div>';

	//infrastructure legend items
	petajakarta.pumpsLegend = '<div id="pumpsLegend"><div class="sublegend"><div><img src="'+petajakarta.config.urlPrefix+'img/pump.png" height="18px;" width="auto" /><span>&nbsp;'+petajakarta.layernames.pumps+'</span></div></div>';
	petajakarta.floodgatesLegend =  '<div id="floodgatesLegend"><div class="sublegend"><div><img src="'+petajakarta.config.urlPrefix+'img/floodgate.png" height="18px;" width="auto" /><span>&nbsp;'+petajakarta.layernames.floodgates+'</span></div></div>';
	petajakarta.waterwaysLegend = '<div id="waterwaysLegend"><div class="sublegend"><div><span style="background-color:#3960ac; font-size:6px;padding-top:8px;margin-left:8px;margin-right:5px;">&nbsp;</span><span>&nbsp;'+petajakarta.layernames.waterways+'</span></div></div>';

	// Reports control
	petajakarta.reportsControl = L.control({position:'bottomleft'});
	petajakarta.reportsControl.onAdd = function(map) {
	  var div = L.DomUtil.create('div', 'leaflet-control');

	  var reportsLink = L.DomUtil.create('a', 'leaflet-control-reports-button', div);
	  //reportsLink.textContent = "<span class='badge'>4</span>";
	  reportsLink.setAttribute('data-toggle', 'modal');
	  reportsLink.setAttribute('href', '#reportsModal');

		petajakarta.reportsBadge = L.DomUtil.create('span', 'badge progress-bar-danger', reportsLink);

	  return div;
	};

	petajakarta.infoControl = L.control({position:'bottomleft'});

	petajakarta.infoControl.onAdd = function(map) {
	  var div = L.DomUtil.create('div', 'leaflet-control');
	  var infoLink = L.DomUtil.create('a', 'leaflet-control-info-button', div);
	  infoLink.textContent = "Information";
	  infoLink.setAttribute('data-toggle', 'modal');
	  infoLink.setAttribute('href', '#infoModal');

	  return div;
	};

	petajakarta.locationControl = L.control({position:'bottomleft'});

	petajakarta.locationControl.onAdd = function(map){
		var div = L.DomUtil.create('div', 'leaflet-control');
		var locationLink = L.DomUtil.create('a', 'leaflet-control-location-button', div);
		locationLink.textContent = 'Current Location';
		locationLink.setAttribute('href', '#');
		locationLink.setAttribute('onclick', 'navigator.geolocation.getCurrentPosition(petajakarta.setViewJakarta); return false;');

		return div;
	};

	//Initialise map
	petajakarta.latlon = new L.LatLng(-6.1924, 106.8317); //Centre Jakarta
	petajakarta.map = L.map(petajakarta.config.elementId, {zoomControl:true}).setView(petajakarta.latlon, 12); // Initialise map
	petajakarta.map.attributionControl.setPrefix('');
	L.control.scale({'position':'bottomright', 'imperial':false, 'maxWidth':200}).addTo(petajakarta.map);

	//Specify default image path for Leaflet
	L.Icon.Default.imagePath = petajakarta.config.urlPrefix+'css/images/';

	// Branding logo when embedded
	if (petajakarta.status.embedded) {
		petajakarta.logo = L.control({position:'topright'});
		petajakarta.logo.onAdd = function(map) {
			var div = L.DomUtil.create('div', 'logo');
			div.innerHTML += '<a href="http://petajakarta.org/banjir/'+petajakarta.status.lang+'/" target="_blank"><img border="0" src="'+petajakarta.config.urlPrefix+'img/pj_logo_black_text_150.png"/></a>';
			return div;
		};
		petajakarta.logo.addTo(petajakarta.map);
	}

	// Add controls to map
	petajakarta.infoControl.addTo(petajakarta.map);
	petajakarta.reportsControl.addTo(petajakarta.map);
	petajakarta.locationControl.addTo(petajakarta.map);

	// Basemap - check for HD/Retina display
	// See: http://www.robertprice.co.uk/robblog/2011/05/detecting_retina_displays_from_javascript_and_css-shtml/
	petajakarta.tileformat = '.png128';
	if (window.devicePixelRatio > 1) {
		petajakarta.tileformat = '@2x.png128';
	}
	petajakarta.base = L.tileLayer('https://api.mapbox.com/v4/petajakarta.lcf40klb/{z}/{x}/{y}'+petajakarta.tileformat+'?access_token=pk.eyJ1IjoicGV0YWpha2FydGEiLCJhIjoiTExKVVZ5TSJ9.IFf5jeFKz2iwMpBi5N3kUg').addTo(petajakarta.map);
	petajakarta.markerMap = {}; //Reference list of markers stored outside of Leaflet

	/**
	Listen for map events and load required layers
	*/
	petajakarta.map.on('overlayremove', function(event){
		if (event.layer == petajakarta.floodheights){
			$('#heightsLegend').remove();
		}
		else if (event.layer == petajakarta.floodgauges){
			$('#gaugesLegend').remove();
		}
		else if (event.layer == petajakarta.pumps){
			$('#pumpsLegend').remove();
		}
		else if (event.layer == petajakarta.waterways){
			$('#waterwaysLegend').remove();
		}
		else if (event.layer == petajakarta.floodgates){
			$('#floodgatesLegend').remove();
		}
	});

	petajakarta.map.on('overlayadd', function(event){
		if (event.layer == petajakarta.floodheights){
			$('#legendbox').append(petajakarta.heightsLegend);
		}
		else if (event.layer == petajakarta.floodgauges) {
			$('#legendbox').append(petajakarta.gaugesLegend);
		}
		else if (event.layer == petajakarta.pumps) {
			$('#legendbox').append(petajakarta.pumpsLegend);
		}
		else if (event.layer == petajakarta.waterways) {
			$('#legendbox').append(petajakarta.waterwaysLegend);
		}
		else if (event.layer == petajakarta.floodgates) {
			$('#legendbox').append(petajakarta.floodgatesLegend);
		}
	});

	/**
		Ask popups to render using Twitter embedded tweets
	*/
	petajakarta.map.on('popupopen', function(popup){

		if ( $('#tweet-container').length ){
				twttr.widgets.load($('.leaflet-popup-content'));
			}
		if ( $('#floodgauge-container').length ){
			if (popup.popup._source.feature.properties !== null){
					var properties = popup.popup._source.feature.properties;
					var ctx = $("#gaugeChart").get(0).getContext("2d");
					var data = {
						labels : [],
						datasets : [{
							label: "",
							backgroundColor: "rgba(151,187,205,0.2)",
							borderColor: "rgba(151,187,205,1)",
							pointBackgroundColor: "rgba(151,187,205,1)",
							pointBorderColor: "#fff",
	            pointRadius: 4,
							data: []
						}]
					};
					for (var i = 0; i < properties.observations.length; i++){
						data.labels.push(properties.observations[i].measuredatetime.slice(11,16));
						data.datasets[0].data.push(properties.observations[i].depth);
					}
					var gaugeChart = new Chart(ctx,
					{type: 'line',
					data:data,
					options: {
						bezierCurve:true,
						scaleLabel: "<%= ' ' + value%>",
						legend: {display:false}
						}
					});
				}
			}
	});

	if (petajakarta.isTouch){
		petajakarta.map.locate({setView:false});
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(petajakarta.setViewJakarta);
		}
	}

	//Load reports
	petajakarta.map.spin(true);
	petajakarta.layerControl = L.control.layers({}, {}, {position: 'bottomleft'}).addTo(petajakarta.map);
	petajakarta.loadPrimaryLayers(petajakarta.layerControl).then(petajakarta.loadSecondaryLayers);
	petajakarta.getREM(petajakarta.loadREM);

	// Finally, add the legend
	petajakarta.mapLegend.addTo(petajakarta.map);
};

/**
	Format popup with an embedded tweet

	@param {object} feature - a GeoJSON feature representing a report
*/
petajakarta.tweetPopup = function(feature){
	var popup = '<div id="tweet-container" style="width:220px; height:auto; max-height:220px; overflow-y:scroll"><blockquote class="twitter-tweet" data-conversation="none"><a target="_blank"  href="'+feature.properties.url+'">'+feature.properties.text+'</a></blockquote></div>';
	if (feature.properties.status == 'verified'){
		popup = '<div style="padding:5px"><img src="'+petajakarta.config.urlPrefix+'img/bpbd_dki.png" height="35px;"> @BPBDJakarta <i>Retweeted</i></div><div id="tweet-container" style="width:220px; height:auto; max-height:220px; overflow-y:scroll;"><blockquote class="twitter-tweet"><a target="_blank"  href="'+feature.properties.url+'">'+feature.properties.text+'</a></blockquote></div>';
	}
	return popup;
};

/**
	Format popup with a Detik report

	@param {object} feature - a GeoJSON feature representing a report
*/
petajakarta.detikPopup = function(feature){
	var popup = '<div id="detik-container" style="width:220px; height:220px; overflow-y:scroll; background-color:white;"><div class="media"><a class="pull-left" href="#"><img class="media-object" src="'+petajakarta.config.urlPrefix+'img/logo_detik.png" height="22"></a><div class="media-body"><h4 style="font-size:18px; line-height:1.2;" class="media-heading">PASANGMATA.COM</h4></div></div><p class="lead" style="margin:4px;font-size:16px;">'+feature.properties.title+'</p><img class="img-responsive" src="'+feature.properties.image_url+'" width="210"/><h5>'+feature.properties.text+'</h5><h5>'+feature.properties.created_at.replace('T',' ')+'</h5><a href="'+feature.properties.url+'" target="_blank">'+feature.properties.url+'</a></div>';
	return popup;
};

/**
	Format popup with a Qlue report

	@param {object} feature - a GeoJSON feature representing a report
*/

petajakarta.qluePopup = function(feature){
	var popup = '<div id="qlue-container" style="width:220px; height:220px; overflow-y:scroll; background-color:white;"><div class="media"><a class="pull-left" href="#"><img class="media-object" src="'+petajakarta.config.urlPrefix+'img/logo_qlue_height_32.png" height="32"></a></div><p class="lead" style="margin-bottom:4px;margin-top:4px;font-size:16px;">'+feature.properties.title+'</p><img class="img-responsive" src="'+feature.properties.image_url+'" width="210"/><h5>'+feature.properties.text+'</h5><h5>'+feature.properties.created_at.replace('T',' ')+'</div>';
	return popup;
};

/**
	Add a popup to the provided layer based on the provided feature's text property

	@param {object} feature - a GeoJSON feature
	@param {L.ILayer} layer - the layer to attach the popup to
*/
petajakarta.markerPopup = function(feature, layer) {
	if (feature.properties) {
		petajakarta.markerMap[feature.properties.pkey] = layer;
		// Render as tweet
		if (feature.properties.source == 'twitter'){
			layer.bindPopup(petajakarta.tweetPopup(feature), {autoPanPadding:([0,140])});
		}
		// Render as Detik report
		else if (feature.properties.source == 'detik'){
			layer.bindPopup(petajakarta.detikPopup(feature), {autoPanPadding:([0,60])});
		}

		// Render as Qlue
		else if (feature.properties.source == 'qlue'){
			layer.bindPopup(petajakarta.qluePopup(feature), {autoPanPadding:([0,60])});
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
	Get infrastructure overlay layer from cognicity-server

	@param {string} layer - the layer to be fetched
	@return {L.TileLayer} layer - the layer that was fetched from the server
*/
petajakarta.getInfrastructure = function(layer) {
	return new RSVP.Promise(function(resolve, reject){
		// Use live data
		jQuery.getJSON(petajakarta.config.serverUrlPrefix + "data/api/v2/infrastructure/"+layer+"?format=topojson", function(data){
				if (data.features !== null){
					resolve(topojson.feature(data, data.objects.collection));
				} else {
					resolve(null);
				}
		});
	});
};

/**
	Get infrastructure overlay layer from cognicity-server

	@param {string} layer - the layer to be fetched
	@return {L.TileLayer} layer - the layer that was fetched from the server
*/
petajakarta.getSensors = function() {
	return new RSVP.Promise(function(resolve, reject){
		// Use live data
		jQuery.getJSON(petajakarta.config.serverUrlPrefix + "data/api/v2/iot/floodsensors", function(data){
				if (data.features !== null){
					resolve(data);
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
petajakarta.infrastructureMarkerPopup = function(feature, layer){
	if (feature.properties){
		layer.bindPopup(feature.properties.name);
	}
};

/**
	Returns floodgauge icon and color based on siaga (alert) level

	@param {level} integer - the alert level (1-4)
*/
petajakarta.getSiagaLevelIconography = function(level){
	switch (level) {
		case 1:
			return {'color':'#FF4000','icon':'floodgauge_1.png'};
		case 2:
			return {'color':'#FF8000','icon':'floodgauge_2.png'};
		case 3:
			return {'color':'#F7D358','icon':'floodgauge_3.png'};
		default:
			return {'color':'#01DF01','icon':'floodgauge.png'};
	}
};

/**
	Format popup with a floodgauge report

	@param {object} feature - a GeoJSON feature representing a report
*/
petajakarta.floodgaugePopoup = function(feature){

	var label = 'Water Level (cm)';
	if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id'){
			label = 'Tinggi Muka Air (cm)';
	}
	var popup = '';
	if (feature.properties !== null){
		popup = '<div id="floodgauge-container" style="width:220px; height:220px; overflow-y:scroll"><div class="media" style="margin-top:0;"><img class="media-object pull-left" src="'+petajakarta.config.urlPrefix+'img/dki_jayaraya.png" height="22"/><img class="media-object pull-left" src="'+petajakarta.config.urlPrefix+'img/bpbd_dki.png" height="22"/><h4 style="font-size:18px; line-height:1.2;" class="media-heading pull-left">'+feature.properties.gaugenameid+'</h4></div>'+label+'&nbsp;&nbsp|&nbsp;&nbsp;<span style="color:black; background-color:'+petajakarta.getSiagaLevelIconography(feature.properties.observations[feature.properties.observations.length-1].warninglevel).color+'">'+feature.properties.observations[feature.properties.observations.length-1].warningnameid+'</span><canvas id="gaugeChart" class="chart" width="210" height="180" style="margin-top:3px;"></canvas></div>';
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
petajakarta.floodgaugeMarker = function(feature, layer){
	if (feature.properties){
		layer.bindPopup(petajakarta.floodgaugePopoup(feature),{autoPanPadding:([0,60])});
	}
};

/**
	Get TopoJSON representing flooding reports from the server

	@param {string} type - the type of report to get: `'confirmed'` or `'uncomfirmed'`
	@param {function} callback - a function to be called when data is finished loading

	Converts TopoJson to GeoJson using topojson
*/
petajakarta.getReports = function(type) {
	return new RSVP.Promise(function(resolve, reject) {
		// Use live data
		jQuery.getJSON(petajakarta.config.serverUrlPrefix + 'data/api/v2/reports/'+type+'?format=topojson', function(data) {
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
	Get GeoJSON representing a single confirmed flooding report

	@param {integer} id - the unique id of the confirmed report to get

	For single point feature GeoJSON is smaller than TopoJSON
*/
petajakarta.getReport = function(id) {
	return new RSVP.Promise(function(resolve, reject){
		jQuery.getJSON(petajakarta.config.serverUrlPrefix + 'data/api/v2/reports/confirmed/'+id+'?format=geojson', function(data){
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
petajakarta.getREM = function(callback) {
	jQuery.getJSON( petajakarta.config.remServerUrlPrefix + 'data/api/v2/rem/flooded?format=topojson&minimum_state=1', function(data){
		if (data.features !== null){
			callback(topojson.feature(data, data.objects.collection));
		}
		else {
			callback(null);
		}
	})
	.fail(function(){
		console.log('getREM(): Error fetching REM data');
	});
};

/**
	Load GeoJSON representing current flooding
	@param {object} data - geojson polygon representation of affected areas
*/
petajakarta.loadREM = function(data){
	petajakarta.floodheights = L.geoJson(data, {clickable: false, style:function(feature){
		switch (feature.properties.state) {
			case 4: return {fillColor:"#CC2A41",weight:1,color:"#CC2A41", opacity:0.8,fillOpacity: 0.8};
			case 3: return {fillColor:"#FF8300",weight:1,color:"#FF8300", opacity:0.8,fillOpacity: 0.8};
			case 2: return {fillColor:"#FFFF00",weight:1,color:"#FFFF00", opacity:0.8,fillOpacity: 0.8};
			case 1: return {fillColor:"#A0A9F7", weight:1,color:"#A0A9F7",opacity:0.8,fillOpacity: 0.8};
			default: return {color:"rgba(0,0,0,0)",weight:0,fillOpacity:0};
		}
	}}).addTo(petajakarta.map).bringToBack();

	$('#legendbox').append(petajakarta.heightsLegend);
	petajakarta.layerControl.addOverlay(petajakarta.floodheights, petajakarta.layernames.floodheights.title);
};

/** Style confirmed reports
		@param {object} feature - geojson report feature
*/
petajakarta.iconConfirmedReports = function(feature){
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
petajakarta.loadConfirmedPoints = function(reports) {
	if (reports) {
		petajakarta.loadTable(reports); //sneaky loadTable function.
		// badge reports button
		petajakarta.reportsBadge.textContent = reports.features.length;

		// create points
		petajakarta.confirmedPoints = L.geoJson(reports, {
			pointToLayer: function(feature, latlng) {
				var zIndexOffset = 0;
				if (feature.properties.status == 'verified') zIndexOffset = 1000;
				return  L.marker(latlng, {icon:petajakarta.iconConfirmedReports(feature), zIndexOffset: zIndexOffset});
			},
			onEachFeature: petajakarta.markerPopup
		});
  } else {
		petajakarta.confirmedPoints = L.geoJson(null, {
			pointToLayer: function(feature, latlng) {
				var zIndexOffset = 0;
				if (feature.properties.status == 'verified') zIndexOffset = 1000;
				return  L.marker(latlng, {icon:petajakarta.iconConfirmedReports(feature), zIndexOffset: zIndexOffset});
			},
			onEachFeature: petajakarta.markerPopup
		});
	}

	return petajakarta.confirmedPoints;
};

/**
	If a unique ID is specified in the URL, zoom to this point, getting specified point if need.
 	@param {object} report - a GeoJSON object contiaing report location and metadata
*/
petajakarta.showURLReport = function() {
	//Test if URL parameter present
	if ($.url('?report')){
			//Check if Integer
			var id = parseInt($.url('?report'));
			var err;
			if ( !validation.validateNumberParameter(id,1) ) err = new Error( "'report id parameter is invalid" );
			if (err) {
				console.log(err);
				return;
			}
			//Zoom to object if exists
			if (petajakarta.markerMap.hasOwnProperty(id)){
				petajakarta.centreMapOnPopup(id);

			}

			else {
				//Else attempt to get from server
				var promise = petajakarta.getReport(id);
				promise.then(function(data){
					petajakarta.confirmedPoints.addData(data);
					petajakarta.centreMapOnPopup(id);
					});
				}
			}
};

/**
	Plots hydrological infrastructure on map

	@param {string} layer - string - name of infrastructure layer to load
	@param {object} infrastructure - a GeoJSON object containing infrastructure features
*/

petajakarta.loadInfrastructure = function(layer, infrastructure){
	if(infrastructure) {
		if (layer == 'waterways'){
			petajakarta[layer] = L.geoJson(infrastructure, {style:petajakarta.styleInfrastructure[layer]});
		} else if (layer == 'floodgauges'){
			petajakarta[layer] = L.geoJson(infrastructure, {
				pointToLayer: function(feature, latlng) {
					return L.marker(latlng, {icon: L.icon(
						{
							iconUrl:petajakarta.config.urlPrefix+'img/'+petajakarta.getSiagaLevelIconography(feature.properties.observations[feature.properties.observations.length-1].warninglevel).icon,
							iconSize: [22,22],
							iconAnchor: [11, 11],
							popupAnchor: [0, 0]
						}
					)});
				}, onEachFeature: petajakarta.floodgaugeMarker
			}).addTo(petajakarta.map);
			$('#legendbox').append(petajakarta.gaugesLegend);
		} else {
			petajakarta[layer] = L.geoJson(infrastructure, {
				pointToLayer: function(feature, latlng) {
					return L.marker(latlng, {icon: petajakarta.styleInfrastructure[layer]});
				}, onEachFeature: petajakarta.infrastructureMarkerPopup
			});
		}
	} else {
			petajakarta[layer] = L.geoJson();
	}

	return petajakarta[layer];
};

/**
	Plots floodsensor data points on map

	@param {object} sensor data - a GeoJSON object containing sensor features
*/
petajakarta.loadSensors = function(data){

	var icon = L.divIcon({className: 'div-icon-sensor', html:'<p><span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span></p>', popupAnchor:[5,0]});

	petajakarta.sensors = L.geoJson(data, {
		pointToLayer: function(feature, latlng) {
			return L.marker(latlng, {icon:icon});
		},
		onEachFeature: function(feature, layer){
			layer.on('click', function(e){
				var properties = feature.properties;
				$('#sensorModal').modal('show').on('shown.bs.modal', function (event) {
					var ctx1 = $("#sensorChart1").get(0).getContext("2d");
					var ctx2 = $("#sensorChart2").get(0).getContext("2d");
					var depthData = {
						labels : [],
						datasets : [{
							label: "Water Depth (cm)",
							backgroundColor: "rgba(151,187,205,0.2)",
							borderColor: "rgba(151,187,205,1)",
							pointBackgroundColor: "rgba(151,187,205,1)",
							pointBorderColor: "#fff",
	            pointRadius: 4,
							data: []
						}]
					};
					var metData = {
						labels : [],
						datasets : [{
							label: "Air temperature (°C)",
							backgroundColor: "rgba(0,0,0,0)",
							borderColor: "rgba( 245, 176, 65 ,1)",
							pointBackgroundColor: "rgba( 245, 176, 65 ,1)",
							pointBorderColor: "#fff",
							pointRadius: 4,
							data: []
						}, {
							label: "Humidity (%)",
							backgroundColor: "rgba(0,0,0,0)",
							borderColor: "rgba( 88, 214, 141 ,1)",
							pointBackgroundColor: "rgba( 88, 214, 141 ,1)",
							pointBorderColor: "#fff",
							pointRadius: 4,
							data: []
						}]
					};
					for (var i = 0; i < properties.measurements.length; i++){
						depthData.labels.push(properties.measurements[i].measurement_time.slice(11,16));
						depthData.datasets[0].data.push(properties.measurements[i].computed_depth);
						metData.labels.push(properties.measurements[i].measurement_time.slice(11,16));
						metData.datasets[0].data.push(properties.measurements[i].temperature);
						metData.datasets[1].data.push(properties.measurements[i].humidity);
					}
					var gaugeChart = new Chart(ctx1,
						{type: 'line',
						data:depthData,
						options: {
							bezierCurve:true,
							scaleLabel: "<%= ' ' + value%>",
							legend: {display:true}
							}
						});
					var metChart = new Chart(ctx2,
						{type: 'line',
						data:metData,
						options: {
							bezierCurve:true,
							scaleLabel: "<%= ' ' + value%>",
							legend: {display:true}
							}
						});
					});
				});
			}
	});

	return petajakarta.sensors;
};



/**
	Centre the map on a given location and open a popup's text box.

	Turn on point layer if required.

	@param {string} pkey - the key of the marker to display
	@param {number} lat - latitude to center on
	@param {number} lon - longitude to center on
*/
petajakarta.centreMapOnPopup = function(pkey,lat,lon) {
	if (petajakarta.map.hasLayer(petajakarta.confirmedPoints) === false){
		petajakarta.confirmedPoints.addTo(petajakarta.map).bringToFront();
	}

	var m = petajakarta.markerMap[pkey];
	petajakarta.map.setView(m._latlng, 17);
	m.openPopup();
};

/**
	Center the map on the user's location if they're in jakarta & add a pin to show location
	See http://leafletjs.com/examples/mobile.html for reference implementation.

	@param {Position} position - the user's position as provided by client browser
*/
petajakarta.setViewJakarta = function(position) {
	if (position.coords.latitude >= -6.4354 && position.coords.latitude <= -5.9029 &&
		  position.coords.longitude >= 106.5894 && position.coords.longitude <= 107.0782) {
				petajakarta.map.setView(L.latLng(position.coords.latitude,position.coords.longitude), 17, {animate:true}); // Set to the users current view
				// Color the user location button as feedback
				$('.leaflet-control-location-button').css("background-image", "url("+petajakarta.config.urlPrefix+"img/location-icon-blue.png)");
				$('.leaflet-retina .leaflet-control-location-button').css("background-image", "url("+petajakarta.config.urlPrefix+"img/location-icon-2x-blue.png)");

				//Remove existing marker if present
				if (petajakarta.bluedot){
					petajakarta.map.removeLayer(petajakarta.bluedot);
				}
				// Add new marker
				petajakarta.bluedot = L.marker([position.coords.latitude,position.coords.longitude]);
				petajakarta.bluedot.addTo(petajakarta.map);
	}
};

petajakarta.loadPrimaryLayers = function(layerControl) {
	var layerPromises = {
		confirmed: petajakarta.getReports('confirmed')
			.then(petajakarta.loadConfirmedPoints)};

	return new RSVP.Promise(function(resolve, reject) {
		RSVP.hash(layerPromises).then(function(overlays) {
			layerControl.addBaseLayer(overlays.confirmed, petajakarta.layernames.confirmed);
			overlays.confirmed.addTo(petajakarta.map);
			petajakarta.map.spin(false);

			resolve(layerControl);
		}, reject);
	});
};

petajakarta.loadSecondaryLayers = function(layerControl) {
	return new RSVP.Promise(function(resolve, reject) {
		var secondaryPromises = {
			waterways: petajakarta.getInfrastructure('waterways')
				.then(function(waterways){
					return petajakarta.loadInfrastructure('waterways', waterways);
				}),
			pumps: petajakarta.getInfrastructure('pumps')
				.then(function(pumps){
					return petajakarta.loadInfrastructure('pumps', pumps);
				}),
			floodgates: petajakarta.getInfrastructure('floodgates')
				.then(function(floodgates){
					return petajakarta.loadInfrastructure('floodgates', floodgates);
				}),
			floodgauges: petajakarta.getInfrastructure('floodgauges')
				.then(function(floodgauges){
					return petajakarta.loadInfrastructure('floodgauges', floodgauges);
				}),
			sensors: petajakarta.getSensors()
				.then(function(sensors){
					return petajakarta.loadSensors(sensors);
				})
		};

		RSVP.hash(secondaryPromises).then(function(overlays) {
			// Add overlays to the layer control
			layerControl.addOverlay(overlays.floodgauges, petajakarta.layernames.floodgauges);
			layerControl.addOverlay(overlays.pumps, petajakarta.layernames.pumps);
			layerControl.addOverlay(overlays.floodgates, petajakarta.layernames.floodgates);
			layerControl.addOverlay(overlays.waterways, petajakarta.layernames.waterways);
			layerControl.addOverlay(overlays.sensors, 'Sensors/Sensor');
			petajakarta.showURLReport(); //once point layers loaded zoom to report specified in URL
		});
	});
};

/**
 * Generate a table based on the provided reports
 * @file JavaScript to display confirmed reports within map (PetaJakarta.org) via map.js
 * @copyright (c) Tomas Holderness & SMART Infrastructure Facility January 2014
 * @module reports
 *
 * @param {object} reports - a GeoJSON object
 */
petajakarta.loadTable = function(reports) {
	var rows, thead;

	rows = "";

	for (var i=0;i<reports.features.length;i++) {
		var report = reports.features[i].properties;
		var reportGeo = reports.features[i].geometry;

		var logo = "";
		if (report.source == 'detik'){
			logo = '<img src="https://pasangmata.detik.com/assets/fe/img/logo_detik.png" height="22">';
		}
		else if (report.source == 'twitter'){
			logo = '<img src="'+petajakarta.config.urlPrefix +'/img/twitter_logo_blue.png" height="22">';
		}
		else if (report.source == 'qlue'){
			logo = '<img src="'+petajakarta.config.urlPrefix +'/img/logo_qlue_height_22.png" height="22">';
		}
		if (report.status == 'verified'){
			logo+= ' <img src="'+petajakarta.config.urlPrefix +'/img/bpbd_dki.png" height="22">';
		}

		//Catch those reports that have no text, only a title
		var text = report.text;
		if (report.text.length < 1){
			text += report.title;
		}

		rows +='<tr>';
			rows += '<td>' + report.created_at.substring(11, 19) + '</td>'; // Time
			rows += '<td>' + logo + '</td>';
			rows += '<td><a data-dismiss="modal" href="#map" onclick="javascript:petajakarta.centreMapOnPopup('+report.pkey+','+reportGeo.coordinates[1]+','+reportGeo.coordinates[0]+')">'+text+'</a></td>'; // Message
		rows += '</tr>';
	}
	if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id') {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Waktu</th><th class="col-xs-2">Sumber</th><th class="col-xs-6">Laporkan</th></tr></thead>';
	} else {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Time</th><th class="col-xs-2">Source</th><th class="col-xs-6">Message</th></tr></thead>';
	}
	var tbody = '<tbody>'+rows+'</tbody></table>';

	// Wait until the includes have been loaded before we insert this table into the DOM
	petajakarta.loadedIncludes.then( function(v){
		$("#modal-reports-body").append(thead+tbody);
	}).catch( function(e) {
		// TODO Handle error
	});
};
