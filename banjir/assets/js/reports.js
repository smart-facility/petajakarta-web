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

		var logo = "";
		if (report.source == 'detik'){
			logo = '<img src="https://pasangmata.detik.com/assets/fe/img/logo_detik.png" height="22">';
		}
		else if (report.source == 'twitter'){
			logo = '<img src="/banjir/img/twitter_logo_blue.png" height="22">';
		}
		else if (report.source == 'qlue'){
			logo = '<img src="/banjir/img/logo_qlue_height_22.png" height="22">';
		}
		if (report.status == 'verified'){
			logo+= ' <img src="/banjir/img/bpbd_dki.png" height="22">';
		}

		//Catch those reports that have no text, only a title
		var text = report.text;
		if (report.text.length < 1){
			text += report.title;
		}

		rows +='<tr>';
			rows += '<td>' + report.created_at.substring(11, 19) + '</td>'; // Time
			rows += '<td>' + logo + '</td>';
			rows += '<td><a data-dismiss="modal" href="#map" onclick="javascript:centreMapOnPopup('+report.pkey+','+reportGeo.coordinates[1]+','+reportGeo.coordinates[0]+')">'+text+'</a></td>'; // Message
		rows += '</tr>';
	}
	if (document.documentElement.lang == 'in' || document.documentElement.lang == 'id') {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Waktu</th><th class="col-xs-2">Sumber</th><th class="col-xs-6">Laporkan</th></tr></thead>';
	} else {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Time</th><th class="col-xs-2">Source</th><th class="col-xs-6">Message</th></tr></thead>';
	}
	var tbody = '<tbody>'+rows+'</tbody></table>';
	$("#modal-reports-body").append(thead+tbody);
}
