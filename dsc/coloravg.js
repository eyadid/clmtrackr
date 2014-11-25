var countsample = 0;
function ColorAvg(sampleObj){

	var MODEL_MOUTH_B = 999;
	
	var featuresIndices = {};

	featuresIndices[MODEL_NOSE_BOTTOM] = [pModel.path.normal[MODEL_NOSE_BOTTOM][2], pModel.path.normal[MODEL_NOSE_BOTTOM][6]];
	featuresIndices[MODEL_MOUTH] = [pModel.path.normal[MODEL_MOUTH][16], pModel.path.normal[MODEL_MOUTH][20]];
	featuresIndices[MODEL_JAW] = pModel.path.normal[MODEL_JAW];
	featuresIndices[MODEL_LEFT_EYE] = [pModel.path.normal[MODEL_LEFT_EYE][8]];
	featuresIndices[MODEL_RIGHT_EYE] = [pModel.path.normal[MODEL_RIGHT_EYE][8]];
	featuresIndices[MODEL_MOUTH_B] = [];

	var canvas = document.createElement("canvas");
	var canvas2 = document.createElement("canvas");
	
	canvas.width = sampleObj.width;
	canvas.height = sampleObj.height;
	
	canvas2.width = sampleObj.width;
	canvas2.height = sampleObj.height;

	document.body.appendChild(canvas);
	document.body.appendChild(canvas2);
	
	var ctxJawLine = canvas.getContext('2d');
	var ctxCheekbone = canvas2.getContext('2d');

	for(var i = 0 ; i < pModel.path.normal[MODEL_MOUTH].length; i++){
		if(i < 12)
			featuresIndices[MODEL_MOUTH_B].push(pModel.path.normal[MODEL_MOUTH][i]);
	}

	function getPoint(features, featureId, idx) 
	{
	    return { x : features[featuresIndices[featureId][idx]][0],
				 y : features[featuresIndices[featureId][idx]][1]}

	}

	function checkRect(rect,p){
		rect.left = Math.min(rect.left,p.x);
		rect.right = Math.max(rect.right,p.x);
		rect.top = Math.min(rect.top,p.y);
		rect.bottom = Math.max(rect.bottom,p.y);
	}

	function getAvgColor(data){
		var a = 0;
		var c = {r:0,g:0,b:0,a:0};
		for(var i = 0 ; i < data.length; i+=4){
			if(data[i] == 0 ||
				data[i+1] == 0 ||
				data[i+2] == 0 ||
				data[i+3] == 0) continue;
			
				a++;
			
				c.r += data[i];
				c.g += data[i+1];
				c.b += data[i+2];
				c.a += data[i+3];
		}
		c.r /= a;
		c.g /= a;
		c.b /= a;
		c.a /= a;
		c.r = Math.floor(c.r);
		c.g = Math.floor(c.g);
		c.b = Math.floor(c.b);
		c.a = Math.floor(c.a);
	
		return c;
	}

	this.calculateAverages = function(features, modelIndices){
		if(!features) return null;

		var rect = {left:10000000,top:10000000,right:-10000000,bottom:-10000000};
	
		var point = {x:0,y:0};
	
		var pointJawA = getPoint(features,MODEL_JAW, 0);
		var pointNoseA = getPoint(features,MODEL_NOSE_BOTTOM, 0);
		var pointMouthA = getPoint(features,MODEL_MOUTH, 1);
	
		var pointJawB = getPoint(features,MODEL_JAW, featuresIndices[MODEL_JAW].length-1);
		var pointNoseB = getPoint(features,MODEL_NOSE_BOTTOM, 1);
		var pointMouthB = getPoint(features,MODEL_MOUTH, 0);
	
		ctxJawLine.clearRect(0, 0, sampleObj.width, sampleObj.height);
		ctxJawLine.drawImage(sampleObj, 0, 0, sampleObj.width,sampleObj.height);

		/****
	
		Calculate Jaw line average color
	
		***/
		
		ctxJawLine.beginPath();
		ctxJawLine.moveTo(pointNoseA.x,pointNoseA.y);
	
		checkRect(rect,pointNoseA);
	
		ctxJawLine.quadraticCurveTo(pointJawA.x,pointMouthA.y,pointJawA.x,pointJawA.y);

		for(var i = 0 ; i < featuresIndices[MODEL_JAW].length; i++) {
			p = getPoint(features,MODEL_JAW, i)
			ctxJawLine.lineTo(p.x,p.y);
			checkRect(rect,p);
		}
	
		ctxJawLine.quadraticCurveTo(pointJawB.x,pointMouthB.y,pointNoseB.x,pointNoseB.y);
	
		ctxJawLine.closePath();
	
		ctxJawLine.globalCompositeOperation = 'destination-in';
		ctxJawLine.fill();

		ctxJawLine.beginPath();
	
		p = getPoint(features,MODEL_MOUTH_B, 0);
	
		ctxJawLine.moveTo(p.x,p.y);

		checkRect(rect,p);
	
		for(var i = 0 ; i < featuresIndices[MODEL_MOUTH_B].length; i++) {
			p = getPoint(features,MODEL_MOUTH_B, i)
			ctxJawLine.lineTo(p.x,p.y);
			checkRect(rect,p);
		}
		
		ctxJawLine.closePath();
		ctxJawLine.globalCompositeOperation = 'destination-out';
		ctxJawLine.fill();
		
		var avgJawColor = getAvgColor(ctxJawLine.getImageData(rect.left,rect.top,rect.right-rect.left,rect.bottom-rect.top).data);
		
	
		/****
	
		Calculate cheekbone average color
	
		***/
	
		ctxCheekbone.clearRect(0,0,sampleObj.width,sampleObj.height);
		ctxCheekbone.drawImage(sampleObj, 0, 0, sampleObj.width,sampleObj.height);
	
		p = getPoint(features,MODEL_LEFT_EYE, 0);
	
		var dy = Math.abs(pointNoseA.y - p.y);
		var dx = Math.abs(pointNoseA.x - p.x);
		var angle = Math.atan2(dy , dx);
		var distance = Math.sqrt((dx*dx) + (dy*dy))/2;
	
		var centerX = p.x + distance * Math.cos(angle);
		var centerY = p.y + distance * Math.sin(angle);
	
		ctxCheekbone.globalCompositeOperation = 'destination-in';

		ctxCheekbone.beginPath();
		ctxCheekbone.arc(centerX, centerY, distance/2, 0, 2 * Math.PI, false);
		
		p = getPoint(features,MODEL_RIGHT_EYE, 0);

		dy = Math.abs(pointNoseB.y - p.y);
		dx = Math.abs(pointNoseB.x - p.x);
		angle = Math.atan2(dy , dx);
		distance = Math.sqrt((dx*dx) + (dy*dy))/2;
	
		centerX = p.x - distance * Math.cos(angle);
		centerY = p.y + distance * Math.sin(angle);
	
		ctxCheekbone.arc(centerX, centerY, distance/2, 0, 2 * Math.PI, false);
		ctxCheekbone.closePath();
		
		
		ctxCheekbone.fill();
	
		var avgCheekboneColor = getAvgColor(ctxCheekbone.getImageData(centerX - distance/2,centerY - distance/2,distance,distance).data);
		
		return {cheekbone : avgCheekboneColor,
				jaw : avgJawColor};
	}
	
}
