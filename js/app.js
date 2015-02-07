/**
 Model for places
**/
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


	/**
	 when search button is clicked call this function
	**/
	self.searchPlaces = function() {

		//create an array to pass places to google map 
		var allPlaces = [];
		var i = 0;
		//remove all markers from previous search
		while (i < Markers.length) {
			Markers[i].setMap(null);
			i++;
		}
		Markers.lenght = 0;
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
			// set bounds according to suggested bounds from foursquare 
			var Bounds = data.response.suggestedBounds;
			var bounds = new google.maps.LatLngBounds(
				new google.maps.LatLng(Bounds.sw.lat, Bounds.sw.lng),
				new google.maps.LatLng(Bounds.ne.lat, Bounds.ne.lng));
			map.fitBounds(bounds);
			// center the map
			map.setCenter(bounds.getCenter());

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
      createMapMarker(placeData) reads Places information to create map pins.
      placeData is the object returned from search results containing information
      about a single location from fourSquare Api.
    **/

	function createMapMarker(placeData) {

		// The next lines save location data from the search result object to local variables
		var lat = placeData.location.lat; // latitude from the place service
		var lon = placeData.location.lng; // longitude from the place service
		var name = placeData.name; // name of the place from the place service
		var address = placeData.location.address + ',' + placeData.location.city + ',' + placeData.location.country; // address for the place
		var contact = placeData.contact.formattedPhone; //place phone number
		var rating = placeData.rating; //place rating
		var placeUrl = placeData.url; //place url for its website 

		// marker is an object with additional data about the pin for a single location
		var marker = new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(lat, lon),
			title: name
		});

		//save marker for each place in this array
		Markers.push(marker);

		// load streetview
		var streetviewUrl = 'http://maps.googleapis.com/maps/api/streetview?size=200x110&location=' + address + '';
		//create new content 
		var contentString = '<div class="venueInfowindow">' + '<div class="venueName">' + '<a href ="' + placeUrl + '" target="_blank" >' + name + '</a>' + '<span class="venueRating label-info badge">' + rating + '<sub> /10</sub>' + '</span>' + '</div>' + '<div class="venueContact"><span class="icon-phone"></span>' + contact + '</div>' + '<img class="bgimg" src="' + streetviewUrl + '">' + '</div>';

		// infoWindows are the little helper windows that open when you click
		// or hover over a pin on a map. They usually contain more information
		// about a location.
		var infoWindow = new google.maps.InfoWindow({
			content: contentString
		});

		google.maps.event.addListener(marker, 'click', function() {
			infoWindow.open(map, marker);
		});


	}



	/**
      pinPoster(Places) takes in the array of Places received from foursquer 
      and call createMapMarker for each location
    **/

	function pinPoster(Places) {
		// call createMapMarker for places
		for (var i in Places) {
			createMapMarker(Places[i]);
		}
	}


	/**
	 When list item clicked on UI then call this function
	 Look if name of clicked item is equal to anyone in markers list
	**/
	self.focusMarker = function(venue) {
		var venueName = venue.name();
		for (var i in Markers) {
			if (Markers[i].title == venueName) {
				google.maps.event.trigger(Markers[i], 'click');
				map.panTo(Markers[i].position);
			}
		}
	}

};

/**
 Initialize google map
**/

function initializeMap() {

	var places;
	var mapOptions = {
		zoom: 15,
		disableDefaultUI: true
	};

	// This next line makes `map` a new Google Map JavaScript Object and attaches it to
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	$('#map-canvas').height($(window).height());
}

// declares a global map variable
var map;

$(function() {

	initializeMap();
	ko.applyBindings(new ViewModel());

});
