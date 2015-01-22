var PopularPlaces=function(item){
	this.name=ko.observable(item.venue.name);
	this.category=ko.observable(item.venue.categories[0].name);
	this.address=ko.observable(item.venue.location.formattedAddress);
	this.phone=ko.observable(item.venue.contact.formattedPhone);
	this.rating=ko.observable(item.venue.rating);
	this.imgSrc=ko.observable('img/434164568_fea0ad4013_z.jpg');
	this.tips=ko.observable(item.tips[0].text)
}


var ViewModel = function() {
	var self = this;
	this.placeList = ko.observableArray([]);
	// create an array to pass locations to google map 
	var allLocations = [];

	// load popular places
	var foursqureUrl = 'https://api.foursquare.com/v2/venues/explore?ll=40.7,-74&section=topPicks' + '&client_id=TYMQXOULIRK3I4V0E5BPIDPWYPCFMNDSXMS0C0AY2P5NJOXN' + '&client_secret= R4RUV2LSQVGVBK1SIIUEH2LYQ1FM3QC4QC0NEMVK0B2OCTIA' + '&v=20150102';


	$.getJSON(foursqureUrl, function(data) {

		var places = data.response.groups[0].items;
		for (var i = 0; i < places.length; i++) {
			var item = places[i];
			self.placeList.push(new PopularPlaces(item));
			allLocations.push(item.venue.location.formattedAddress[0] + ',' + item.venue.location.formattedAddress[1]);
		}
		initializeMap();
	}).error(function(e) {
		console.log('error');
	});


	/*
     initializeMap() 
    */

	function initializeMap() {

		var locations;
		var mapOptions = {
			zoom: 15,
			disableDefaultUI: true
		};

		// This next line makes `map` a new Google Map JavaScript Object and attaches it to
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


		/*
         createMapMarker(placeData) reads Google Places search results to create map pins.
         placeData is the object returned from search results containing information
         about a single location.
        */

		function createMapMarker(placeData) {

			// The next lines save location data from the search result object to local variables
			var lat = placeData.geometry.location.lat(); // latitude from the place service
			var lon = placeData.geometry.location.lng(); // longitude from the place service
			var name = placeData.name; // name of the place from the place service
			var bounds = window.mapBounds; // current boundaries of the map window

			// marker is an object with additional data about the pin for a single location
			var marker = new google.maps.Marker({
				map: map,
				position: placeData.geometry.location,
				title: name
			});
			//create new content to style it
			var contentString = '<div id="content" style="border: 1px solid black; margin-top: 8px; background: orange; padding: 5px;  font-weight: bold;">' +
				name +
				'</div>';
			var contentString = name;

			// infoWindows are the little helper windows that open when you click
			// or hover over a pin on a map. They usually contain more information
			// about a location.
			var infoWindow = new google.maps.InfoWindow({
				content: contentString
			});


			google.maps.event.addListener(marker, 'click', function() {
				infoWindow.open(map, marker);
			});

			// this is where the pin actually gets added to the map.
			// bounds.extend() takes in a map location object
			bounds.extend(new google.maps.LatLng(lat, lon));
			// fit the map to the new marker
			map.fitBounds(bounds);
			// center the map
			map.setCenter(bounds.getCenter());
		}

		/*
         callback(results, status) makes sure the search returned results for a location.
         If so, it creates a new map marker for that location.
        */

		function callback(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				createMapMarker(results[0])
			}
		}

		/*
        pinPoster(locations) takes in the array of locations received from ajax foursquer 
        and fires off Google place searches for each location
        */

		function pinPoster(locations) {

			// creates a Google place search service object. PlacesService does the work of
			// actually searching for location data.
			var service = new google.maps.places.PlacesService(map);

			// Iterates through the array of locations, creates a search object for each location
			for (place in locations) {

				// the search request object
				var request = {
					query: locations[place]
				}

				// Actually searches the Google Maps API for location data and runs the callback 
				// function with the search results after each search.
				service.textSearch(request, callback);
			}
		}

		// Sets the boundaries of the map based on pin locations
		window.mapBounds = new google.maps.LatLngBounds();

		//pinPoster(locations) creates pins on the map for each location in
		// the locations array
		pinPoster(allLocations);

	};

};
 // declares a global map variable
var map;    
ko.applyBindings(new ViewModel());
