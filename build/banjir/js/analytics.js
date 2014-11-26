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

var aggregateHours = 24;

/**
	Get GeoJSON representing counts of reports in RW polygons
	@param {function} callback - a function to be called when data is finished loading
	@param {level} string - administrative boundary level to load. Can be 'rw' or 'village', also passed to load function for identification
*/
var getAggregates = function(level) {

		jQuery.getJSON('/banjir/data/api/v1/aggregates/live?format=topojson&level='+level+'&hours='+aggregateHours, function(data) {
			loadAggregates(level, topojson.feature(data, data.objects.collection));
		});
};

/**
	Plots counts of reports in RW polygons

	@param {string} level - string - administrative boundary level to load. Can be 'rw' or 'village', should be passed from getfunction
	@param {object} aggregates - a GeoJSON object containing polygon features
*/

var aggregateLayers = {};
var aggregateVersions = {};
var aggregateInc = 0;

var loadAggregates = function(level, aggregates){
	var aggregateLayer = L.geoJson(aggregates, {style:styleAggregates});
	aggregateLayer.addTo(map);
};

/**
	Styles counts of reports in RW polygons

	@param {object} feature - individual Leaflet/GeoJSON feature object
	*/
function styleAggregates(feature) {
    return {
        fillColor: getColor(feature.properties.count),
        weight: 0.7,
				//disabled polygon borders for clarity
        //opacity: 1,
        color: 'black',
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
	Legend box
*/
var legend = L.control({position:'bottomleft'});

legend.onAdd = function(map) {

	var div = L.DomUtil.create('div', 'info legend'),
	grades = [0,1, 5, 10, 15, 20, 25, 30],
	labels = [];
  // label for legend
	div.innerHTML+='Number of reports<BR>';
	// loop through density intervals and generate label with coloured square
	for (var i=0; i <grades.length; i++) {
		div.innerHTML += '<i class="color" style="background:'+getColor(grades[i]+1) + '"></i>';
	}
  div.innerHTML += '<br>';
	// loop through density intervals and generate label with coloured square
	for (i=0; i <grades.length; i++) {
		div.innerHTML += '<span class="number">'+grades[i]+'</span>';
	}

	return div;
};

//Initialise map
var latlon = new L.LatLng(-6.26, 106.8317); //Centre Jakarta
var map = L.map('static_map', {zoomControl:false}).setView(latlon, 11); // Initialise map
map.attributionControl.setPrefix('');
map.dragging.disable();
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
if (map.tap) map.tap.disable();

getAggregates('city');

//Add legend
legend.addTo(map);

//Count of reports
jQuery.getJSON("/banjir/data/api/v1/reports/count", function(data){
	console.log(data.data.uc_count);
});
