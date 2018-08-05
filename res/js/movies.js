/*!(function() {*/
const API_PER_PAGE = 20;

let movieData = [];

let movieContainer = undefined;

let pageContainer = undefined;

let seasonList = undefined;

let pageContent = undefined;

let headDisplay = undefined;

let movieNameQuery = {};

let loadedPages = 0;

let ready = false;

let selectedShow = undefined;

if (localStorage["movie-data"] && Storage) {

    movieData = JSON.parse(localStorage["movie-data"]);

    for (let movieIndex = 0; movieIndex < movieData[0].length; ++movieIndex) {

        movieNameQuery[movieData[0][movieIndex].name.replace(/ |-/g, "").toLowerCase()] = movieIndex;
    }
}

$(function () {

    let maxScrolled = 0;

    let previousHeight = 0;

    headDisplay = $("div[data-role='header']");

    headDisplay.find("*[data-role='none']").removeAttr("class");

    movieContainer = $("div[data-role='content'] > div.display.page");

    pageContainer = $("div[data-role='content'] > div.info.page");

    seasonList = $("div[data-role='content'] > .info.page > .info.list");

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
            }
        }),
        posterContainer: $("div[data-role='content'] > .info.page .holder.show"),
        poster: $("div[data-role='content'] > .info.page .holder.show img"),
        title: $("div[data-role='content'] .holder.general h2.title"),
        description: $("div[data-role='content'] .holder.general p.description")
    };

    pageContent.poster[0].crossOrigin = "Anonymous";

    pageContent.poster.on("load", function () {

        let swatches = new Vibrant(pageContent.poster[0]).swatches();

        pageContent.canvas.data.datasets[0].backgroundColor = swatches.Vibrant.getHex();
        pageContent.canvas.data.datasets[0].borderColor = swatches.Muted.getHex();

        pageContent.canvas.update();
    });

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

    loadPage(1).finally(() => {

        ready = true;
    });

    window.addEventListener("scroll", function () {

        if (!ready) {

            return;
        }

        let currentScroll = $(this).scrollTop() / movieContainer[0].scrollHeight;

        if (currentScroll > 0.01) {

            headDisplay[0].setAttribute("style", "background-color: rgba(33, 33, 33, 0.75) !important");
        } else {


            headDisplay[0].removeAttribute("style");
        }


        if (currentScroll <= maxScrolled && maxScrolled - currentScroll > 0) {

            return;
        }

        maxScrolled = currentScroll;

        if (movieContainer[0].scrollHeight != previousHeight) {

            if (maxScrolled >= 0.25) {

                if (loadedPages != 3) {

                    setTimeout(() => {
                        loadPage(loadedPages + 1)
                    }, 0, true);
                }

                maxScrolled = 0;

                previousHeight = movieContainer[0].scrollHeight;
            }
        }
    });

    requestPage();
});

window.addEventListener("unload", function () {

    if (Storage) {

        localStorage["movie-data"] = JSON.stringify(movieData);
    }
});

window.addEventListener("hashchange", requestPage);

async function loadPage(page) {

    if (page <= loadedPages) {

        return;
    }

    let pageIndex = page - 1;

    if (movieData[pageIndex] != undefined) {

        if (movieContainer.children().children().length <= API_PER_PAGE * page) {

            writeHome(pageIndex);

            ++loadedPages;
        }
        return;
    }

    $.ajax({

        url: `https://api.themoviedb.org/3/discover/tv?api_key=48180ed3f84ed2dc1ab61d9ab903405a&language=en-US&sort_by=popularity.desc&page=${page}&timezone=America%2FNew_York&include_null_first_air_dates=false`,
        dataType: "JSON",
        success: data => {

            movieData[pageIndex] = data.results;

            writeHome(pageIndex);

            ++loadedPages;
        }
    });

}

function writeHome(index) {

    if (false && loadedPages <= 0 && localStorage["movie-display"] != undefined) {

        movieContainer.append(localStorage["movie-display"]);

        let moviesDisplay = $("div[data-role='content'] .image");

        for (let movieIndex = 0; movieIndex < moviesDisplay.length; ++movieIndex) {

            moviesDisplay[movieIndex].addEventListener("click", switchPage);
        }
    } else {

        let pageRequest = window.location.hash.split("#")[1];

        if (pageRequest != undefined) {

            switchPage(0);
        }

        const PER_PAGE = [2, 3];

        let moviesDrawn = 0;

        let currentRow = $("<div class='ui-grid-a holder display'></div>");


        if (localStorage["movie-display"] == undefined) {

            localStorage["movie-display"] = "<div class='ui-grid-a holder display'>";
        } else {

            localStorage["movie-display"] += "<div class='ui-grid-a holder display'>";
        }

        const indexOffset = index * API_PER_PAGE;

        for (let movieIndex = 0; movieIndex < movieData[index].length; ++movieIndex) {

            movieNameQuery[`${movieData[index][movieIndex].name.replace(/ |-/g, "").toLowerCase()}`] = indexOffset + movieIndex;

            ++moviesDrawn;

            let movieBackDrop = $(`<div class='ui-grid-a image'></div>`);

            movieBackDrop.on("click", switchPage);

            movieBackDrop.html(`<img src=\"https://image.tmdb.org/t/p/w500${movieData[index][movieIndex].backdrop_path}\"><h3 class=\"title\">${movieData[index][movieIndex].name} (${movieData[index][movieIndex].first_air_date.split("-")[0]})</h3>`);

            localStorage["movie-display"] += `<div class='ui-grid-a image'>${movieBackDrop.html()}</div>`;

            currentRow.append(movieBackDrop);

            if ((index != 0 || moviesDrawn <= PER_PAGE[0] ? moviesDrawn : moviesDrawn - PER_PAGE[0]) % (index == 0 && moviesDrawn <= PER_PAGE[0] ? PER_PAGE[0] : PER_PAGE[1]) == 0) {

                movieContainer.append(currentRow);

                localStorage["movie-display"] += "</div><div class='ui-grid-a holder display'>";

                currentRow = $("<div class='ui-grid-a holder display'></div>");
            }
        }

        localStorage["movie-display"] += "</div>";
    }
}

function switchPage() {

    window.location.hash = `#${$(this).find(".title")[0].innerText.replace(/\([0-9]+\)/, "").trim().replace(/ +/g, "-")}`;
}

function requestPage() {

    if (window.location.hash == "") {

        movieContainer.css("display", "block");
        pageContainer.css("display", "none");

        if (loadedPages == 0) {

            loadPage(1);
        }
        return;
    }

    let movieIndex = movieNameQuery[`${window.location.hash.split("#")[1].replace(/-/g, "").toLowerCase()}`];

    if (movieIndex == undefined) {

        window.location.hash = "";
        return;
    }

    movieContainer.css("display", "none");
    pageContainer.css("display", "flex");

    let pageIndex = Math.floor(eval(`${movieIndex} / ${API_PER_PAGE}`));

    let tmpShowCompare = movieData[pageIndex][movieIndex - (pageIndex * API_PER_PAGE)];

    if (tmpShowCompare == selectedShow) {

        return;
    }

    selectedShow = tmpShowCompare;

    seasonList.html("");

    pageContent.canvas.data.labels = [];
    pageContent.canvas.data.datasets[0].data = [];
    pageContent.posterContainer.removeAttr("data-state");

    selectedShow.compareCount = 0;

    async function loadSubPage(seasonIndex) {

        if (selectedShow.seasons[seasonIndex].poster_path != null) {

            let display = $(`<div class='episode'>
                                <div class='holder image'>
                                    <img src='https://image.tmdb.org/t/p/w500${selectedShow.seasons[seasonIndex].poster_path}' />
                                </div>
                                <div class='info title'>${selectedShow.seasons[seasonIndex].name}<span class='air date'>${selectedShow.seasons[seasonIndex].air_date}</span></div>
                            </div>`);

            display.on("click", async function () {

                let qDisplay = $(this);

                toggleSeasonGraph(qDisplay.find(".info.title").text().replace(/[0-9]{4}(-[0-9]{2}){2}/g, "").match(/[0-9]+/g)[0] - 1, qDisplay);
            });

            toggleSeasonGraph(seasonIndex, display, selectedShow.campared ? "selected" : "");

            seasonList.append(display);
        }

        pageContent.poster.attr("src", `https://image.tmdb.org/t/p/w500${selectedShow.poster_path}`);
        pageContent.title.text(selectedShow.name);
        pageContent.description.text(selectedShow.overview);
    }

    if (selectedShow.seasons != undefined) {

        for (let seasonIndex = 0; seasonIndex < selectedShow.seasons.length; ++seasonIndex) {

            loadSubPage(seasonIndex);
        }
    } else {

        const loadSeason = (id, season) => {

            $.ajax({

                url: `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=48180ed3f84ed2dc1ab61d9ab903405a&language=en-US`,
                dataType: "JSON",
                success: (data) => {

                    selectedShow.seasons.push(data);

                    loadSeason(id, season + 1);
                    loadSubPage(season - 1);
                }
            });
        };

        selectedShow.seasons = [];

        loadSeason(selectedShow.id, 1);
    }
}

function toggleSeasonGraph(seasonIndex, qDisplay, state) {

    qDisplay = qDisplay == undefined ? $(seasonList.find(".episode")[seasonIndex]) : qDisplay;

    if (state == "selected" || (state == undefined && !selectedShow.seasons[seasonIndex].active)) {

        if (state == undefined && selectedShow.seasons[seasonIndex].active) {

            return;
        }

        qDisplay.attr("data-state", "selected");

        selectedShow.seasons[seasonIndex].active = true;

        ++selectedShow.compareCount;

        if (selectedShow.seasons[seasonIndex].vote_average == undefined) {

            selectedShow.seasons[seasonIndex].vote_average = 0;
            for (let episodeIndex = 0; episodeIndex < selectedShow.seasons[seasonIndex].episodes.length; ++episodeIndex) {

                selectedShow.seasons[seasonIndex].vote_average += selectedShow.seasons[seasonIndex].episodes[episodeIndex].vote_average;
            }
        }

        let insertIndex = 0;

        for (let labelIndex = 0; labelIndex < pageContent.canvas.data.labels.length; ++labelIndex) {

            if (seasonIndex > pageContent.canvas.data.labels[labelIndex].match(/[0-9]+/g)[0] - 1) {

                insertIndex = labelIndex + 1;
            }
        }

        pageContent.canvas.data.datasets[0].data.splice(insertIndex, 0, selectedShow.seasons[seasonIndex].vote_average);
        pageContent.canvas.data.labels.splice(insertIndex, 0, selectedShow.seasons[seasonIndex].name);

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

        if (selectedShow.compareCount > 0) {

            --selectedShow.compareCount;
        }

        if (pageContent.canvas.data.labels == undefined) {

            return;
        }

        for (let labelIndex = 0; labelIndex < pageContent.canvas.data.labels.length; ++labelIndex) {

            if (pageContent.canvas.data.labels[labelIndex] == selectedShow.seasons[seasonIndex].name) {

                pageContent.canvas.data.labels.splice(labelIndex, 1);
                pageContent.canvas.data.datasets[0].data.splice(labelIndex, 1);

                break;
            }
        }

        if (selectedShow.compareCount == selectedShow.seasons.length - 1) {

            pageContent.posterContainer.removeAttr("data-state");
            selectedShow.campared = false;
        }
    }

    pageContent.canvas.update();

}

/*})();*/
