function ProcExample(sampleObj){
	
	
	//Create a canvas to store image data
	var canvas = document.createElement("canvas");
	canvas.width = sampleObj.width;
	canvas.height = sampleObj.height;
	document.body.appendChild(canvas);
	
	// Get the canvas context
	var ctx = canvas.getContext('2d');
	
	
	this.onFrame = function(features, modelIndices)
	{
		if(!features || !modelIndices) return;
		
		// Draw the new sampled image on our canvas
		ctx.drawImage(sampleObj, 0, 0, sampleObj.width,sampleObj.height);
		
		// get the pixels array from our canvas
		// the pixels are a single dimension array of [r,g,b,a] - 
		// each represented with a byte value 0-255 
		var pixels = ctx.getImageData(0, 0, sampleObj.width,sampleObj.height).data;
		
		// get the position of point(14) 
		// check http://auduno.github.io/clmtrackr/media/facemodel_numbering_new.png
		// for ref.
		
		var xy_of_end_of_jaw_line_right_side = features[14];
		
		// draw a point on the coordinates
		ctx.beginPath();
		ctx.arc(xy_of_end_of_jaw_line_right_side[0], xy_of_end_of_jaw_line_right_side[1], 5, 0, 2 * Math.PI, false);
	 	ctx.fillStyle = '#FFCC00';
		ctx.fill();
		
	}
	
}