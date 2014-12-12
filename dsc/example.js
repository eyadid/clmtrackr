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
		var xy_of_end_of_jaw_line_left_side = features[0];
		
		// draw a point on the coordinates
// 		ctx.beginPath();
//  		ctx.arc(xy_of_end_of_jaw_line_right_side[0], xy_of_end_of_jaw_line_right_side[1], 5, 0, 2 * Math.PI, false);
//  	 	ctx.fillStyle = '#FFCC00';
//  		ctx.fill();
//  		
//  		ctx.beginPath();
//  		ctx.arc(xy_of_end_of_jaw_line_left_side[0], xy_of_end_of_jaw_line_left_side[1], 5, 0, 2 * Math.PI, false);
//  	 	ctx.fillStyle = '#FFCC00';
//  		ctx.fill();
//  		
//  		ctx.beginPath();
//  		ctx.arc(features[5][0], features[5][1], 5, 0, 2 * Math.PI, false);
//  	 	ctx.fillStyle = '#FFCC00';
//  		ctx.fill();
//  		
//  		ctx.beginPath();
//  		ctx.arc(features[9][0], features[9][1], 5, 0, 2 * Math.PI, false);
//  	 	ctx.fillStyle = '#FFCC00';
//  		ctx.fill();
		

		var xAvg = (2*features[41][0]+features[12][0])/3
		var yAvg = (2*features[41][1]+features[12][1])/3
		var leftCheekImageData = ctx.getImageData(xAvg, yAvg, (features[13][0]-xAvg)*0.5, (features[31][1]-yAvg)*0.5).data;

		var xAvg = (2*features[41][0]+features[2][0])/3
		var yAvg = (2*features[41][1]+features[2][1])/3
		var rightCheekImageData = ctx.getImageData(xAvg, yAvg, (features[1][0]-xAvg)*0.5, (features[26][1]-yAvg)*0.5).data;
		var foreHeadImageData = ctx.getImageData(features[20][0], features[20][1]-Math.abs(features[20][1]-features[63][1]), Math.abs(features[20][0]-features[16][0]), -Math.abs(features[20][1]-features[63][1])).data;

		var combinedData = combinePixelData(leftCheekImageData, rightCheekImageData)
		var combinedData = combinePixelData(combinedData, foreHeadImageData)
		
		//todo need to store 1/stdev to speed up processing
		var stats = colorStats(combinedData);

		var brightnessValues = brightnessDistortion(combinedData, stats);
		var brightnessRMS = brightnessValues[0];

		var chromaticityValues = chromaticityDistortion(combinedData, stats, brightnessValues[1]);
		var chromaticityRMS = chromaticityValues[0];

		var aInverse = 1/brightnessRMS;
		var bInverse = 1/chromaticityRMS;
		
		var brightnessThresholds = getBrightnessThresholdValues(chromaticityValues[1], aInverse);
		var lowerBrightnessThresholds = brightnessThresholds[0];
		var upperBrightnessThresholds = brightnessThresholds[1];
		var chromaticityThreshold = getChromaticityThresholdValues(chromaticityValues[1], bInverse);

		var x = features[41][0];
		var y = features[41][1];
		var width = 1;
		var height = 1;
		var pixels = ctx.getImageData(x, y, width, height).data;
		var xCounter = 0;
		var yCounter = 0;

		for(var i = 0 ; i < pixels.length; i+=4){
			if(pixels[i] == 0 || pixels[i+1] == 0 || pixels[i+2] == 0 || pixels[i+3] == 0) continue;
			
			ctx.beginPath();
			
			var pixel = [pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]]
			var brightnessValues = brightnessDistortion(pixel, stats);
			var pixelBrightness = brightnessValues[1]-1;

			var chromaticityValues = chromaticityDistortion(pixel, stats, brightnessValues[1]);
			var pixelChromaticity = chromaticityValues[1];
			
			if (pixelChromaticity > chromaticityThreshold) {
				//foreground
				ctx.fillStyle="green";
					ctx.arc(x+xCounter, y+yCounter, 1, 0, 2 * Math.PI, false);
					console.log('b green: ' + pixelBrightness + ' and ' + lowerBrightnessThresholds + ' with ' + upperBrightnessThresholds);
					console.log('c green: ' + pixelChromaticity + ' and ' + chromaticityThreshold);
				
			} else if (lowerBrightnessThresholds < pixelBrightness && pixelBrightness < upperBrightnessThresholds) {
				//original background
				ctx.fillStyle="red";
				
					ctx.arc(x+xCounter, y+yCounter, 1, 0, 2 * Math.PI, false);
					console.log('b red: ' + pixelBrightness + ' and ' + lowerBrightnessThresholds + ' with ' + upperBrightnessThresholds);
					console.log('c red: ' + pixelChromaticity + ' and ' + chromaticityThreshold);
				
			} else if (pixelBrightness < 0) {
				//shaded background
				ctx.fillStyle="blue";
				
					ctx.arc(x+xCounter, y+yCounter, 1, 0, 2 * Math.PI, false);
					console.log('b blue: ' + pixelBrightness + ' and ' + lowerBrightnessThresholds + ' with ' + upperBrightnessThresholds);
					console.log('c blue: ' + pixelChromaticity + ' and ' + chromaticityThreshold);
				
			} else {
				//highlighted background
				ctx.fillStyle="black";
				
					ctx.arc(x+xCounter, y+yCounter, 1, 0, 2 * Math.PI, false);
					console.log('b black: ' + pixelBrightness + ' and ' + lowerBrightnessThresholds + ' with ' + upperBrightnessThresholds);
					console.log('c black: ' + pixelChromaticity + ' and ' + chromaticityThreshold);

			}
			ctx.fill();
			xCounter++;
			if (xCounter > width) {
				xCounter = 0;
				yCounter++;
			}
		}
	}
	
	function getBrightnessThresholdValues(rawBrightness, aInverse){
		var normalizedBrightness = [];
		for(var i = 0 ; i < rawBrightness.length; i+=1){
			normalizedBrightness.push(rawBrightness[i]*aInverse);
		}

		normalizedBrightness.sort();
		
		var lowerThreshold = normalizedBrightness[Math.floor((normalizedBrightness.length-1)*0.0001)];
		var upperThreshold = normalizedBrightness[Math.floor((normalizedBrightness.length-1)*0.9999)];

		return [lowerThreshold, upperThreshold];
	}
	
	function getChromaticityThresholdValues(rawChromaticity, bInverse){
		var normalizedChromaticity = [];
		for(var i = 0 ; i < rawChromaticity.length; i+=1){
			normalizedChromaticity.push(rawChromaticity[i]*bInverse);
		}

		normalizedChromaticity.sort();
		
		var threshold = normalizedChromaticity[Math.floor((normalizedChromaticity.length-1)*0.9999)];
		
		return threshold;
	}
	
	function chromaticityDistortion(pixels, stats, brightnessDistortion){
		var chromaticity = [];
		var counter = 0;
		for(var i = 0 ; i < pixels.length; i+=4){
			if(pixels[i] == 0 || pixels[i+1] == 0 || pixels[i+2] == 0 || pixels[i+3] == 0) continue;

			chromaticity.push(Math.sqrt(Math.pow((pixels[i] - brightnessDistortion[counter] * stats.mean.r)/stats.stdev.r, 2) * Math.pow((pixels[i+1] - brightnessDistortion[counter] * stats.mean.g)/stats.stdev.g, 2) * Math.pow((pixels[i+2] - brightnessDistortion[counter] * stats.mean.b)/stats.stdev.b, 2)));
			counter++;
		}

		return [rootMeanSquare(chromaticity), chromaticity];
	}
	
	function brightnessDistortion(pixels, stats){
		var brightness = [];
		for(var i = 0 ; i < pixels.length; i+=4){
			if(pixels[i] == 0 || pixels[i+1] == 0 || pixels[i+2] == 0 || pixels[i+3] == 0) continue;

			brightness.push(pixels[i]*stats.brightnessCoeff.r + pixels[i+1]*stats.brightnessCoeff.g + pixels[i+2]*stats.brightnessCoeff.b);
		}
		return [brightnessRootMeanSquare(brightness), brightness];
	}
	
	function brightnessRootMeanSquare(data){
		var squares = 0;
		for(var i = 0 ; i < data.length; i+=1){
			squares += Math.pow(data[i]-1, 2);
		}
		return Math.sqrt(squares/data.length);
	}
	
	function rootMeanSquare(data){
		var squares = 0;
		for(var i = 0 ; i < data.length; i+=1){
			squares += Math.pow(data[i], 2);
		}
		return Math.sqrt(squares/data.length);
	}
	
	function colorStats(data){
		var colorAverage = getAvgColor(data)
		var colorStandardDeviation = getStandardDeviationColor(data, colorAverage)
		var brightnessCoefficients = getBrightnessCoefficients(colorAverage, colorStandardDeviation)
						
		return {mean : colorAverage, stdev : colorStandardDeviation, brightnessCoeff : brightnessCoefficients}
	}
	
	function getBrightnessCoefficients(mean, stdev){
		var internal = Math.pow(mean.r/stdev.r, 2) + Math.pow(mean.g/stdev.g, 2) + Math.pow(mean.b/stdev.b, 2);

		var red = mean.r/(internal * Math.pow(stdev.r, 2));
		var green = mean.g/(internal * Math.pow(stdev.g, 2));
		var blue = mean.b/(internal * Math.pow(stdev.b, 2));		

		return {r : red, g : green, b : blue};
	}

	function getStandardDeviationColor(data, mean){
		var counter = 0;
		var standardDeviation = {r:0,g:0,b:0,a:0};
		for(var i = 0 ; i < data.length; i+=4){
			if(data[i] == 0 || data[i+1] == 0 || data[i+2] == 0 || data[i+3] == 0) continue;
			
			counter++;

			standardDeviation.r += Math.pow(data[i]-mean.r, 2);
			standardDeviation.g += Math.pow(data[i+1]-mean.g, 2);
			standardDeviation.b += Math.pow(data[i+2]-mean.b, 2);
			standardDeviation.a += Math.pow(data[i+3]-mean.a, 2);
		}
		standardDeviation.r /= counter;
		standardDeviation.g /= counter;
		standardDeviation.b /= counter;
		standardDeviation.a /= counter;

		standardDeviation.r = Math.sqrt(standardDeviation.r);
		standardDeviation.g = Math.sqrt(standardDeviation.g);
		standardDeviation.b = Math.sqrt(standardDeviation.b);
		standardDeviation.a = Math.sqrt(standardDeviation.a);
		
		return standardDeviation;
	}
	
	function getAvgColor(data){
		var counter = 0;
		var mean = {r:0,g:0,b:0,a:0};
		for(var i = 0 ; i < data.length; i+=4){
			if(data[i] == 0 || data[i+1] == 0 || data[i+2] == 0 || data[i+3] == 0) continue;
			
			counter++;
	
			mean.r += data[i];
			mean.g += data[i+1];
			mean.b += data[i+2];
			mean.a += data[i+3];
		}
		mean.r /= counter;
		mean.g /= counter;
		mean.b /= counter;
		mean.a /= counter;
	
		return mean;
	}
	
	function combinePixelData(data1, data2){
		var capturedData = [];
		for(var i = 0 ; i < data1.length; i+=1){
			capturedData[capturedData.length] = data1[i];
		}

		for(var i = 0 ; i < data2.length; i+=1){
			capturedData[capturedData.length] = data2[i];
		}

		return capturedData;
	}
	
}