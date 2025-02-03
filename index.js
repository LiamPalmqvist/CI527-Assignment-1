window.onload = function () {
	// Add event listener to the search form
	document.getElementById("form").addEventListener("submit", search);

	/**
	 * @async
	 * @description Submits a GET request to the specified URL with the specified query.
	 * @param       {string} url
	 * @param       {URLSearchParams} query
	 * @returns     {Promise<JSON>}
	 */
	async function submit(url, query, method) {
		// console.log("Query: " + query);
		const response = await fetch(url + query, { method: method });

		switch (response.status) {
			case 200:
				console.log("Response Status: 200");
				break;
			case 404:
				console.log("Response Status: 404");
				// Display error message
				displayErrorMessage("No results found. Please try again.");
				return null;
			case 500:
				console.log("Response Status: 500");
				return null;
			default:
				console.log("Response Status: " + response.status);
				return null;
		}

		const data = await response.json();
		return data;
	}

	/**
	 * @async
	 * @description Searches for images based on the user's query. This is used ONLY in the search form
	 * @returns     {Promise<void>}
	 */
	async function search() {
		// Get the user's query
		query = document.getElementById("search").value;
		if (query === "") {
			displayErrorMessage("Please enter a search query.");
			return;
		}

		// Construct the query
		const data = await submit(
			"https://images-api.nasa.gov/search?",
			new URLSearchParams({ q: query }),
            "GET"
		);

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
	}

	/**
	 * @async
	 * @description Requests the next page of search results
	 * @returns     {void}
	 */
	async function requestNext() {
		// Get the next link
		const link = document.querySelector(".nextLink").href;
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
	}

	/**
	 * @desctiprion Displays an error message to the user
	 * @param       {string} message
	 * @returns     {void}
	 */
	function displayErrorMessage(message) {
		title = document.querySelector(".results");
		title.innerHTML = "<h1>" + message + "</h1>";
		title.style.fontFamily = "Arial";
		title.style.color = "red";
		title.style.textAlign = "center";
	}

	/**
	 * @description Displays the search results to the user
	 * @param       {json} data
	 * @returns     {void}
	 */
	async function displaySearchResults(data) {
        let videos = []

		console.log(data);
		title = document.querySelector(".results");
		title.style.color = "black";
		title.style.textAlign = "left";
		title.innerHTML = "";

		for (let i = 0; i < data.collection.items.length; i++) {
			switch (data.collection.items[i].data[0].media_type) {
				case "image":
					title.appendChild(createImageElement(data.collection.items[i]));
					break;
				case "audio":
                    title.appendChild(await createAudioElement(data.collection.items[i]));
					break;
				case "video":
                    const video = await createVideoElement(data.collection.items[i]);
                    videos.push([data.collection.items[i].href, await video]);
                    title.appendChild(await video);
					break;
				default:
					break;
			}
        }

        // Check if the data has a next link
        if (!data.collection.links || data.collection.links.length == 0) {
        } else {
            document.querySelector(".results").innerHTML += "<h2>More Results:</h2>";
            document.querySelector(".results").innerHTML += "<a class='nextLink' href=" + data.collection.links[0].href + ">" +	data.collection.links[0].prompt + "</a><br>";
            const nextLink = document.querySelector(".nextLink");
            nextLink.addEventListener("click", function (event) {
                event.preventDefault();
                document.body.scrollTop = 0; // For Safari
                document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
                requestNext();
            });
        }

        enableCSS();
        loadVideos(videos);
    }

    /**
     * @description Creates an image to return to the DOM
     * @param       {json} data
     * @param       {HTMLElement} results
     * @returns     {HTMLDivElement}
     */
    function createImageElement(data) {
        // Create the parent div
        const div = document.createElement("div");
        div.classList.add("resultInstance");
        
        // Create the title
        const title = document.createElement("h2");
        title.classList.add("resultInstanceTitle");
        title.innerText = data.data[0].title;
        // Append the title to the parent div
        div.appendChild(title);
        
        // Find the thumbnail image
        // console.log(data);
        const links = data.links;
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

        // Find the largest image and get the link
        let size = 0;
        let href = "";

        try {
            data.links.forEach((item) => {
                if (item.size > size) {
                    size = item.size;
                    href = item.href;
                }
            });
        } catch (e) {
            console.log(e);
            console.log("No image found at " + i + ". Please try again.");
        }

        // Create the link
        const link = document.createElement("a");
        link.classList.add("resultInstanceLink");
        link.href = href;

        // Create the thumbnail
        const image = document.createElement("img");
        image.classList.add("resultInstanceThumbnail");
        image.src = thumbnail;
        image.alt = data.data[0].title;
        link.appendChild(image);
        // Append the thumbnail to the link
        div.appendChild(link);
        // Append the link to the parent div
        return div;
    }

    /**
     * @description Creates an audio element to return to the DOM
     * @param       {json} data
     * @returns     {HTMLDivElement}
     */
    async function createAudioElement(data) {
        // first, request the audio file from the json data
        // then, create the audio element
        // finally, return the audio element

        // Create the parent div
        const div = document.createElement("div");
        div.classList.add("resultInstance");

        // Create the title
        const title = document.createElement("h2");
        title.classList.add("resultInstanceTitle");
        title.innerText = data.data[0].title;
        // Append the title to the parent div
        div.appendChild(title);

        // Fetch the audio file
        const fetchURL = await submit(data.href, "", "GET");
        audioURL = await fetchURL[0];
        
        // Create the audio element
        const audioElement = document.createElement("video");
        audioElement.controls = true;

        // Create the source element
        const source = document.createElement("source");
        source.src = audioURL;
        
        // Append the source to the audio element
        audioElement.appendChild(source);

        // Append the audio to the parent div
        div.appendChild(audioElement);

        return div;
    }

    /**
     * @description Creates a video element to return to the DOM
     * @param       {json} data
     * @returns     {HTMLDivElement, URL}
     */
    async function createVideoElement(data) {
        // first, request the video file from the json data
        // then, create the video element
        // finally, return the audio element

        // Create the parent div
        const div = document.createElement("div");
        div.classList.add("resultInstance");

        // Create the title
        const title = document.createElement("h2");
        title.classList.add("resultInstanceTitle");
        title.innerText = data.data[0].title;
        // Append the title to the parent div
        div.appendChild(title);

        // Create the video element
        const videoElement = document.createElement("video");
        videoElement.controls = true;
        videoElement.preload = "none";
        videoElement.poster = data.links[0].href;
        videoElement.href = data.links[0].href;
        videoElement.classList.add("resultInstanceThumbnail");
        
        // This can be moved
        // Fetch the video file
        //const fetchURL = await submit(data.href, "", "GET");
        //audioURL = await fetchURL[0];
        
        // Create the video element
        const audioElement = document.createElement("video");
        audioElement.controls = true;

        // Create the source element
        const source = document.createElement("source");
        // This can be moved
        //source.src = audioURL;
        
        // Append the source to the video element
        audioElement.appendChild(source);

        // Append the video to the parent div
        div.appendChild(audioElement);

        return div;
    }

    /**
     * @async
     * @description Assigns the video URLs to the video elements after everything else has loaded
     * @param {HTMLElement, URL} videos 
     */
    async function loadVideos(videos) {
        // Iterate through the videos
        console.log(videos);
        
        for (video in videos) {
            console.log(videos[video]);
            const fetchURL = await submit(videos[video][0], "", "GET");
            console.log(fetchURL);
            const url = await fetchURL[0];
            videos[video][1].querySelector("source").src = url;
            videos[video][1].addEventListener("load", function() {
                videos[video][1].querySelector("video").load();
            });
        };
        
    }

	/**
	 * @description Enables CSS for the search results
	 * @returns     {void}
	 */
	function enableCSS() {
		const results = document.querySelector(".results");
		results.style.fontFamily = "Arial";

		const resultsInstances = document.querySelectorAll(".resultInstance");
		resultsInstances.forEach((instance) => {
			instance.style.margin = "10px";
			instance.style.outline = "1px solid black";
		});

		const resultInstanceTitles = document.querySelectorAll(
			".resultInstanceTitle"
		);
		resultInstanceTitles.forEach((title) => {
			title.style.padding = "10px 0 0 10px";
		});

		document
			.querySelectorAll(".resultInstanceThumbnail")
			.forEach((image) => {
				image.style.height = "150px";
				image.style.margin = "10px";
			});
	}
};