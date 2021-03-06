/**
 * Model for neighborhood places
 */
var PopularPlaces = function(item) {
	this.name = ko.observable(item.venue.name);
	this.category = ko.observable(item.venue.categories[0].name);
	this.address = ko.observable(item.venue.location.formattedAddress);
	this.phone = ko.observable(item.venue.contact.formattedPhone);
	this.rating = ko.observable(item.venue.rating);
	this.imgSrc = ko.observable('https://irs0.4sqi.net/img/general/100x100' + item.venue.photos.groups[0].items[0].suffix);
}


var ViewModel = function() {
	var self = this;
	// create an array to keep marker map locations
	var Markers = [];

	// create an observable array to keep each popular place in it
	self.placeList = ko.observableArray([]);

	//prefered location for search to find places
	this.preferredLoc = ko.observable("New York, NY");
	//prefered type of location
	this.preferredExplore = ko.observable("pizza");
	// boolean value for places list display
	self.displayPlaces = ko.observable('true');

	// infoWindows are the little helper windows that open when you click or hover over a pin on a map
	if (typeof google != "undefined") {
		var infoWindow = new google.maps.InfoWindow();
	}

	/**
	 * Remove all markers from maps
	 */

	function removeMarkers() {
		//remove all markers from map
		for (var i = 0; i < Markers.length; i++) {
			Markers[i].setMap(null);
		}
	}

	/**
	 * Set google map boundry base on suggested boundry from fourSqure APP
	 * @param {object} bounds_suggested - boundry from API.
	 */

	function setMapBoundry(bounds_suggested) {
		if (typeof google != "undefined") {
			// set bounds according to suggested bounds from foursquare 
			var bounds_target = new google.maps.LatLngBounds(
				new google.maps.LatLng(bounds_suggested.sw.lat, bounds_suggested.sw.lng),
				new google.maps.LatLng(bounds_suggested.ne.lat, bounds_suggested.ne.lng));
			neighborMap.fitBounds(bounds_target);
			// center the map
			neighborMap.setCenter(bounds_target.getCenter());
		}

	}

	/**
	 * When search button is clicked call this function
	 * First filter through list if the key word was not in current list
	 * then send it through API call
	 */
	self.searchPlaces = function() {

		//create an array to pass places to google map 
		var allPlaces = [];
		removeMarkers();
	
		// empty out popular list arry for each search
		self.placeList([]);

		
		// near of place for api request
		var placeNear = '&near=' + self.preferredLoc();
		// query to find places
		var query = '&query=' + self.preferredExplore();

		// load popular places
		var foursqureUrl = 'https://api.foursquare.com/v2/venues/explore?' + '&client_id=TYMQXOULIRK3I4V0E5BPIDPWYPCFMNDSXMS0C0AY2P5NJOXN' + '&client_secret= R4RUV2LSQVGVBK1SIIUEH2LYQ1FM3QC4QC0NEMVK0B2OCTIA' + '&v=20150102&venuePhotos=1' + placeNear + query;

		//Get json data from four sqaure API 
		$.getJSON(foursqureUrl, function(data) {

			var places = data.response.groups[0].items;
			setMapBoundry(data.response.suggestedBounds)

			for (var i = 0; i < places.length; i++) {
				var item = places[i];
				// just add those items in list which has picture
				if (item.venue.photos.groups.length != 0) {
					self.placeList.push(new PopularPlaces(item));
					allPlaces.push(item.venue);
				};
			}
			// sort an array based on ranking
			self.placeList.sort(function(left, right) {
				return left.rating() == right.rating() ? 0 : (left.rating() > right.rating() ? -1 : 1)
			});
			// create marker for all places on map
			pinPoster(allPlaces);
		}).error(function(e) {
			$('.venu-group').html('<h4>There is problem to retrieve data</br>Please try again later</h4>')
			console.log('error');
		});
		
	}

	self.searchPlaces();
	/**
	 * set InfoWindo value
	 * @param {object} placeData - places retrive from api
	 * @param {object} marker - marker location
	 */

	function setInfoWindo(placeData, marker) {

		var address = placeData.location.address + ',' + placeData.location.city + ',' + placeData.location.country; // address for the place
		var contact = placeData.contact.formattedPhone; //place phone number
		var rating = placeData.rating; //place rating
		var placeUrl = placeData.url; //place url for its website 
		var name = placeData.name;
		//street view
		var streetviewUrl = 'http://maps.googleapis.com/maps/api/streetview?size=200x110&location=' + address + '';
		//create new content 
		var contentString = '<div class="venueInfowindow">' + '<div class="venueName">' + '<a href ="' + placeUrl + '" target="_blank" >' + name + '</a>' + '<span class="venueRating label-info badge">' + rating + '<sub> /10</sub>' + '</span>' + '</div>' + '<div class="venueContact"><span class="icon-phone"></span>' + contact + '</div>' + '<img class="bgimg" src="' + streetviewUrl + '">' + '</div>';

		google.maps.event.addListener(marker, 'click', function() {
			infoWindow.setContent(contentString);
			infoWindow.open(neighborMap, marker);
		});
	}

	/**
	 * createMapMarker(placeData) reads Places information to create map pins.
	 * @param {object} placeData - placeData is the object returned from search results containing information about the place from fourSquare Api
	 */

	function createMapMarker(placeData) {

		var lat = placeData.location.lat; // latitude from the place service
		var lon = placeData.location.lng; // longitude from the place service
		var name = placeData.name; // name of the place from the place service

		if (typeof google != "undefined") {
			// marker is an object with additional data about the pin for a single location
			var marker = new google.maps.Marker({
				map: neighborMap,
				position: new google.maps.LatLng(lat, lon),
				title: name
			});

			//save marker for each place in this array
			Markers.push(marker);

			setInfoWindo(placeData, marker)
		}


	}



	/**
	 * pinPoster(Places) takes in the array of Places received from foursquer and call createMapMarker for each location
	 * @param {object} Places - is an array of object returned from search results containing information about the places from fourSquare Api
	 */

	function pinPoster(Places) {
		// call createMapMarker for places
		for (var i in Places) {
			createMapMarker(Places[i]);
		}
	}
	/**
	 * Change the boolean value of displaying places list  
	 * When user click on collapsible icon
	 */
	self.toggleDisplay = function() {
		self.displayPlaces(!self.displayPlaces());
	}

	/**
	 * When list item clicked on UI then call this function
	 * Look if name of clicked item is equal to anyone in markers list
	 * @param {object} venue - is an object  containing information about the clicked place
	 */
	self.focusMarker = function(venue) {
		var venueName = venue.name();
		for (var i = 0; i < Markers.length; i++) {
			if (Markers[i].title == venueName) {
				google.maps.event.trigger(Markers[i], 'click');
				neighborMap.panTo(Markers[i].position);
			}
		}
		// call it just for small screen 
		if($('#display_list').css('display')!="none"){
		    self.toggleDisplay();
		}
		   
	}
	

};

/**
 * Initialize google MAP
 */

function initializeMap() {

	var places;
	var mapOptions = {
		zoom: 15,
		disableDefaultUI: true
	};

	try {
		// This next line makes `neighborMap` a new Google Map JavaScript Object and attaches it to
		neighborMap = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		$('#map-canvas').height($(window).height());
	} catch (err) {
		//if google map api didnt respond
		$('#map-canvas').hide();
		$('#map-error').html('<h5>There is problem to retrieve data from google map</br>Please try again later</h5>');

	}
}


// declares a global MAP variable
var neighborMap;

$(document).ready(function() {

	initializeMap();
	ko.applyBindings(new ViewModel());

});
