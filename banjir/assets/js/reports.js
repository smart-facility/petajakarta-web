/**
 * Generate a table based on the provided reports
 * 
 * @param {object} reports - a GeoJSON object
 */
function loadTable(reports) {
	var rows, thead;

	rows = "";

	for (var i=0;i<reports.features.length;i++) {
		rows +='<tr><td>'+reports.features[i].properties.created_at.substring(11, 19)+'</td><td><a data-dismiss="modal" href="#map" onclick="javascript:centreMapOnPopup('+reports.features[i].properties.pkey+','+reports.features[i].geometry.coordinates[1]+','+reports.features[i].geometry.coordinates[0]+')">'+reports.features[i].properties.text+'</a></td></tr>';
	}
	if (document.documentElement.lang == 'in') {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Waktu</th><th class="col-xs-8">Sumber</th></tr></thead>';
	} else {
		thead = '<table class="table table-hover"><thead><tr><th class="col-xs-2">Time</th><th class="col-xs-8">Message</th></tr></thead>';
	}
	var tbody = '<tbody>'+rows+'</tbody></table>';
	$("#modal-reports-body").append(thead+tbody);
}
