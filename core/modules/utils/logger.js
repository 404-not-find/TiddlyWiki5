/*\
title: $:/core/modules/utils/logger.js
type: application/javascript
module-type: utils

A basic logging implementation

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var ALERT_TAG = "$:/tags/Alert";

/*
Make a new logger
*/
function Logger(componentName,options) {
	options = options || {};
	this.componentName = componentName || "";
	this.colour = options.colour || "white";
	this.enable = "enable" in options ? options.enable : true;
	this.save = "save" in options ? options.save : true;
	this.saveLimit = options.saveLimit || 100 * 1024;
	this.buffer = "";
}

/*
Log a message
*/
Logger.prototype.log = function(/* args */) {
	var self = this;
	if(this.enable) {
		if(this.save) {
			this.buffer += $tw.utils.formatDateString(new Date(),"YYYY MM DD 0hh:0mm:0ss.0XXX") + ":";
			$tw.utils.each(Array.prototype.slice.call(arguments,0),function(arg,index) {
				self.buffer += " " + arg;
			});
			this.buffer += "\n";
			this.buffer = this.buffer.slice(-this.saveLimit);			
		}
		if(console !== undefined && console.log !== undefined) {
			return Function.apply.call(console.log, console, [$tw.utils.terminalColour(this.colour),this.componentName + ":"].concat(Array.prototype.slice.call(arguments,0)).concat($tw.utils.terminalColour()));
		}
	} 
};

/*
Read the message buffer
*/
Logger.prototype.getBuffer = function() {
	return this.buffer;
};

/*
Log a structure as a table
*/
Logger.prototype.table = function(value) {
	(console.table || console.log)(value);
};

/*
Alert a message
*/
Logger.prototype.alert = function(/* args */) {
	if(this.enable) {
		// Prepare the text of the alert
		var text = Array.prototype.join.call(arguments," ");
		// Create alert tiddlers in the browser
		if($tw.browser) {
			// Check if there is an existing alert with the same text and the same component
			var existingAlerts = $tw.wiki.getTiddlersWithTag(ALERT_TAG),
				alertFields,
				existingCount,
				self = this;
			$tw.utils.each(existingAlerts,function(title) {
				var tiddler = $tw.wiki.getTiddler(title);
				if(tiddler.fields.text === text && tiddler.fields.component === self.componentName && tiddler.fields.modified && (!alertFields || tiddler.fields.modified < alertFields.modified)) {
						alertFields = $tw.utils.extend({},tiddler.fields);
				}
			});
			if(alertFields) {
				existingCount = alertFields.count || 1;
			} else {
				alertFields = {
					title: $tw.wiki.generateNewTitle("$:/temp/alerts/alert",{prefix: ""}),
					text: text,
					tags: [ALERT_TAG],
					component: this.componentName
				};
				existingCount = 0;
			}
			alertFields.modified = new Date();
			if(++existingCount > 1) {
				alertFields.count = existingCount;
			} else {
				alertFields.count = undefined;
			}
			$tw.wiki.addTiddler(new $tw.Tiddler(alertFields));
			// Log the alert as well
			this.log.apply(this,Array.prototype.slice.call(arguments,0));
		} else {
			// Print an orange message to the console if not in the browser
			console.error("\x1b[1;33m" + text + "\x1b[0m");
		}		
	}
};

exports.Logger = Logger;

})();
