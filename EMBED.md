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

`<iframe src="http://petajakarta.org/banjir/id/map-embed/" style="width: 500px; height: 400px;">This browser does not support frames</iframe>`

Change the style as necessary to position and layout the frame.

Change the '/id/' part of the link to '/en/' to embed an English language map.

## Embedding inline

### Build the embed dist folder

TODO

### Copy the embed dist files to server

TODO

### Include the map dependencies in the HTML

TODO

### Update map settings

TODO - local URL vs API URLs

### Discuss dependency conflict esp. jQuery and Bootstrap

TODO