# Rvt3js
[Check out a working version here](http://mcculloughrt.github.io/rvt3js)

A three.js WebGL/WebVR viewer for exploring Autodesk Revit models directly in browser.<br />
Revit models are exported to a JSON format using vA3C, then loaded into a three.js WebGL rendering engine. Because the JSON format supports meta information, all element data about each construction assembly is exported as well. In the web viewer, clicking on an element will display its embedded information.<br /><br />
As a test for alternative interaction, support for the LEAP Motion controller has been included so that physical gestures like grabbing and moving your hands will manipulate the 3d model. This gives a greater sense of "taking control" of the design, and a more intuitive way of navigating especially in group settings.<br /><br />
Experimental support is also included for WebVR using a nightly build of Chrome.
