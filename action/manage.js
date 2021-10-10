//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

let runtime = {};

if (typeof browser !== 'undefined') runtime = browser.runtime;
else runtime = chrome.runtime;

runtime.sendMessage({method: "getStorage"}, function(result) {
	
	let tab = {};
	let pag = {};
	let sdiv = '';
	let ttab = '';
	let ttab_url = '';
	let saved = false;
	let save = document.getElementById('save');
	let title = document.getElementById('title');
	let s_cont = document.getElementById('sessions').lastElementChild;

	let c_combt = document.getElementById('enable_combat');
	let c_dicet = document.getElementById('enable_dice');
	let c_sound = document.getElementById('enable_sound');
	let c_fullscreen = document.getElementById('enable_fs');

	const siteq = /https:\/\/([\w.]*)owlbear\.rodeo([\w\/.]*)/;
	const pageq = /https:\/\/([\w.]*)owlbear\.rodeo\/game\/([\w\/.]*)/;

	const texts = {
		select_modules_and_start: "Select tracker modules and start or join the existing game",
		select_modules_and_goto: "Select tracker modules and proceed to Owlbear Rodeo to start",
		select_modules_and_reload:"Select tracker modules and reload the game",
		goto_owlbear_tab: "Switch to Owlbear",
		open_owlbear_page:"Open Owlbear",
		change_selection: "Change selection",
		save_settings: "Save settings",
		saved_settings: "Saved!",
		reload_to_apply: "Reload page to apply settings",
	}
	
	const week = [
		'Sun',
		'Mon',
		'Tue',
		'Wed',
		'Thu',
		'Fri',
		'Sat',
		'yesterday',
		'today',
		'now! › ',
	]

	const month = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	]
	
	const switcher = document.getElementById('switcher');
	const sessions_button = document.getElementById('sessions_button');
	const settings_button = document.getElementById('settings_button');

	sessions_button.addEventListener('click', function () {
		document.getElementById('settings').style.height = '0px';
		document.getElementById('sessions').style.height = '130px';
		//switcher.appendChild(sessions_button);
	});

	settings_button.addEventListener('click', function () {
		document.getElementById('settings').style.height = '130px';
		document.getElementById('sessions').style.height = '0px';
		//switcher.appendChild(settings_button);
	});

	
	
	let s = result.settings;
	let l = result.sessions;
		
	if (s.combat) c_combt.checked = true;
	if (s.dice) c_dicet.checked = true;
	if (s.sound) c_sound.checked = true;
	if (s.fs) c_fullscreen.checked = true;

	c_combt.addEventListener('click', resetAction);
	c_dicet.addEventListener('click', resetAction);
	c_sound.addEventListener('click', resetAction);
	c_fullscreen.addEventListener('click', resetAction);
	
	const manifestData = chrome.runtime.getManifest();
	const subtitle = document.getElementById('header').children[2];
	subtitle.textContent = 'Combat tracker v'+manifestData.version+'.'+manifestData.manifest_version;
	
	function getRelatedDay (date) {
		const today = new Date();
		const thatday = new Date(date);
		const yesterday = new Date();
		yesterday.setDate(today.getDate()-1);
		if ((today.getDate() == thatday.getDate()) && (today.getMonth() == thatday.getMonth())) return 8;
		if ((yesterday.getDate() == thatday.getDate()) && (yesterday.getMonth() == thatday.getMonth())) return 7;
		return thatday.getDay();
	}
	
	function showSessions () {
		
		if (Object.keys(l).length<=4) {
			s_cont.innerHTML = '';
			for (const e in l) {
				const th_url = l[e].url;
				const th_tst = l[e].timestamp;
				const th_dte = new Date(th_tst);
				const th_now = new Date();
				
				const day = ( th_dte.getDate() >9 ? '' : '0' ) + th_dte.getDate();
				const hr = ( th_dte.getHours() >9 ? '' : '0' ) + th_dte.getHours();
				const min = ( th_dte.getMinutes() >9 ? '' : '0' ) + th_dte.getMinutes();
				
				let mon = th_dte.getMonth();
				let wday = getRelatedDay(th_dte);
				if (ttab_url == th_url) wday = 9;
				
				const textday = month[mon] + ' ' + day + ' (' + week[wday] + ') ';
				
				const record = document.createElement('div');
				record.setAttribute('title','Session ID: '+l[e].guid);
				record.textContent = textday + hr + ':' + min;
				s_cont.appendChild(record);
				
				record.onclick = function () {
					chrome.tabs.create({url: th_url});
					window.close();
				};
				if (wday == 9) record.onclick = function () {
					chrome.tabs.update(ttab, {active: true});
					window.close();
				};
			}
		}
		
	}
	

	function setAction() {
		
		if (!pag.siteq) {
			
			title.textContent = texts.select_modules_and_goto;
			if (ttab) {
				save.textContent = texts.goto_owlbear_tab;
				save.disabled = false;
				save.onclick = function () {
					chrome.tabs.update(ttab, {active: true});
					window.close();
				}
			} else {
				save.textContent = texts.open_owlbear_page;
				save.disabled = false;
				save.onclick = function () {
					chrome.tabs.create({url:'https://www.owlbear.rodeo/'});
					window.close();
				}
			}
			
		} else {
			
			if (!pag.pageq) {
				title.textContent = texts.select_modules_and_start;
				save.disabled = true;
				if (saved) {
					save.textContent = texts.saved_settings;
				} else {
					save.textContent = texts.save_settings;
				}
			} else {
				title.textContent = texts.select_modules_and_reload;
				if (saved) {
					save.textContent = texts.reload_to_apply;
					save.onclick = function () {
						chrome.tabs.reload(tab.id);
						window.close();
					}
				} else {
					save.textContent = texts.save_settings;
					save.disabled = true;
				}
			}
		}
	}

	function resetAction() {
		save.textContent = texts.save_settings;
		saved = false;
		save.disabled = false;
		save.onclick = function () {
			runtime.sendMessage({
				method:'setSettings',
				settings:{
					combat: (c_combt.checked == true),
					dice: (c_dicet.checked == true),
					sound: (c_sound.checked == true),
					fs: (c_fullscreen.checked == true),
				}
			});
			saved = true;
			setAction();
		};

	}
	
	
	chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
		
		tab = tabs[0];
		if (tab.url.match(siteq) == null) {
			pag.siteq = false;
			save.textContent = 'You need to open Owlbear';
			chrome.tabs.query({active: false, currentWindow: true},function(tabs) {
				for (var t in tabs) {
					if (tabs[t].url.match(siteq) != null) {
						ttab = tabs[t].id;
						ttab_url = tabs[t].url;
						break;
					}
				}
				setAction();
				showSessions();
			});
		} else {
			pag.siteq = true;
			if (tab.url.match(pageq) != null) {
				pag.pageq = true;
				ttab_url = tab.url;
			}
			setAction();
			showSessions();
		}
		
	});

})