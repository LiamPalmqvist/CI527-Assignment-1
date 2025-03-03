baseHTML = "";
state = {
    query: "",
    media_type: "",
    year_start: "",
    tags: [],
    data: {}
};
base = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);

/**
 * Event listener for the load event. Loads the search results if the query exists.
 * @param       {Event} event
 * @returns     {void}
 */
window.addEventListener("load", function () {
	// Get the base and query from the URL
    const url = window.location.href;
    const query = url.substring(url.lastIndexOf("/") + 1);

    baseHTML = document.querySelector(".results").innerHTML;
    
    // Check if the query exists and load the associated search results
    if (query) {
        // Split the query into the search query and the media type
        const split = query.split("?");
        if (split[1] !== "") {
            let searchParams = new URLSearchParams();
            
            // Split the search query into the search parameters
            for (let param of split[1].split("&")) {
                let p = param.split("=");
                searchParams.append(p[0], decodeURIComponent(p[1]));
            }
    
            // Submit the request
            document.getElementById("search").value = searchParams.get("q");
            URLsearch(searchParams, "GET");
        }
    }
    
    // Add event listener to the search form
    document.getElementById("form").addEventListener("submit", search);
});

/**
 * Event listener for the popstate event. Displays the search form if the state exists.
 * @param       {Event} event
 * @returns     {void}
 */
window.addEventListener("popstate", function (event) {
    // if the state exists, display the search form
    if (event.state) {
        state = event.state.query;

        // Make sure the data is not empty, if empty, submit the request
        if (state.data === null) {
            // Submit the request
            document.getElementById("search").value = searchParams.get("q");
            search(base + "?", searchParams, "GET");

        // Otherwise, display the search results
        } else {
            displaySearchResults(state.data);
        }

    // Otherwise, display the base HTML
    } else {
        document.querySelector(".results").innerHTML = baseHTML;
    }
});

/**
 * Submits a GET request to the specified URL with the specified query.
 * @async
 * @param       {string} url
 * @param       {URLSearchParams} query
 * @returns     {Promise<JSON>}
 */
async function submit(url, query, method) {
    // console.log("Query: " + query);
    const response = await fetch(url + query, { method: method });
    
    switch (response.status) {
        case 200:
            // console.log("Response Status: 200");
            break;
        case 404:
            // console.log("Response Status: 404");
            // Display error message
            displayErrorMessage("No results found. Please try again.");
            return null;
        case 500:
            displayErrorMessage("Internal server error. Please try again.");
            // console.log("Response Status: 500");
            return null;
        default:
            displayErrorMessage("An error occurred. Please try again.");
            // console.log("Response Status: " + response.status);
            return null;
    }

    const data = response.json();
    return data;
};

/**
 * Searches for images based on the user's query. This is used ONLY in the search form
 * @async
 * @param       {URLSearchParams} query (Optional)
 * @returns     {Promise<void>}
 */
async function search() {
    const url = new URL("https://images-api.nasa.gov/search?");
    
    // Create a new query parameters object
    var queryParameters = new URLSearchParams();
    
    // Get the user's query
    var query = document.getElementById("search").value;
    if (query === "") {
        
        // displayErrorMessage("Please enter a search query.");
        // return;
    } else {
        queryParameters.append("q", query);
        state.query = query;
    }


    var mediaType = document.getElementById("media_type").value;
    if (mediaType !== "all") {
        queryParameters.append("media_type", mediaType);
        state.media_type = mediaType;
    }

    var yearStart = document.getElementById("year_start").value;
    if (yearStart !== "") {
        queryParameters.append("year_start", yearStart);
        state.year_start = yearStart;
    }

    if (queryParameters.size === 0) {
        // displayErrorMessage("Please enter a search query.");
        // return;
    }

    // Submit the request
    const data = await submit(url, queryParameters, "GET");
    state.data = data;

    // Push the state to the history
    history.pushState({ query: state }, "", "?" + queryParameters.toString());

    // Check if the data is null
    if (data === null) {
        console.log("Data is null");
        // Return nothing. Error handling is done in the submit function.
        return;
    } else {
        // Check if the data is empty
        if (data.collection.items.length === 0) {
            // Display error message
            displayErrorMessage("No results found. Please try again.");
            return;
        } else {
            // Otherwise, display the search results
            displaySearchResults(data);
        }
    }
};

/**
 * Searches the NASA API based on the URL search parameters
 * @async
 * @param {URLSearchParams} query 
 * @param {String} method 
 * @returns {Void}
 */
async function URLsearch(query, method) {
    const url = new URL("https://images-api.nasa.gov/search?");
    // Submit the request
    const data = await submit(url, query, method);
    state.data = data;
    state.tags = query.getAll("keywords");

    // Push the state to the history
    history.pushState({ query: state }, "", "?" + query.toString());

    // Check if the data is null
    if (data === null) {
        console.log("Data is null");
        // Return nothing. Error handling is done in the submit function.
        return;
    } else {
        // Check if the data is empty
        if (data.collection.items.length === 0) {
            // Display error message
            displayErrorMessage("No results found. Please try again.");
            return;
        } else {
            // Otherwise, display the search results
            displaySearchResults(data);
        }
    }
};

/**
 * Requests the next page of search results
 * @async
 * @param       {string} direction The direction of the request
 * @returns     {void}
 */
async function requestNext(direction) {
    // Get the next link
    const link = document.querySelector("#"+direction+".nextLink").href;
    // Split the link into the URL and the query
    const split = link.split("?");
    // Get the queries
    const queries = new URLSearchParams(split[1]);

    // Submit the request
    const data = await submit(split[0] + "?", queries, "GET");

    // Check if the data is null
    if (data.collection.items.length === 0) {
        displayErrorMessage("No results found. Please try again.");
        return;
    } else {
        displaySearchResults(data);
    }
};

/**
 * Displays an error message to the user
 * @param       {string} message
 * @returns     {void}
 */
function displayErrorMessage(message) {
    title = document.querySelector(".results");
    title.innerHTML = "<h1>" + message + "</h1>";
    title.style.fontFamily = "Arial";
    title.style.color = "red";
    title.style.textAlign = "center";
};

/**
 * Displays the search results to the user
 * @async
 * @param       {json} data
 * @returns     {void}
 */
async function displaySearchResults(data) {

    console.log(data);
    const results = document.querySelector(".results");
    results.style.color = "black";
    results.style.textAlign = "left";
    results.innerHTML = "";

    let elements = [];
    
    // grab all of the elements to be turned into HTML
    for (let i = 0; i < data.collection.items.length; i++) {

        const div = document.createElement("div");
        div.classList.add("resultInstance");

        // Create the title
        const title = document.createElement("h2");
        title.classList.add("resultInstanceTitle");
        title.innerText = data.collection.items[i].data[0].title;
        
        // Append the title to the parent div
        div.appendChild(title);

    
        // Create a div for the content
        const content = document.createElement("div");
        content.classList.add("resultInstanceContent");
        div.appendChild(content);

        // Find the thumbnail image
        const links = data.collection.items[i].links;
        let thumbnail = "";
        try {
            links.forEach((item) => {
                if (item.rel === "preview") {
                    thumbnail = item.href;
                }
            });
        } catch (e) {
            console.log(e);
            console.log("No thumbnail found at " + i + ". Please try again.");
        }


        // Create the footer
        const footer = document.createElement("div");
        footer.classList.add("resultInstanceFooter");
        footer.innerHTML = "Keywords: ";
        try {
            for (let j = 0; j < data.collection.items[i].data[0].keywords.length; j++) {
                const keyword = document.createElement("a");
                // const keyword = document.createElement("span");
                keyword.href = base + "?keywords=" + data.collection.items[i].data[0].keywords[j];
                keyword.classList.add("resultInstanceKeyword");
                keyword.innerText = data.collection.items[i].data[0].keywords[j];
                footer.appendChild(keyword);
            }
        } catch (error) {
            console.log("No keywords found. Please try again.");
        }

        div.appendChild(footer);



        // Append the element to the results
        results.appendChild(div);
        
        // push the elements to the array with links, type, thumbnail, and the element
        elements.push({
            type: data.collection.items[i].data[0].media_type,
            links: data.collection.items[i].links,
            preview: thumbnail,
            href: data.collection.items[i].href,
            name: data.collection.items[i].data[0].title,
            description: data.collection.items[i].data[0].description
        });

        console.log(data.collection.items[i].data[0].title);
    }


    // Check if the data has a next link
    if (!data.collection.links || data.collection.links.length == 0) {
        console.log("No more results found.");
    } else {
        document.querySelector(".results").innerHTML += "<h2>More Results:</h2>";
        document.querySelector(".results").innerHTML += "<a class='nextLink' id='next' href=" + data.collection.links[0].href + ">" +	data.collection.links[0].prompt + "</a><br>";
        const nextLink = document.querySelector(".nextLink");
        nextLink.addEventListener("click", function (event) {
            event.preventDefault();
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
            requestNext("next");
        });
    }

    loadMedia(elements);
};

/**
 * Loads all of the media elements into the results asynchronously
 * @async
 * @param {Object} elements 
 */
async function loadMedia(elements) {

    let results = document.querySelectorAll(".resultInstanceContent");

    for (let i = 0; i < elements.length; i++) {
        switch (elements[i].type) {
            case "image":
                // This is an async function which returns a promise which is then appended to the results once it is resolved
                loadImage(elements[i].name, elements[i].links, elements[i].preview).then((result) => {
                    results[i].appendChild(result);
                    var description = document.createElement("div");
                    description.classList.add("resultInstanceDescription");
                    
                    if (elements[i].description.length > 700) {
                        description.innerText = elements[i].description.substring(0, 700) + "...";
                    } else {
                        description.innerText = elements[i].description;
                    }
                    
                    results[i].appendChild(description);
                });
                break;
            case "audio":
                // This is an async function which returns a promise which is then appended to the results once it is resolved
                loadAudio(elements[i].name, elements[i].href).then((result) => {
                    results[i].appendChild(result);
                    var description = document.createElement("div");
                    description.classList.add("resultInstanceDescription");
                    
                    if (elements[i].description.length > 700) {
                        description.innerText = elements[i].description.substring(0, 700) + "...";
                    } else {
                        description.innerText = elements[i].description;
                    }
                    
                    results[i].appendChild(description);
                });
                break;
            case "video":
                // This is an async function which returns a promise which is then appended to the results once it is resolved
                loadVideo(elements[i].name, elements[i].href, elements[i].preview).then((result) => {
                    results[i].appendChild(result);
                    var description = document.createElement("div");
                    description.classList.add("resultInstanceDescription");
                    
                    if (elements[i].description.length > 700) {
                        description.innerText = elements[i].description.substring(0, 700) + "...";
                    } else {
                        description.innerText = elements[i].description;
                    }
                    
                    results[i].appendChild(description);
                });
                break;
            default:
                break;
        }
    }
};

/**
 * Creates a promise of an image element to return to the DOM
 * @async
 * @param       {String} title
 * @param       {json} links
 * @param       {String} preview
 * @returns     {Promise<HTMLAnchorElement>}
 */
async function loadImage(title, links, preview) {
    // Find the largest image and get the link
    let size = 0;
    let href = "";

    try {
        links.forEach((item) => {
            if (item.size > size) {
                size = item.size;
                href = item.href;
            }
        });
    } catch (e) {
        console.log(e);
        console.log("No image found. Please try again.");
    }

    // Create the link
    const link = document.createElement("a");
    link.classList.add("resultInstanceLink");
    link.href = href;

    // Create the thumbnail
    const image = document.createElement("img");
    image.classList.add("resultInstanceThumbnail");
    image.src = preview;
    image.alt = title;

    link.appendChild(image);

    return link;
};

/**
 * @async
 * @description Creates a promise of an audio element to return to the DOM
 * @param       {String} name The name of the audio file
 * @param       {String} href The link to the audio file
 * @returns     {Promise<HTMLAudioElement>}
 */
async function loadAudio(name, href) {

    // Fetch the audio file
    let audioURL = "";
    const fetchURL = await submit(href, "", "GET");
    audioURL = await fetchURL[0];

    // Create the audio element
    const audioElement = document.createElement("audio");
    audioElement.controls = true;
    audioElement.ariaLabel = name;

    // Create the source element
    const source = document.createElement("source");
    source.src = audioURL;

    // Append the source to the audio element
    audioElement.appendChild(source);

    return audioElement;
};

/**
 * Creates a promise of a video element to return to the DOM
 * @async
 * @param {String} name The name of the video
 * @param {String} href The link to the video
 * @param {String} thumbnail The video thumbnail
 * @returns {HTMLVideoElement}
 */
async function loadVideo(name, href, thumbnail) {
    // Fetch the video file
    let videoURL = "";
    const fetchURL = await submit(href, "", "GET");
    videoURL = fetchURL[0];
    videoURL = videoURL.replace("http://", "https://");
    
    // Create the video element
    const videoElement = document.createElement("video");
    videoElement.classList.add("resultInstanceLink");
    videoElement.classList.add("resultInstanceThumbnail");
    videoElement.controls = true;
    videoElement.preload = "none";
    videoElement.poster = thumbnail;
    videoElement.href = href;
    videoElement.ariaLabel = name;
    //videoElement.crossOrigin = "anonymous";
    
    // Create the source element
    const source = document.createElement("source");
    source.src = videoURL;
    
    // Append the source to the video element
    videoElement.appendChild(source);

    // Find the subtitles
    let subtitles = "";
    try {
        fetchURL.forEach((item) => {
            if (item.includes(".vtt")) {
                subtitles = item;
                subtitles = subtitles.replace("http://", "https://");
                const track = document.createElement("track");
                track.src = subtitles;
                track.kind = "captions";
                track.srclang = "English";
                videoElement.appendChild(track);
                return;
            }
        });
    } catch (e) {
        console.log(e);
        console.log("No subtitles found for this video.");
    }
    
    return videoElement;
};