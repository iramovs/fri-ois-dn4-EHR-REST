
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


function kreirajEHRzaBolnika() {
	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    $("#preberiEHRid").val(ehrId);
		                    $("#dodajVitalnoEHR").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}

function generirajEHR() {
	sessionId = getSessionId();
	

}

function preberiEHR() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Oseba '" + party.firstNames + " " + party.lastNames + "', ki se je rodila '" + party.dateOfBirth + "'.</span>");
				console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}	
}


function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	
	console.log(telesnaTemperatura);
	if (telesnaTemperatura >= 37) {
		$("#ugotovitve").html("Doniranje krvi je odsvetovano, če ste bolani! Svetujemo pregled pri zdravniku.");
	} else if (sistolicniKrvniTlak > 140 || diastolicniKrvniTlak > 105) {
		$("#ugotovitve").html("Odsvetujemo darovanje krvi zaradi povišanega krvnega tlaka.");
	} else if (sistolicniKrvniTlak < 100 || diastolicniKrvniTlak < 50) {
		$("#ugotovitve").html("Odsvetujemo darovanje krvi zaradi prenizkega krvnega tlaka.");
	} else {
		$("#ugotovitve").html("Izpolnjujete vse osnovne pogoje za darovanje krvi.");
	}

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
			
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    
		};
		var parametriZahteve = {
		    "ehrId": ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
	}
}


function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();	

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	
	if (!ehrId || ehrId.trim().length == 0 ) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za telesno temperaturo od osebe <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				
				var AQL = 
					"select " +
    					"t/data[at0002]/events[at0003]/time/value as cas, " +
    					"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
    					"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
					"from EHR e[e/ehr_id/value='" + 	ehrId + "'] " +
					"contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
					"where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
					"order by t/data[at0002]/events[at0003]/time/value desc " +
					"limit 10";
					$.ajax({
					    url: baseUrl + "/query?" + $.param({"aql": AQL}),
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
					    	if (res) {
					    		var rows = res.resultSet;
						        for (var i in rows) {
						            results += "<tr><td>" + rows[i].cas + "</td><td class='text-right'>" + rows[i].temperatura_vrednost + " " 	+ rows[i].temperatura_enota + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}

					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});

	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
	    	}
		});
	}
}


$(document).ready(function() {
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
});