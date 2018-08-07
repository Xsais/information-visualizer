/**
 * File: weather.js
 * Assignment: Final Project
 * Creation date: August 1, 2018
 * Last Modified: August 6, 2018
 * Description: Handles display and graphing of weather data
 *
 * GitHub Link: https://github.com/Xsais/information-visualizer/blob/master/res/js/weather.js
 *
 * Group Members:
 *    - James Grau
 *    - Bhavay Grover
 *    - Nathaniel PrimoS
 */

function intiMap() { } // global declaration because google maps js script looks for initMap() before document is ready
function loadExtraInfo() { }

$(document).ready(function () {
    
    loadWeather(43.47, -79.69); // default : oakville
    
    // Add an action for handling page swipes
    $("body").on("swipeleft swiperight", function (e) {
        // Grab the current page id and swipe direction
        var curPage = $.mobile.activePage[0].id;
        var direction = e.type.replace('swipe', '');

        // Check if the page is on home and is swiping left
        if (curPage == "weather" && direction == "left") {
            // Change the page to page 2
            $.mobile.navigate("#compare");
        }
        if (curPage == 'compare' && direction == 'right') {
            $.mobile.navigate('#weather');
        }
    });

    // geolocation
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((location) => {
            loadWeather(location.coords.latitude, location.coords.longitude);  
            
        });
    }else{
        // loads oakville by default
    }

    function updateColors() {
        $('#bd, #header').css('color', 'white');
    }

    var lat;
    var long;
    var s1loc;
    var s2loc;
    var s3loc;

    initMap = function () {
        updateColors();

        var autocomplete = new google.maps.places.Autocomplete(document.getElementById('searchbar'));
        google.maps.event.addListener(autocomplete, 'place_changed', () => {
            lat = autocomplete.getPlace().geometry.location.lat();
            long = autocomplete.getPlace().geometry.location.lng();
            loadWeather(lat, long);
        });

        var s1autocomplete = new google.maps.places.Autocomplete(document.getElementById('searchbar1'));
        google.maps.event.addListener(s1autocomplete, 'place_changed', () => {
            lat = s1autocomplete.getPlace().geometry.location.lat();
            long = s1autocomplete.getPlace().geometry.location.lng();
            s1loc = { lat, long };
            compareNow();
        });

        var s2autocomplete = new google.maps.places.Autocomplete(document.getElementById('searchbar2'));
        google.maps.event.addListener(s2autocomplete, 'place_changed', () => {
            lat = s2autocomplete.getPlace().geometry.location.lat();
            long = s2autocomplete.getPlace().geometry.location.lng();
            s2loc = { lat, long };
            compareNow();
        });

        var s3autocomplete = new google.maps.places.Autocomplete(document.getElementById('searchbar3'));
        google.maps.event.addListener(s3autocomplete, 'place_changed', () => {
            lat = s3autocomplete.getPlace().geometry.location.lat();
            long = s3autocomplete.getPlace().geometry.location.lng();
            s3loc = { lat, long };
            compareNow();
        });
    }

    function compareNow() {
        var ar = [s1loc, s2loc, s3loc];
        var i = 0;
        ['searchbar1', 'searchbar2', 'searchbar3'].forEach((item) => {
            if ($('#' + item).val() == '') {
                ar[i] = null;
            }
            i++;
        });
        var available = ar.filter((item) => {
            if (item != null) {
                return item;
            }
        });
        loadCompareChart(available);
    }
    $('#compareNow').click(compareNow);

    var weatherImagesIcons = {
        '01': ['clear.png', 'clear.png'],
        '02': ['cloud.png', 'few_clouds.png'],
        '03': ['cloud.png', 'few_clouds.png'],
        '04': ['cloud.png', 'few_clouds.png'],
        '09': ['rain.png', 'rain.png'],
        '10': ['rain.png', 'rain.png'],
        '11': ['rain.png', 'storm.png'],
        '13': ['snow.png', 'snow.png'],
        '50': ['cloud.png', 'mist.png']
    }

    function loadWeather(lat, long) {
        $.getJSON('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + long + '&appid=337f84fa35fa79d1a7e6bdfa3a1003ac&units=metric', {}, function (data) {
            if ($('#searchbar').val() == '') {
                $('#searchbar').val(data.name + ', ' + data.sys.country);
            }

            $('#weatherin').text($('#searchbar').val());

            var description = data['weather'][0]['description'].toString();
            $('#description').text(description[0].toUpperCase() + description.slice(1));
            $('#temp').text(data['main']['temp']);
            var iconid = data['weather'][0]['icon'];
            var iconindex = iconid.substring(0, 2);
            var img = document.createElement('img');

            if (iconid[iconid.length - 1] == 'd') {
                try {
                    $('#weather').css('background-image', 'url("../res/images/backgrounds/day/' + weatherImagesIcons[iconindex][0] + '")');
                    $('#icon').attr('src', '../res/images/icons/day/' + weatherImagesIcons[iconindex][1]);
                    img.setAttribute('src', "../res/images/backgrounds/day/" + weatherImagesIcons[iconindex][0]);
                } catch (e) {
                    $('#weather').css('background-image', 'url("../res/images/backgrounds/day/clear.png")');
                    $('#icon').attr('src', '../res/images/icons/day/clear.png');
                    img.setAttribute('src', "../res/images/backgrounds/day/clear.png");
                }
            } else {
                try {
                    $('#weather').css('background-image', 'url("../res/images/backgrounds/night/' + weatherImagesIcons[iconindex][0] + '")');
                    $('#icon').attr('src', '../res/images/icons/night/' + weatherImagesIcons[iconindex][1]);
                    img.setAttribute('src', "../res/images/backgrounds/night/" + weatherImagesIcons[iconindex][0]);
                } catch (e) {
                    $('#weather').css('background-image', 'url("../res/images/backgrounds/night/clear.png")');
                    $('#icon').attr('src', '../res/images/icons/night/clear.png');
                    img.setAttribute('src', "../res/images/backgrounds/day/clear.png");
                }
            }

            var extrainfo = [data.clouds.all, data.main.humidity, data.wind.speed, data.main.pressure, data.sys.sunrise, data.sys.sunset];
            $('#clouds').text(extrainfo[0] + '%');
            $('#humidity').text(extrainfo[1] + '%');
            $('#wind').text('Speed - ' + extrainfo[2]);
            $('#pressure').text(extrainfo[3] + 'hpa');
            $('#sunrise').text(new Date(extrainfo[4]).toTimeString().slice(0, 5));
            $('#sunset').text(new Date(extrainfo[5]).toTimeString().slice(0, 5));

            img.addEventListener('load', function () {
                var vibrant = new Vibrant(img);
                var swatches = vibrant.swatches();
                // $('#chart').css('background-color', swatches['Vibrant'].getHex());
                $('#header').css('background-color', swatches['Vibrant'].getHex());
                $('#extrainfo').css('color', swatches['DarkVibrant'].getHex());
                // $('tr:nth-child(even)').css('background-color', swatches['LightVibrant'].getHex())
                $('#compare').css('background-color', swatches['Vibrant'].getHex());
                $('#cheader').css('background-color', swatches['Vibrant'].getHex());
                $('.extracompareinfo').css('color', swatches['DarkVibrant'].getHex());
                window.swatchcolor = swatches['DarkVibrant'].getHex();
            });
            loadChart(lat, long);
        });
    }

    function nextFiveDays() {
        var ar = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        var today = new Date().getDay();
        var nextDays = [];
        for (i = today + 1; i <= 7; i++) {
            nextDays.push(ar[i - 1]);
        }
        for (j = 1; j < today; j++) {
            nextDays.push(ar[j - 1]);
        }
        nextDays.length = 5;
        return nextDays;
    }
    function loadChart(lat, long) {
        // $('#chart').css('background-color', 'white')
        $.getJSON('http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + long + '&appid=337f84fa35fa79d1a7e6bdfa3a1003ac&units=metric', {}, function (data) {
            console.log(data);
            if(data)
            var wholedata = data.list;
            var fivedaydata = [];
            var raindata = [];
            var comingweek = [];
            for (i = 4; i < data.cnt; i += 8) {
                fivedaydata.push(data.list[i].main.temp);
                // console.log(data.list[i].rain);
                try{
                    raindata.push(data.list[i].rain['3h'] || 0);
                }catch(e){
                    raindata.push(0);
                }
                // if (!data.list[i].rain['3h']){
                //     raindata.push(0);
                // }
                // else{
                    
                // }
            }
            console.log('RAIN', raindata);

            var ctx = document.getElementById('weatherchart').getContext('2d');
            var chart = new Chart(ctx, {
                type: 'bar',
                defaultFontColor: 'green',
                data: {
                    labels: nextFiveDays(),
                    datasets: [
                        {
                            label: 'Temperature',
                            yAxisID: 'tempY',
                            data: fivedaydata,
                            borderColor: $('#extrainfo').css('color'),
                            fill: false,
                            type: 'line'
                        },
                        {
                            label: 'Temperature',
                            yAxisID: 'rainY',
                            data: raindata,
                            borderColor: $('#extrainfo').css('color'),
                            fill: false,
                            type: 'bar'
                        },
                    ]
                },
                options: {
                    tooltips: {
                        callbacks: {
                            label: (item) => { return (item.datasetIndex == 0) ? item.yLabel + '°C' : item.yLabel + ' mm' },
                        },
                    },
                    scales: {
                        xAxes: {
                            gridLines: {
                                gridColor: '#fff'
                            }
                        },
                        yAxes: [{
                            id: 'tempY',
                            position: 'left',
                            ticks: {
                                callback: function (value, index, values) {
                                    return value + '°C';
                                }
                            }
                        },
                        {
                            id: 'rainY',
                            position: 'right',
                            ticks: {
                                callback: function (value, index, values) {
                                    return value+' mm';
                                }
                            }
                    },]
                    }
                }
            });
        });
    }


    function loadCompareChart(data_ar) {
        $('#cchart').css('display', 'block');
        var dataset = [];
        var linecolors = ['red', 'green', 'blue'];
        var ctx = document.getElementById('comparechart').getContext('2d');
        var chart = new Chart(ctx, {
            type: 'line',
            defaultFontColor: 'green',
            data: {
                labels: nextFiveDays(),
                datasets: []
            }
        });
        var colorindex = 0;
        data_ar.forEach((item) => {
            $.getJSON('http://api.openweathermap.org/data/2.5/forecast?lat=' + item.lat + '&lon=' + item.long + '&appid=337f84fa35fa79d1a7e6bdfa3a1003ac&units=metric', {}, function (data) {
                var fivedaydata = [];
                var comingweek = [];
                for (i = 4; i < data.cnt; i += 8) {
                    fivedaydata.push(data.list[i].main.temp);
                }
                chart.data.datasets.push({
                    label: data.city.name,
                    data: fivedaydata,
                    borderColor: linecolors[colorindex],
                    fill: false
                });
                chart.update();
                colorindex++;
            });
        });

        loadCompareData(data_ar);
    }

    function loadCompareData(cdata) {
        var divlocs = [16, 30, 30];
        var index = 0;
        cdata.forEach((item) => {
            $('#multipleresults').text('');
            $.getJSON('http://api.openweathermap.org/data/2.5/weather?lat=' + item.lat + '&lon=' + item.long + '&appid=337f84fa35fa79d1a7e6bdfa3a1003ac&units=metric', {}, function (data) {
                var description = data['weather'][0]['description'].toString();
                var iconid = data['weather'][0]['icon'];
                var iconindex = iconid.substring(0, 2);
                var icon;
                if (iconid[iconid.length - 1] == 'd') {
                    try {
                        icon = '../res/images/icons/day/' + weatherImagesIcons[iconindex][1];
                    } catch (e) {
                        icon = '../res/images/icons/day/clear.png';
                    }
                } else {
                    try {
                        icon = '../res/images/icons/night/' + weatherImagesIcons[iconindex][1];
                    } catch (e) {
                        icon = '../res/images/icons/night/clear.png';
                    }
                }
                var resultdiv = "<div onClick='loadExtraInfo(" + JSON.stringify(data) + ", " + index + ");' style='padding-top: " + divlocs[index] + "px; padding-right: 16px; padding-left: 16px;' id='c" + index + "'>" +
                    "<span style='display: block; font-size: 20px;'>Weather in " + ((data.name == '' || data.name == undefined) ? $('#searchbar' + (index + 1)).val(): data.name)+ "</span>" +
                    "<img id = 'ci1' src= " + icon + " width = '90' height = '90' style = 'float: left; padding-top:10px;' />" +
                    "<div style='float: right; text-align: right;'>" +
                    "<span style='display: block; padding-top:10px; font-size: 20px;' id='description'>" + description[0].toUpperCase() + description.slice(1) + "</span>" +
                    "<span style='font-size: 40px;'>" +
                    "<span id='temp'>" + data['main']['temp'] + "</span>" +
                    "<sup id='extra' style='font-size: 20px;'>°C</sup>" +
                    "</span>" +
                    "</div>" +
                    "<table style='padding: 10px, 0; background-color: rgba(255, 255, 255, 0.1);' class='extracompareinfo' id='extracompareinfo" + index + "'>" +
                    "<tr><td>Clouds</td><td>" + data.clouds.all + "%</td></tr>" +
                    "<tr><td>Humidity</td><td>" + data.main.humidity + "%</td></tr>" +
                    "<tr><td>Wind</td><td>Speed - " + data.wind.speed + "</td></tr>" +
                    "<tr><td>Pressure</td><td>" + data.main.temp + "hph</td></tr>" +
                    "<tr><td>Sunrise</td><td>" + new Date(data.sys.sunrise).toTimeString().slice(0, 5) + "</td>" +
                    "</tr><tr><td>Sunset</td><td>" + new Date(data.sys.sunset).toTimeString().slice(0, 5) + "</td></tr>" +
                    "</table>" +
                    "</div>";
                $(resultdiv).appendTo('#multipleresults');
                $('#extracompareinfo' + index).css('color', window.swatchcolor);
                index++;
            });

        });

    }

    loadExtraInfo = function (data, index) {
        // does nothing for now
    }

});