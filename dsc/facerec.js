
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
	if(!opt.videoObj) opt.videoObj = document.getElementsByTagName("video")[0]; 
	if(typeof opt.videoObj == "string") opt.videoObj = document.getElementById(opt.videoObj);
	if(!opt.videoObj) throw "Video missing!";

	var inst = this;
	
	this.ctrack = null;

	this.init = function(){
		
		this.ctrack = new clm.tracker({ useWebGL: true });
		this.ctrack.init(pModel);

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
				if (opt.videoObj.mozCaptureStream) {
					opt.videoObj.mozSrcObject = stream;
				} else {
					opt.videoObj.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
				}
				opt.videoObj.play();
			}, function() {
				alert("There was some problem trying to fetch video from your webcam, using a fallback video instead.");
			});
		} else {
			alert("Your browser does not seem to support getUserMedia, using a fallback video instead.");
		}

		opt.videoObj.addEventListener('canplay', this.onReady, false);
	}
	
	this.startVideo = function() {
		opt.videoObj.play();
		inst.ctrack.start(opt.videoObj);
		inst.drawLoop();
	}
	
	this.drawLoop = function(){
		if(inst.onFrame) inst.onFrame(inst.ctrack.getCurrentPosition(),pModel.path.normal);
		requestAnimFrame(inst.drawLoop);
	}

}