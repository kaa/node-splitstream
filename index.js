var util = require("util");
var Writable = require('stream').Writable;
var winston = require("winston");

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
	if(!this.stream)
		this.stream = this.streamFactory();
	this.stream.write(chunk);
}
SplitStream.prototype._endStream = function() {
	if(this.stream)
		this.stream.end();
	this.stream = null;
}
SplitStream.prototype._write = function(chunk, _, callback) {
	var p = 0; var last = 0;
	while(p<chunk.length) {
		if(chunk[p]===this.marker[this.matched])
			this.matched++;
		if(this.matched===this.marker.length) {
			var end = this.position-(this.matched-1);
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
