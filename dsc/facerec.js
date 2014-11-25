
var MODEL_JAW = 0;
var MODEL_RIGHT_EYEB = 1;
var MODEL_LEFT_EYEB = 2;
var MODEL_LEFT_EYE = 3;
var MODEL_RIGHT_EYE = 4;
var MODEL_NOSE_BOTTOM = 5;
var MODEL_NOSE_CENTER = 6;
var MODEL_MOUTH = 7;

function FaceRec(opt){
	if(!opt) opt = {};
	if(!opt.sampleObj) opt.sampleObj = document.getElementsByTagName("sampleObj")[0]; 
	if(typeof opt.sampleObj == "string") opt.sampleObj = document.getElementById(opt.sampleObj);
	if(!opt.sampleObj) throw "Sample missing!";

	var inst = this;
	
	this.ctrack = null;
	
	this.continueSampling = true;
	
	this.init = function(initOpts){
		
		if(!initOpts) initOpts = {};
		if(initOpts.useWebGL != false) initOpts.useWebGL = true;
		if(opt.stopOnConvergence) initOpts.stopOnConvergence = true;
		
		this.ctrack = new clm.tracker(initOpts);
		this.ctrack.init(pModel);
	
		if(opt.sampleObj && opt.sampleObj.nodeName == "VIDEO"){

			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
			window.URL = window.URL || window.webkitURL || window.msURL || window.mozURL;

			// check for camerasupport
			if (navigator.getUserMedia) {
				// set up stream
			
				var videoSelector = {video : true};

				if (window.navigator.appVersion.match(/Chrome\/(.*?) /)) {
					var chromeVersion = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
					if (chromeVersion < 20) {
						videoSelector = "video";
					}
				};
		
				navigator.getUserMedia(videoSelector, function( stream ) {
					if (opt.sampleObj.mozCaptureStream) {
						opt.sampleObj.mozSrcObject = stream;
					} else {
						opt.sampleObj.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
					}
					opt.sampleObj.play();
				}, function() {
					alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
				});
			} else {
				alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
			}

			opt.sampleObj.addEventListener('canplay', this.onReady, false);
		}else{
			document.addEventListener("clmtrackrConverged", function(event) {
				inst.continueSampling = false;
			}, false);
		}
	}
	
	this.startImage = function() {
		inst.ctrack.start(opt.sampleObj);
		inst.drawLoop();
	}
	this.startVideo = function() {
		opt.sampleObj.play();
		inst.ctrack.start(opt.sampleObj);
		inst.drawLoop();
	}
	
	this.drawLoop = function(){
		if((opt.stopOnConvergence && inst.continueSampling == false) || !opt.stopOnConvergence)
			if(inst.onFrame) inst.onFrame(inst.ctrack.getCurrentPosition(),pModel.path.normal);

		if(inst.continueSampling)
			requestAnimFrame(inst.drawLoop);
	}

}