Embedding the Map
=================

The petajakarta.org map can be shown on third-party websites.

Including the map in your website can be done in two different ways:
- Embedding the map as an iframe; which requires only a small addition of HTML to the page which will include the map, 
the map itself is served from the petajakarta web server.
- Embedding the map inline in a page; the map files are served from the third-party site, the map can be edited and customized
as needed. Data is served from the petajakarta web server but the map files are served from the third-party web server.

## Embedding as iframe

Insert HTML like this into your web site:

````
<iframe src="http://petajakarta.org/banjir/id/map-embed/" style="width: 500px; height: 400px;">This browser does not support frames</iframe>
````

Change the style as necessary to position and layout the frame.

Change the `/id/` part of the link to `/en/` to embed an English language map.

## Embedding inline

### Build the embed dist folder

Run
`grunt embed`
to build the distributables for the inline embedded version.

The files in `build/embed` are ready to be placed on a web server and integrated with a website.

Note down the publicly accessible URL used to access the files - e.g., if the files were placed in this folder:

`/home/webserver/public_html/map/build/embed`

And the domain served from public_html is `example.org` then the URL could be `http://example.org/map/build/embed`

### Include the map dependencies in the HTML

In the web page which will include the embedded map, add the following lines to the BODY of the document:

(Replace the string URL_TO_FILES with the URL to the files noted down earlier)

````
<link href="URL_TO_FILES/css/common.css" rel="stylesheet">
<link href="URL_TO_FILES/css/map.css" rel="stylesheet">
		
<div id="includes"></div>

<script src="URL_TO_FILES/js/common.js"></script>
<script src="URL_TO_FILES/js/map.js"></script>
````

Ensure that there is an element ready to be replaced by the map. This element must have:
- A unique ID
- The classes `map` and `embedded`
- Dimensions (e.g. width and height)

````
<div id="map" class="map embedded" style="width: 400px; height: 400px;"></div>
````

### Update map settings

Place this script in the BODY of the page to initialize the map:

````
<script>
$(function() {
	petajakarta.config.urlPrefix = 'URL_TO_FILES';
	petajakarta.start();
});
</script>
````

Be sure to replace the string URL_TO_FILES with the URL to the files noted down earlier.

You should now be able to load the web page with the embedded map.

### Potential Conflicts

The map has dependencies on a number of third-party libraries. These dependencies include jQuery and Bootstrap, which are
included with the map files.

If you website is already using jQuery and/or Bootstrap, the versions included by the map may conflict with them.

In this case it is advised that you use the iframe method of embedding as this will not be affected by dependencies your
website uses.
