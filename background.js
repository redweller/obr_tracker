//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

let runtime = {};

if (typeof browser !== 'undefined') runtime = browser.runtime;
else runtime = chrome.runtime;

if (typeof importScripts !== 'undefined') importScripts('./action/storage.js');

chrome.tabs.onActivated.addListener(checkCurrentTab);
chrome.tabs.onUpdated.addListener(checkCurrentTab);

runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.method == "getSettings")
		sendResponse(storage.settings);
	else if (request.method == "getStorage")
		sendResponse(storage);
	else if (request.method == "setSettings")
		storage.set(request.settings);
	else
		sendResponse({});
});


function processSessions(url) {
	const gameq = /https:\/\/[\w.]*owlbear\.rodeo\/game\/([\w\/\-.]*)/;
	const guidq = url.match(gameq);
	if (!guidq) return;
	if (guidq.length == 2) {
		const now = new Date();
		const guid = guidq[1];
		storage.log(now,guid,url);
	}
}


function checkCurrentTab() {
	let action = {};
	if (typeof chrome.browserAction !== 'undefined') action = chrome.browserAction;
	else action = chrome.action;
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (tabs[0]) {
			if (tabs[0].url.match(/https:\/\/([\w.]*)owlbear\.rodeo([\w\/.]*)/) != null) {
				action.setPopup({popup: '/action/popup.html'});
				action.setIcon({path: {
					"16": "/images/combat16.png",
					"32": "/images/combat32.png",
					"48": "/images/combat48.png",
					"128": "/images/combat128.png"
				}});
				processSessions(tabs[0].url);
				return;
			}
		}
		action.setPopup({popup: '/action/popup.html'});
		action.setIcon({path: {
			"16": "/images/off16.png",
			"32": "/images/off32.png",
			"48": "/images/off48.png",
			"128": "/images/off128.png"
		}});
	});
}

checkCurrentTab();