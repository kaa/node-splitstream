var util = require("util");
var Writable = require('stream').Writable;
var logger = require("winston").loggers.get("kaa/splitstream");

module.exports = SplitStream;

util.inherits(SplitStream, Writable);
function SplitStream(marker, streamFactory, options) {
	Writable.call(this, options);
	this.streamFactory = streamFactory;
	this.marker = marker;
	this.matched = 0;
	this.position = 0;
	this.on("finish", function(){
		this._endStream();
	});
}
SplitStream.prototype._pushToStream = function(chunk) {
	if(chunk.length==0) return;
	if(!this.stream)	
		this.stream = this.streamFactory();
	this.stream.write(chunk);
	logger.debug("pushed %d bytes", chunk.length);
}
SplitStream.prototype._endStream = function() {
	if(this.stream) {
		this.stream.end();
		logger.debug("ended stream");
	}
	this.stream = null;
}
SplitStream.prototype._write = function(chunk, _, callback) {
	logger.debug("got %d byte chunk", chunk.length);
	var p = 0; var last = 0;
	while(p<chunk.length) {
		if(chunk[p]===this.marker[this.matched]) {
			this.matched++;
		} else {
			this.matched = 0;
		}
		if(this.matched===this.marker.length) {
			logger.debug("found marker at %d", this.position);
			var end = this.position-(this.matched);
			this._pushToStream(chunk.slice(last, end));
			this._endStream();
			this.matched = 0;
			last = end;
		}
		p++;
		this.position++;
	}
	this._pushToStream(chunk.slice(last));
	callback();
}