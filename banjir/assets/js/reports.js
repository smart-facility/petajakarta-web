/**
 * Generate a table based on the provided reports
 *@file JavaScript to display confirmed reports within map (PetaJakarta.org) via map.js
 *@copyright (c) Tomas Holderness & SMART Infrastructure Facility January 2014
 *@module reports
 *
 * @param {object} reports - a GeoJSON object
 */
function loadTable(reports) {
	var rows, thead;

	rows = "";

	for (var i=0;i<reports.features.length;i++) {
		var report = reports.features[i].properties;
		var reportGeo = reports.features[i].geometry;

		rows +='<tr>';
			rows += '<td>' + report.created_at.substring(11, 19) + '</td>'; // Time
			rows += '<td><a data-dismiss="modal" href="#map" onclick="javascript:centreMapOnPopup('+report.pkey+','+reportGeo.coordinates[1]+','+reportGeo.coordinates[0]+')">'+report.text+'</a></td>'; // Message
		rows += '</tr>';
	}
	if (document.documentElement.lang == 'in') {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Waktu</th><th class="col-xs-6">Sumber</th></tr></thead>';
	} else {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Time</th><th class="col-xs-6">Message</th></tr></thead>';
	}
	var tbody = '<tbody>'+rows+'</tbody></table>';
	$("#modal-reports-body").append(thead+tbody);
}
