function intiMap() { } // global declaration because google maps js script looks for initMap() before document is ready


$(document).ready(function () {
    // Add an action for handling page swipes
    // console.log('hello', $.mobile.defaultTransitionHandler('slide') );
    $("body").on("swipeleft swiperight", function (e) {
        // Grab the current page id and swipe direction
        var curPage = $.mobile.activePage[0].id;
        var direction = e.type.replace('swipe', '');
        console.log();
        console.log(curPage, direction);
        console.log();

        // Check if the page is on home and is swiping left
        if (curPage == "weather" && direction == "left") {
            // Change the page to page 2
            $.mobile.navigate("#compare");
            $('#searchbar1').val($('#searchbar').val());
        }
        if (curPage == 'compare' && direction == 'right') {
            $.mobile.navigate('#weather');
        }
    });
    // geolocation
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((location) => {
            console.log(location);
            // $('searchbar').text(location.city.coord.name+', '+location.city.coord.country);
            loadWeather(location.coords.latitude, location.coords.longitude);
        });
    }

    function updateColors() {
        $('#bd, #header').css('color', 'white');
    }

    var lat;
    var long;
    // writing the actul function
    initMap = function () {
        updateColors();
        var autocomplete = new google.maps.places.Autocomplete(document.getElementById('searchbar'));
        google.maps.event.addListener(autocomplete, 'place_changed', () => {
            lat = autocomplete.getPlace().geometry.location.lat();
            long = autocomplete.getPlace().geometry.location.lng();
            loadWeather(lat, long);
        });
    }

    var weatherImagesIcons = {
        'clouds': ['cloud.png', 'few_clouds.png'],
        'extreme': ['clear.png', 'clear.png'],
        'clear sky': ['clear.png', 'clear.png'],
        'few clouds': ['cloud.png', 'few_clouds.png'],
        'scattered clouds': ['cloud.png', 'few_clouds.png'],
        'overcast clouds': ['cloud.png', 'few_clouds.png'],
        'broken clouds': ['cloud.png', 'few_clouds.png'],
        'shower rain': ['rain.png', 'rain.png'],
        'light rain': ['rain.png', 'rain.png'],
        'rain': ['rain.png', 'rain.png'],
        'thunderstorm': ['rain.png', 'storm.png'],
        'snow': ['snow.png', 'snow.png'],
        'mist': ['cloud.png', 'mist.png']
    }

    function loadWeather(lat, long) {
        $.getJSON('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + long + '&appid=337f84fa35fa79d1a7e6bdfa3a1003ac&units=metric', {}, function (data) {
            console.log(data);
            if ($('#searchbar').val() == '') {
                $('#searchbar').val(data.name + ', ' + data.sys.country);
            }

            $('#weatherin').text($('#searchbar').val());

            var description = data['weather'][0]['description'].toString();
            $('#description').text(description[0].toUpperCase() + description.slice(1));
            $('#temp').text(data['main']['temp']);
            var iconid = data['weather'][0]['icon'];
            var img = document.createElement('img');

            if (iconid[iconid.length - 1] == 'd') {
                try {
                    $('#weather').css('background-image', 'url("./images/backgrounds/day/' + weatherImagesIcons[data['weather'][0]['description']][0] + '")');
                    $('#icon').attr('src', './images/icons/day/' + weatherImagesIcons[data['weather'][0]['description']][1]);
                    img.setAttribute('src', "./images/backgrounds/day/" + weatherImagesIcons[data['weather'][0]['description']][0]);
                } catch (e) {
                    $('#weather').css('background-image', 'url("./images/backgrounds/day/clear.png")');
                    $('#icon').attr('src', './images/icons/day/clear.png');
                    img.setAttribute('src', "./images/backgrounds/day/clear.png");
                }
            } else {
                try {
                    $('#weather').css('background-image', 'url("./images/backgrounds/night/' + weatherImagesIcons[data['weather'][0]['description']][0] + '")');
                    $('#icon').attr('src', './images/icons/night/' + weatherImagesIcons[data['weather'][0]['description']][1]);
                    img.setAttribute('src', "./images/backgrounds/night/" + weatherImagesIcons[data['weather'][0]['description']][0]);
                } catch (e) {
                    $('#weather').css('background-image', 'url("./images/backgrounds/night/clear.png")');
                    $('#icon').attr('src', './images/icons/night/clear.png');
                    img.setAttribute('src', "./images/backgrounds/day/clear.png");
                }
            }

            img.addEventListener('load', function () {
                var vibrant = new Vibrant(img);
                var swatches = vibrant.swatches();
                console.log(swatches);
                // $('#chart').css('background-color', swatches['Vibrant'].getHex());
                $('#header').css('background-color', swatches['Vibrant'].getHex());
                $('#compare').css('background-color', swatches['Vibrant'].getHex());
                $('#cheader').css('background-color', swatches['Vibrant'].getHex());
            });
            loadChart(lat, long);
        });
    }

    function loadChart(lat, long) {
        // $('#chart').css('background-color', 'white')
        $.getJSON('http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + long + '&appid=337f84fa35fa79d1a7e6bdfa3a1003ac&units=metric', {}, function (data) {
            console.log(data);
            var wholedata = data.list;
            var fivedaydata = [];
            var comingweek = [];
            for (i = 4; i < data.cnt; i += 8) {
                // console.lof(i)
                console.log(data.list[i].main.temp)
                fivedaydata.push(data.list[i].main.temp);
            }

            var ctx = document.getElementById('weatherchart').getContext('2d');
            var chart = new Chart(ctx, {
                type: 'line',
                defaultFontColor: 'green',
                data: {
                    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    datasets: [
                        {
                            label: 'Temperature',
                            data: fivedaydata,
                            borderColor: 'red',
                            fill: false
                        }]
                },
                options: {
                    scales: {
                        xAxes: {
                            gridLines: {
                                gridColor: '#fff'
                            }
                        },
                        yAxes: {
                            gridLines: {
                                gridColor: '#fff'
                            }
                        }
                    }
                }
            });
        });
    }


});