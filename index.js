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
	async function submit(url, query) {
		// console.log("Query: " + query);
		const response = await fetch(url + query, { method: "GET" });

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
			new URLSearchParams({ q: query })
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
		const data = await submit(split[0] + "?", queries);

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
	function displaySearchResults(data) {
		console.log(data);
		title = document.querySelector(".results");
		title.style.color = "black";
		title.style.textAlign = "left";
		title.innerHTML = "";

		for (let i = 0; i < data.collection.items.length; i++) {
			switch (data.collection.items[i].data[0].media_type) {
				case "image":
					displayImage(data.collection.items[i], title);
					break;
				case "audio":
					break;
				case "video":
					break;
				default:
					break;
			}

			// Check if the data has a next link
			if (!data.collection.links || data.collection.links.length == 0) {
			} else {
				document.querySelector(".results").innerHTML += "<h2>More Results:</h2>";
				document.querySelector(".results").innerHTML += "<a class='nextLink' href=" + data.collection.links[0].href + ">" +	data.collection.links[0].prompt + "</a><br>";
				const nextLink = document.querySelector(".nextLink");
				nextLink.addEventListener("click", function (event) {
					event.preventDefault();
					requestNext();
				});
			}

			enableCSS();
		}
    }

    /**
     * @description Adds an image to the DOM
     * @param       {json} data
     * @param       {HTMLElement} results
     * @returns     {void}
     */
    function displayImage(data, results) {
        // Find the thumbnail image
        console.log(data);
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

        try {
            results.innerHTML += `
        <div class='resultInstance'>
            <h2 class=resultInstanceTitle>` + data.data[0].title + " (" + i +	")" +`</h2>
            <a class='resultInstanceLink' href='` + href +`'>
                <img class='resultInstanceThumbnail' src='` + thumbnail + "' alt='" + data.data[0].title +`'>
            </a>
        </div>`;
        } catch (e) {
            if (e instanceof TypeError) {
                console.log(e);
                console.log(
                    "No results found at " + i + ". Please try again."
                );
            }
        }
        console.log("Done");
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
