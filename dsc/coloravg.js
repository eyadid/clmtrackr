function ColorAvg( ctx , vid){

	var MODEL_MOUTH_B = 999;
	
	var featuresIndices = {};

	featuresIndices[MODEL_NOSE_BOTTOM] = [pModel.path.normal[MODEL_NOSE_BOTTOM][2], pModel.path.normal[MODEL_NOSE_BOTTOM][6]];
	featuresIndices[MODEL_MOUTH] = [pModel.path.normal[MODEL_MOUTH][16], pModel.path.normal[MODEL_MOUTH][20]];
	featuresIndices[MODEL_JAW] = pModel.path.normal[MODEL_JAW];
	featuresIndices[MODEL_LEFT_EYE] = [pModel.path.normal[MODEL_LEFT_EYE][8]];
	featuresIndices[MODEL_RIGHT_EYE] = [pModel.path.normal[MODEL_RIGHT_EYE][8]];
	featuresIndices[MODEL_MOUTH_B] = [];

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

	function getQuadraticBezierXY(percent,startPt,controlPt,endPt) {
	    var x = Math.pow(1-percent,2) * startPt.x + 2 * (1-percent) * percent * controlPt.x + Math.pow(percent,2) * endPt.x; 
	    var y = Math.pow(1-percent,2) * startPt.y + 2 * (1-percent) * percent * controlPt.y + Math.pow(percent,2) * endPt.y; 
	    return {x:x,y:y};
	}

	this.calculateAverages = function(features){
		if(!features) return null;
	
		var rect = {left:10000000,top:10000000,right:-10000000,bottom:-10000000};
	
		var point = {x:0,y:0};
	
		var pointJawA = getPoint(features,MODEL_JAW, 0);
		var pointNoseA = getPoint(features,MODEL_NOSE_BOTTOM, 0);
		var pointMouthA = getPoint(features,MODEL_MOUTH, 1);
	
		var pointJawB = getPoint(features,MODEL_JAW, featuresIndices[MODEL_JAW].length-1);
		var pointNoseB = getPoint(features,MODEL_NOSE_BOTTOM, 1);
		var pointMouthB = getPoint(features,MODEL_MOUTH, 0);
	
		ctx.clearRect(0, 0, 400, 300);
		ctx.drawImage(vid, 0, 0, 400,300);
	
		/****
	
		Calculate Jaw line average color
	
		***/
	
		ctx.beginPath();
		ctx.moveTo(pointNoseA.x,pointNoseA.y);
	
		checkRect(rect,pointNoseA);
	
		for(var i = 0;i <= 1; i += 0.2) {
			p = getQuadraticBezierXY(i, pointNoseA,{x:pointJawA.x,y:pointMouthA.y},pointJawA);
			ctx.lineTo(p.x,p.y);
			checkRect(rect,p);
		}
	
		for(var i = 0 ; i < featuresIndices[MODEL_JAW].length; i++) {
			p = getPoint(features,MODEL_JAW, i)
			ctx.lineTo(p.x,p.y);
			checkRect(rect,p);
		}
	
		for(var i = 0;i <= 1; i += 0.2) {
			p = getQuadraticBezierXY(i, pointJawB,{x:pointJawB.x, y:pointMouthB.y},pointNoseB);
			ctx.lineTo(p.x,p.y);
			checkRect(rect,p);
		}
	
		ctx.closePath();
	
		ctx.globalCompositeOperation = 'destination-in';
		ctx.fill();
	
		ctx.beginPath();
	
		p = getPoint(features,MODEL_MOUTH_B, 0);
	
		ctx.moveTo(p.x,p.y);
	
		checkRect(rect,p);
	
		for(var i = 0 ; i < featuresIndices[MODEL_MOUTH_B].length; i++) {
			p = getPoint(features,MODEL_MOUTH_B, i)
			ctx.lineTo(p.x,p.y);
			checkRect(rect,p);
		}
	
		ctx.closePath();
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fill();
	
		var avgJawColor = getAvgColor(ctx.getImageData(rect.left,rect.top,rect.right-rect.left,rect.bottom-rect.top).data);
	
		/****
	
		Calculate cheekbone average color
	
		***/
	
		ctx.clearRect(0,0,400,300);

		ctx.drawImage(vid, 0, 0, 400,300);
	
		p = getPoint(features,MODEL_LEFT_EYE, 0);
		//pointNoseA
	
		var dy = Math.abs(pointNoseA.y - p.y);
		var dx = Math.abs(pointNoseA.x - p.x);
		var angle = Math.atan2(dy , dx);
		var distance = Math.sqrt((dx*dx) + (dy*dy))/2;
	
		var centerX = p.x + distance * Math.cos(angle);
		var centerY = p.y + distance * Math.sin(angle);
	
		ctx.globalCompositeOperation = 'destination-in';
		ctx.beginPath();
		ctx.arc(centerX, centerY, distance/2, 0, 2 * Math.PI, false);
		ctx.closePath();
		ctx.fill();
	
		return {cheekbone : getAvgColor(ctx.getImageData(centerX - distance/2,centerY - distance/2,distance,distance).data),
				jaw : avgJawColor};
	}
	
}
