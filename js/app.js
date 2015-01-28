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
	// create an array to pass places to google map 
	var allPlaces = [];

	// load popular places
	var foursqureUrl = 'https://api.foursquare.com/v2/venues/explore?ll=40.7,-74&section=topPicks' + '&client_id=TYMQXOULIRK3I4V0E5BPIDPWYPCFMNDSXMS0C0AY2P5NJOXN' + '&client_secret= R4RUV2LSQVGVBK1SIIUEH2LYQ1FM3QC4QC0NEMVK0B2OCTIA' + '&v=20150102';


	$.getJSON(foursqureUrl, function(data) {

		var places = data.response.groups[0].items;
		for (var i = 0; i < places.length; i++) {
			var item = places[i];
			self.placeList.push(new PopularPlaces(item));
			allPlaces.push(item.venue);
		}
		initializeMap();
	}).error(function(e) {
		console.log('error');
	});


	/*
     initializeMap() 
    */

	function initializeMap() {

		var places;
		var Markers=[];
		var mapOptions = {
			zoom: 15,
			disableDefaultUI: true
		};

		// This next line makes `map` a new Google Map JavaScript Object and attaches it to
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		$('#map-canvas').height($(window).height());


		/*
         createMapMarker(placeData) reads Places information to create map pins.
         placeData is the object returned from search results containing information
         about a single location from fourSquare Api.
        */

		function createMapMarker(placeData) {

			// The next lines save location data from the search result object to local variables
			var lat = placeData.location.lat; // latitude from the place service
			var lon = placeData.location.lng; // longitude from the place service
			var name = placeData.name; // name of the place from the place service
			var category = placeData.categories[0].name;    
			var address = placeData.location.formattedAddress;
			var contact = placeData.contact.formattedPhone;
			var rating =  placeData.rating;
			var placeUrl= placeData.url;
			var bounds = window.mapBounds; // current boundaries of the map window

			// marker is an object with additional data about the pin for a single location
			var marker = new google.maps.Marker({
				map: map,
				position: new google.maps.LatLng(lat, lon),
				title: name
			});
			
			//save marker for each place in this array
			Markers.push(marker);
			//create new content to style it
			var contentString = '<div class="venueInfowindow">' 
							+ '<div class="venueName">'
							+ '<a href ="' + placeUrl + '" target="_blank" >'
							+ name
							+ '</a>'
			                + '</br>'
							+ '<span class="venueRating badge">'
							+ rating
							+ '</span>'
							+ '</div>'
							+ '<div class="venueCategory"><span class="glyphicon glyphicon-tag"></span>'
							+ category
							+ '</div>'
							+ '<div class="venueAddress"><span class="glyphicon glyphicon-home"></span>'
							+ address
							+ '</div>'
							+ '<div class="venueContact"><span class="glyphicon glyphicon-earphone"></span>'
							+ contact
							+ '</div>'   						    						    						
							+ '</div>';

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
        pinPoster(Places) takes in the array of Places received from ajax foursquer 
        and fires off Google place searches for each location
        */

		function pinPoster(Places) {

			// creates a Google place search service object. PlacesService does the work of
			// actually searching for location data.
			var service = new google.maps.places.PlacesService(map);

			// Iterates through the array of Places, creates a search object for each location
			for (place in Places) {

				// the search request object
				var request = {
					query: Places[place].location.formattedAddress[0] + ',' + Places[place].location.formattedAddress[1] 
				}

				// Actually searches the Google Maps API for location data and runs the callback 
				// function with the search results after each search.
				service.textSearch(request, function(results, status) {
			            if (status == google.maps.places.PlacesServiceStatus.OK) {
							// call createMapMarker for places
						    for (var i in Places) {
						           createMapMarker(Places[i]);
						     }
			            }
					}
			   );
		   }
		}

		// Sets the boundaries of the map based on pin locations
		window.mapBounds = new google.maps.LatLngBounds();

		//pinPoster(Places) creates pins on the map for each location in
		// the Places array
		pinPoster(allPlaces);

	};
	/**
	 When list item clicked call this function
	 Look if lat and long of clicked item is equal to anyone in markers list
	**/
	self.focusMarker=function(venue){
		var lat=venue.placeList.location.lat;
		var lon=venue.placeList.location.lon;
		var venuPosition= new google.maps.LatLng(lat, lon)
		for (var i in Markers) {
		      if (Markers[i].position == venuPosition) {
		        google.maps.event.trigger(Markers[i], 'click');
		        map.panTo(Markers[i].position);
		      }
		}
	}

};
 // declares a global map variable
var map;    
ko.applyBindings(new ViewModel());
