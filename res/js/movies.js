// Stores the API key to be used for this section of the site
const API_KEY = "48180ed3f84ed2dc1ab61d9ab903405a";

// Stores the static value of amount of the show returned for each request to the API
const API_PER_PAGE = 20;

const MAX_PAGES = 100;

// Used as a dictionary for the movie" name to it index within the app
let movieNameQuery = {};

// Stores the data to be used to draw and display the shows
let movieData = [];

// Stores the amount of pages that have successfully been displayed to the user
let loadedPages = 0;

// Determines weather the app is ready to be used
let ready = false;

// The target of the currently played transition
let transitionTarget = null;

// Stores the show the user as selected
let selectedShow = undefined;

// The container that holds the DOM for the "movies"
let movieContainer = undefined;

// The container that holds the DOM for the selected "movie"
let pageContainer = undefined;

// The container that holds the DOM for the selected "movie" seasons
let seasonList = undefined;

// Holds all important elements on the selected "movie" page
let pageContent = undefined;

// Holds the DOM for the head of the site
let headDisplay = undefined;

// Pulls the previously saved show from local storage
if (Storage && localStorage["movie-data"]) {

    movieData = JSON.parse(localStorage["movie-data"]);

    // Sets up the dictionary of names to the index within the app
    for (let movieIndex = 0; movieIndex < movieData[0].length; ++movieIndex) {

        movieNameQuery[movieData[0][movieIndex].name.replace(/ |-/g, "").toLowerCase()] = movieIndex;
    }
}

$(function () {

    // Stores the lowest the user has scrolled
    let maxScrolled = 0;

    let previousHeight = 0;

    headDisplay = $("div[data-role='header']");

    headDisplay.find("*[data-role='none']").removeAttr("class");

    movieContainer = $("div[data-role='content'] > div.display.page");

    pageContainer = $("div[data-role='content'] > div.info.page");

    seasonList = $("div[data-role='content'] > .info.page > .info.list");

    // When a "movie" has been swiped on requesting more information
    movieContainer.on("transitionend", () => {

        if (transitionTarget == null) {

            return;
        }

        // Removes the animation from the container
        movieContainer.removeAttr("data-state");

        movieContainer.css("display", "none");
        pageContainer.css("display", "flex");

        transitionTarget = null;
    });

    // When the "movie" page has been swiped on requesting less information
    pageContainer.on("transitionend", () => {

        if (transitionTarget == null) {

            return;
        }

        // Removes the animation from the container
        pageContainer.removeAttr("date-state");

        movieContainer.css("display", "block");
        pageContainer.css("display", "none");

        transitionTarget = null;
    });

    // Sets up the chart that will be used to display the movie info
    pageContent = {

        canvas: new Chart($("div[data-role='content'] > .info.page .data.show")[0].getContext("2d"), {

            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Ranting",
                        fill: false,
                        data: []
                    }
                ]
            },
            options: {
                scales: {
                    xAxes: [
                        {
                            scaleLabel: {
                                display: true,
                                labelString: 'Seasons'
                            }
                        }
                    ]
                }
            }
        }),
        posterContainer: $("div[data-role='content'] > .info.page .holder.show"),
        poster: $("div[data-role='content'] > .info.page .holder.show img"),
        title: $("div[data-role='content'] .holder.general h2.title"),
        description: $("div[data-role='content'] .holder.general p.description")
    };

    // Allows modification of image data after it has been loaded from cross-origin
    pageContent.poster[0].crossOrigin = "Anonymous";

    // Assigns the color to be used for the line graph
    pageContent.poster.on("load", function () {

        let swatches = new Vibrant(pageContent.poster[0]).swatches();

        pageContent.canvas.data.datasets[0].backgroundColor = swatches.Vibrant.getHex();
        pageContent.canvas.data.datasets[0].borderColor = swatches.LightVibrant.getHex();

        pageContent.canvas.update();
    });

    // Toggles the display of the selected season data on the graph
    pageContent.posterContainer.on("click", function () {

        if (selectedShow.campared) {

            for (let seasonIndex = 0; seasonIndex < selectedShow.seasons.length; ++seasonIndex) {

                toggleSeasonGraph(seasonIndex, undefined, "");
            }
            return;
        }

        for (let seasonIndex = 0; seasonIndex < selectedShow.seasons.length; ++seasonIndex) {

            toggleSeasonGraph(seasonIndex, undefined, "selected");
        }
    });

    window.addEventListener("scroll", function () {

        if (!ready) {

            return;
        }

        // The percentage in which the user has scrolled
        let currentScroll = $(this).scrollTop() / movieContainer[0].scrollHeight;

        // Shows the scrolled header once the user has started scrolling
        if (currentScroll > 0.01) {

            headDisplay.attr("data-state", "scrolled");
        } else {

            headDisplay.removeAttr("data-state");
        }

        // Prevent data from being changed when the user scrolls up
        if (currentScroll <= maxScrolled && maxScrolled - currentScroll > 0) {

            return;
        }

        maxScrolled = currentScroll;

        // Prevents multiple page loads
        if (movieContainer[0].scrollHeight != previousHeight) {

            // Loads a new page to the user once they have scrolled 25% of the page
            if (maxScrolled >= loadedPages * 0.05) {

                if (/* TODO: For debugging purposes only */ loadedPages != 3 && loadedPages <= MAX_PAGES) {

                    loadPage(loadedPages + 1);
                }

                maxScrolled = 0;

                previousHeight = movieContainer[0].scrollHeight;
            }
        }
    });

    // Checks if the user has requested a specific movie
    requestPage();
});

$(window).on("swiperight", function (args) {

    if (selectedShow == null) {

        return;
    }

    transitionTarget = $(args.target).parent();

    window.location.hash = "";

    pageContainer.attr("date-state", "animate-right");
});

$(window).on("swipeleft", function (args) {

    if (selectedShow != null || $(window).width() > 600) {

        return;
    }

    transitionTarget = $(args.target).parent();

    window.location.hash = `#${transitionTarget.find(".title")[0].innerText.replace(/\([0-9]+\)/, "").trim().replace(/ +/g, "-")}`;

    movieContainer.attr("data-state", "animate-left");
});

addEventListener("unload", function () {

    if (Storage) {

        localStorage["movie-data"] = JSON.stringify(movieData);
    }
});

// Changes the page depending on the movie that was requested
window.addEventListener("hashchange", requestPage);

/**
 * Load a desired page asynchronously and writes the results to DOM
 *
 * @param page The desired page number to be loaded
 * @returns {Promise<void>} The object in which completes the request
 */
async function loadPage(page) {

    // Determines if the page has already been a loaded
    if (page <= loadedPages) {

        return;
    }

    let pageIndex = page - 1;

    /**
     * Writes entries for a desired page to the DOM
     *
     * @param pageIndex The desired index of the page in which would be loaded
     * @param data The data in which to be assigned at that index
     */
    const writePages = function (pageIndex, data) {

        if (data != undefined) {

            movieData[pageIndex] = data.results;
        }

        // Writes the given page index to the DOM
        writeHome(pageIndex);

        ++loadedPages;
    };

    if (movieData[pageIndex] != undefined) {

        if (movieContainer.children().children().length <= API_PER_PAGE * page) {

            // Writes the page to the DOM as long as the page has not been written already
            writePages(pageIndex);
        }
        return;
    }

    // Loads the data for the requested page
    $.ajax({

        url: `https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=${page}&timezone=America%2FNew_York&include_null_first_air_dates=false`,
        dataType: "JSON",
        success: data => writePages(pageIndex, data)
    });

}

/**
 * Writes the content of a desired page to the DOM
 *
 * @param index The index of the page that is to be loaded
 */
function writeHome(index) {

    // Tries to get the get a copy of the previously loaded page (simulate  server side caching)
    if (false && loadedPages <= 0 && localStorage["movie-display"] != undefined) {

        movieContainer.append(localStorage["movie-display"]);

        let moviesDisplay = $("div[data-role='content'] .image");

        // Adds all required events to each cached "movie"
        for (let movieIndex = 0; movieIndex < moviesDisplay.length; ++movieIndex) {

            moviesDisplay[movieIndex].addEventListener("click", (args) => {

                window.location.hash = `#${$(args.target.parentElement).find(".title")[0].innerText.replace(/\([0-9]+\)/, "").trim().replace(/ +/g, "-")}`;
            });
        }
    } else {

        // Determines the amount of "movies" to draw per row
        const PER_PAGE = [2, 3];

        // The total amount of "movies" written to the DOM
        let moviesDrawn = 0;

        // Loads the container for a row of "movies"
        let currentRow = $("<div class='ui-grid-a holder display'></div>");

        // Writes the container to the page "cache"
        if (localStorage["movie-display"] == undefined) {

            localStorage["movie-display"] = "<div class='ui-grid-a holder display'>";
        } else {

            localStorage["movie-display"] += "<div class='ui-grid-a holder display'>";
        }

        // The offset in in order to reference the movie by index
        const indexOffset = index * API_PER_PAGE;

        for (let movieIndex = 0; movieIndex < movieData[index].length; ++movieIndex) {

            ++moviesDrawn;

            // Stores the the index of the movie name
            movieNameQuery[`${movieData[index][movieIndex].name.replace(/ |-/g, "").toLowerCase()}`] = indexOffset + movieIndex;

            // creates the holder of the "movie"
            let movieBackDrop = $(`<div class='ui-grid-a image' ${movieData[index][movieIndex].backdrop_path == null
                ? "data-state='no-image'"
                : ""}></div>`);

            // Allows user to switch pages when the "movie" is clicked
            movieBackDrop.on("click", (args) => {

                window.location.hash = `#${$(args.target.parentElement).find(".title")[0].innerText.replace(/\([0-9]+\)/, "").trim().replace(/ +/g, "-")}`;
            });

            // Appends the need html to display the "movie"
            movieBackDrop.html(`<img ${movieData[index][movieIndex].backdrop_path == null
                ? ``
                : `src=\"https://image.tmdb.org/t/p/w500${movieData[index][movieIndex].backdrop_path}\"`}>
                                <h3 class=\"title\">
                                    ${movieData[index][movieIndex].name} (${movieData[index][movieIndex]
                .first_air_date.split("-")[0]})
                                </h3>`);

            // Adds the "movie" display to the current "cache" of the page
            localStorage["movie-display"] += `<div class='ui-grid-a image'>${movieBackDrop.html()}</div>`;

            // Appends the "movie" to the current row
            currentRow.append(movieBackDrop);

            // Determines if a new row is to be drawn
            if ((index != 0 || moviesDrawn <= PER_PAGE[0] ? moviesDrawn : moviesDrawn - PER_PAGE[0]) % (index == 0 && moviesDrawn <= PER_PAGE[0] ? PER_PAGE[0] : PER_PAGE[1]) == 0) {

                // Appends current row to the DOM
                movieContainer.append(currentRow);

                // Adds the end of the row the the "cache"
                localStorage["movie-display"] += "</div><div class='ui-grid-a holder display'>";

                // Creates a new row to be used
                currentRow = $("<div class='ui-grid-a holder display'></div>");
            }
        }

        // Writes the end of the page to the saved "cache"
        localStorage["movie-display"] += "</div>";
    }
}

/**
 * Request that a page for a specific "movie" be loaded from the current hash
 */

function requestPage() {

    if (window.location.hash == "") {

        // Preload the page if the transition is still being played
        if (transitionTarget == null || transitionTarget != null && $(window).width() > 600) {

            movieContainer.css("display", "block");
            pageContainer.css("display", "none");
        }

        selectedShow = null;

        if (loadedPages == 0) {

            // Loads the "movie" selection page asynchronously
            loadPage(1).finally(() => {

                ready = true;
            });
        }
        return;
    }

    // Gets the index of the movie using the dictionary to translate it
    let movieIndex = movieNameQuery[`${window.location.hash.split("#")[1].replace(/-/g, "").toLowerCase()}`];

    // Go to home page if movie was invalid
    if (movieIndex == undefined) {

        window.location.hash = "";
        return;
    }

    // Gets the index of where the data for the page lives
    let pageIndex = Math.floor(movieIndex / API_PER_PAGE);

    // Gets the show that the user requested
    let tmpShowCompare = movieData[pageIndex][movieIndex - (pageIndex * API_PER_PAGE)];

    // Preload the page if the transition is still being played
    if (transitionTarget == null || transitionTarget != null && $(window).width() > 600) {

        movieContainer.css("display", "none");
        pageContainer.css("display", "flex");
    }

    // Prevents page "reload" if already on the page
    if (tmpShowCompare == selectedShow) {

        return;
    }

    selectedShow = tmpShowCompare;

    // Cleans the previous "movie" page
    seasonList.html("");

    // Resets the graph
    pageContent.canvas.data.labels = [];
    pageContent.canvas.data.datasets[0].data = [];

    pageContent.posterContainer.removeAttr("data-state");

    selectedShow.compareCount = 0;

    /**
     * Writes the specified season to the DOM
     *
     * @param seasonIndex The desired season to be written
     * @returns {Promise<void>} The object in which fulfills the request
     */
    async function loadSubPage(seasonIndex) {

        let display = $(`<div class='episode'>
                                <div class='holder image'${selectedShow.seasons[seasonIndex].poster_path == null
            ? "data-state=\"no-image\""
            : ""}>
                                    <img ${selectedShow.seasons[seasonIndex].poster_path == null
            ? ``
            : `src=\"https://image.tmdb.org/t/p/w500${selectedShow.seasons[seasonIndex].poster_path}\"`}>
                                </div>
                                <div class='info title'>${selectedShow.seasons[seasonIndex].name}<span class='air date'>${selectedShow.seasons[seasonIndex].air_date}</span></div>
                            </div>`);

        // Allows the user to determine if the current season will appear on the graph
        display.on("click", async function () {

            let qDisplay = $(this);

            toggleSeasonGraph(qDisplay.find(".info.title").text().replace(/[0-9]{4}(-[0-9]{2}){2}/g, "").match(/[0-9]+/g)[0] - 1, qDisplay);
        });

        // Graph all previous selections
        toggleSeasonGraph(seasonIndex, display, selectedShow.campared || selectedShow.seasons[seasonIndex].active ? "selected" : "");

        seasonList.append(display);

        pageContent.poster.attr("src", `https://image.tmdb.org/t/p/w500${selectedShow.poster_path}`);
        pageContent.title.text(selectedShow.name);
        pageContent.description.text(selectedShow.overview);
    }

    // Determines if season has to be loaded from the api
    if (selectedShow.seasons != undefined) {

        // Writes each season to the DOM
        for (let seasonIndex = 0; seasonIndex < selectedShow.seasons.length; ++seasonIndex) {

            loadSubPage(seasonIndex);

            console.log("Loaded page from cache");
        }
    } else {

        /**
         * Recursively loads season until given an error
         */
        function loadSeason(id, season) {

            $.ajax({

                url: `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${API_KEY}&language=en-US`,
                dataType: "JSON",
                success: (data) => {

                    selectedShow.seasons.push(data);

                    // Loads the next season
                    loadSeason(id, season + 1);

                    // Draw the season to the DOM
                    loadSubPage(season - 1);
                }
            });
        };

        selectedShow.seasons = [];

        // Start Recursively loading seasons
        loadSeason(selectedShow.id, 1);
    }
}

/**
 * Toggles the visibility of season data on the graph
 *
 * @param seasonIndex The desired season
 * @param [qDisplay] The container of the season, if not present it is pulled from the DOM
 * @param [state] The state in which to force the element
 */
function toggleSeasonGraph(seasonIndex, qDisplay, state) {

    // Pulls the container for the season if not given
    qDisplay = qDisplay == undefined ? $(seasonList.find(".episode")[seasonIndex]) : qDisplay;

    // Displays the season on the graph
    if (state == "selected" || (state == undefined && !selectedShow.seasons[seasonIndex].active)) {

        if (state == undefined && selectedShow.seasons[seasonIndex].active) {

            return;
        }

        qDisplay.attr("data-state", "selected");

        selectedShow.seasons[seasonIndex].active = true;

        // Caculat vot average for the season if not already calculated
        if (selectedShow.seasons[seasonIndex].vote_average == undefined) {

            selectedShow.seasons[seasonIndex].vote_average = 0;

            for (let episodeIndex = 0; episodeIndex < selectedShow.seasons[seasonIndex].episodes.length; ++episodeIndex) {

                selectedShow.seasons[seasonIndex].vote_average += selectedShow.seasons[seasonIndex].episodes[episodeIndex].vote_average;
            }
        }

        let insertIndex = 0;

        // find the position in which to insert the graph data
        for (let labelIndex = 0; labelIndex < pageContent.canvas.data.labels.length; ++labelIndex) {

            if (seasonIndex > pageContent.canvas.data.labels[labelIndex] - 1) {

                insertIndex = labelIndex + 1;
            }
        }

        // Check if graph data is already present
        if (seasonIndex + 1 != pageContent.canvas.data.labels[insertIndex]) {

            pageContent.canvas.data.labels.splice(insertIndex, 0, seasonIndex + 1);
            pageContent.canvas.data.datasets[0].data.splice(insertIndex, 0, selectedShow.seasons[seasonIndex].vote_average);
            ++selectedShow.compareCount;
        }

        // Selects "compare all" if all seasons are selected
        if (selectedShow.compareCount >= selectedShow.seasons.length) {

            pageContent.posterContainer.attr("data-state", "selected");
            selectedShow.campared = true;
        }
    } else {

        if (state == undefined && !selectedShow.seasons[seasonIndex].active) {

            return;
        }

        qDisplay.removeAttr("data-state");

        selectedShow.seasons[seasonIndex].active = false;

        if (pageContent.canvas.data.labels == undefined) {

            return;
        }

        // Find the position in which to delete the graph data
        for (let labelIndex = 0; labelIndex < pageContent.canvas.data.labels.length; ++labelIndex) {

            if (pageContent.canvas.data.labels[labelIndex] == seasonIndex + 1) {

                pageContent.canvas.data.labels.splice(labelIndex, 1);
                pageContent.canvas.data.datasets[0].data.splice(labelIndex, 1);
                --selectedShow.compareCount;

                break;
            }
        }

        // Deselects "compare all" if not all seasons are selected
        if (selectedShow.compareCount == selectedShow.seasons.length - 1) {

            pageContent.posterContainer.removeAttr("data-state");
            selectedShow.campared = false;
        }
    }

    pageContent.canvas.update();

}
