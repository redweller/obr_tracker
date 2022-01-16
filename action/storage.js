//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

const storage =  (function () {
	
	let s = {};
	const sessions = {};
	const settings = {
		combat: (true),
		dice: (true),
		sound: (true),
		fs: (false),
		rt: (false),
	};
	
	
	const safeJSONParse = function (str) {
		try {
			str = JSON.parse(str);
		} catch (e) {
			return {};
		}
		return str;
	}
	
	const checkSettingsOnInit = function (set) {
		settings.combat = set.combat || false ;
		settings.dice = set.dice || false ;
		settings.sound = set.sound || false ;
		settings.fs = set.fs || false ;
		settings.rt = set.rt || false ;
	}
	
	const processSessionsLog = function (time, guid, url) {
		let i = 0;
		let sessionlist = [];
		const timestamp = Number(time);
		for (const s in sessions) {
			if (typeof sessions[s] === 'undefined') delete sessions[s];
			else if (sessions[s].guid == guid) delete sessions[s];
			else i++;
		}
		const entry = { guid, timestamp, url };
		Object.keys(sessions).map(function (key) {if (i>3) delete sessions[key]; i--});
		Object.keys(sessions).map(function (key) {sessionlist[Number(key)] = sessions[key]});
		sessionlist[100000000000000 - timestamp] = entry;
		Object.assign(sessions, sessionlist);
	}
	
	
	
	const initChrome = function () {
		chrome.storage.local.get(['settings'], function(response) {
			const result = response.settings;
			if (result) {
				checkSettingsOnInit(result);
			} else {
				chrome.storage.local.set({settings});
			}
		});
		chrome.storage.local.get(['sessions'], function(response) {
			const result = response.sessions;
			if (!result) return;
			if (Object.keys(result).length<=4) {
				Object.keys(result).map(function (key) {sessions[key] = result[key]});
			}
		});
	}
	
	const setChrome = function (obj) {
		chrome.storage.local.set({settings: obj});
		Object.keys(settings).map(function (key) {settings[key] = obj[key]});
	}
	
	const logChrome = function (time, guid, url) {
		processSessionsLog (time, guid, url);
		chrome.storage.local.set({sessions});
	}
	
	
	const initLocal = function () {
		if (localStorage.settings) {
			const sobj = safeJSONParse(localStorage.settings);
			checkSettingsOnInit(sobj);
		}
		if (localStorage.sessions) {
			const lobj = safeJSONParse(localStorage.sessions);
			if (Object.keys(lobj).length<=4) {
				Object.keys(lobj).map(function (key) {sessions[key] = lobj[key]});
			}
		}
	}
	
	const setLocal = function (obj) {
		localStorage.setItem('settings',JSON.stringify(obj));
		Object.keys(settings).map(function (key) {settings[key] = obj[key]});
	}
	
	const logLocal = function (time, guid, url) {
		processSessionsLog (time, guid, url);
		localStorage.setItem('sessions',JSON.stringify(sessions));
	}
	
	
	if (typeof localStorage !== 'undefined') {
		s = {
			set: setLocal,
			log: logLocal,
			init: initLocal,
			settings,
			sessions,
		};
	} else {
		s = {
			set: setChrome,
			log: logChrome,
			init: initChrome,
			settings,
			sessions,
		};
	}
	
	s.init();
	
	return s;
	
}) ()