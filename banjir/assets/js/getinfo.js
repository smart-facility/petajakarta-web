var map, popup;

var mapquestUrl = '/web/20130525053623/http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
	mapquestAttribution = "Data CC-By-SA by <a href='/web/20130525053623/http://openstreetmap.org/' target='_blank'>OpenStreetMap</a>, Tiles Courtesy of <a href='/web/20130525053623/http://open.mapquest.com' target='_blank'>MapQuest</a>",
	mapquest = new L.TileLayer(mapquestUrl, {maxZoom: 18, attribution: mapquestAttribution, subdomains: ['1','2','3','4']});

var nexrad = new L.TileLayer.WMS("/web/20130525053623/http://suite.opengeo.org/geoserver/usa/wms", {
	layers: 'usa:states',
	format: 'image/png',
	transparent: true
});

map = new L.Map('map', {
	center: new L.LatLng(44.095475729465, -72.388916015626),
	zoom: 7,
	layers: [mapquest, nexrad],
	zoomControl: true
});

map.addEventListener('click', onMapClick);

popup = new L.Popup({
	maxWidth: 400
});

function onMapClick(e) {
    var latlngStr = '(' + e.latlng.lat.toFixed(3) + ', ' + e.latlng.lng.toFixed(3) + ')';
    var BBOX = map.getBounds().toBBoxString();
    var WIDTH = map.getSize().x;
    var HEIGHT = map.getSize().y;
    var X = map.layerPointToContainerPoint(e.layerPoint).x;
    var Y = map.layerPointToContainerPoint(e.layerPoint).y;
    var URL = '?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=usa:states&QUERY_LAYERS=usa:states&STYLES=&BBOX='+BBOX+'&FEATURE_COUNT=5&HEIGHT='+HEIGHT+'&WIDTH='+WIDTH+'&FORMAT=image%2Fpng&INFO_FORMAT=text%2Fhtml&SRS=EPSG%3A4326&X='+X+'&Y='+Y;
    URL = escape(URL);
    $.ajax({
        url: "wms_proxy.php?&args=" + URL,
        dataType: "html",
        type: "GET",
        success: function(data) {
            if (data.indexOf("<table") != -1) {
                popup.setContent(data);
                popup.setLatLng(e.latlng);
                map.openPopup(popup);
            }
        }
    });
}

function DoTheCheck() {
	if (document.checkform.getfeatureinfo.checked === true)
	  {map.addEventListener('click', onMapClick);}
	if (document.checkform.getfeatureinfo.checked === false)
	  {map.removeEventListener('click', onMapClick); map.closePopup(popup);}
}
