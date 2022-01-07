//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

let runtime;
let getLocaleText;

if (typeof browser !== 'undefined') {
	runtime = browser.runtime;
	getLocaleText = browser.i18n.getMessage;
} else {
	runtime = chrome.runtime;
	getLocaleText = chrome.i18n.getMessage;
}

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
	
	
	const switcher = document.getElementById('switcher');
	const sessions_button = document.getElementById('sessions_button');
	const settings_button = document.getElementById('settings_button');

	sessions_button.addEventListener('click', function () {
		document.getElementById('settings').style.height = '0px';
		document.getElementById('sessions').style.height = '130px';
	});

	settings_button.addEventListener('click', function () {
		document.getElementById('settings').style.height = '130px';
		document.getElementById('sessions').style.height = '0px';
	});

	
	
	let s = result.settings;
	let l = result.sessions;
		
	if (s.combat) c_combt.checked = true;
	if (s.dice) c_dicet.checked = true;
	if (s.sound) c_sound.checked = true;
	if (s.fs) c_fullscreen.checked = true;
	
	if (isMobile()) document.body.style.margin = 'auto';

	c_combt.addEventListener('click', resetAction);
	c_dicet.addEventListener('click', resetAction);
	c_sound.addEventListener('click', resetAction);
	c_fullscreen.addEventListener('click', resetAction);
	
	localize(document.body);
	document.body.style.display = 'inherit';
	
	const manifestData = chrome.runtime.getManifest();
	const subtitle = document.getElementById('header').children[2];
	const manifest = document.createElement('span');
	manifest.innerText = ' ('+manifestData.manifest_version+')';
	manifest.className = 'manifest';
	subtitle.textContent += ' v'+manifestData.version;
	subtitle.appendChild(manifest);
	
	function isMobile () {
		if ("userAgentData" in navigator) {
			return navigator.userAgentData.mobile;
		} else {
			return navigator.userAgent.match('Mobile');
		}
	}
	
	function localize (parentnode) {
		for (const node of parentnode.children) {
			if (node.children.length) {
				localize(node);
			} else {
				if (!node.innerText) continue;
				const check_node = node.innerText.match(/__MSG_([\w_]*)__/);
				if (check_node) {
					node.innerText = getLocaleText(check_node[1]);
				}
			}
		}
	}
	
	function getRelatedDay (date) {
		const today = new Date();
		const thatday = new Date(date);
		const yesterday = new Date();
		yesterday.setDate(today.getDate()-1);
		if ((today.getDate() == thatday.getDate()) && 
			(today.getMonth() == thatday.getMonth()) ) 
			return getLocaleText('date_today');
		if ((yesterday.getDate() == thatday.getDate()) && 
			(yesterday.getMonth() == thatday.getMonth())) 
			return getLocaleText('date_yesterday');
		return thatday.toLocaleString('default', { weekday: 'short' });;
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
				
				let mon = th_dte.toLocaleString('default', { month: 'short' });
				let wday = getRelatedDay(th_dte);
				if (ttab_url == th_url) wday = getLocaleText('date_now');
				
				const textday = getLocaleText('popup_sessions_date',[day,mon]) + ' (' + wday + ') ';
				
				const record = document.createElement('div');
				record.setAttribute('title','Session ID: '+l[e].guid);
				record.textContent = textday + hr + ':' + min;
				s_cont.appendChild(record);
				
				record.onclick = function () {
					chrome.tabs.create({url: th_url});
					window.close();
				};
				if (ttab_url == th_url) record.onclick = function () {
					if (ttab)
						chrome.tabs.update(ttab, {active: true});
					window.close();
				};
			}
		}
		
	}
	

	function setAction() {
		
		if (!pag.siteq) {
			
			title.textContent = getLocaleText('select_modules_and_goto');
			if (ttab) {
				save.textContent = getLocaleText('goto_owlbear_tab');
				save.disabled = false;
				save.onclick = function () {
					chrome.tabs.update(ttab, {active: true});
					window.close();
				}
			} else {
				save.textContent = getLocaleText('open_owlbear_page');
				save.disabled = false;
				save.onclick = function () {
					chrome.tabs.create({url:'https://www.owlbear.rodeo/'});
					window.close();
				}
			}
			
		} else {
			
			if (!pag.pageq) {
				title.textContent = getLocaleText('select_modules_and_start');
				save.disabled = true;
				if (saved) {
					save.textContent = getLocaleText('saved_settings');
				} else {
					save.textContent = getLocaleText('save_settings');
				}
			} else {
				title.textContent = getLocaleText('select_modules_and_reload');
				if (saved) {
					save.textContent = getLocaleText('reload_to_apply');
					save.onclick = function () {
						chrome.tabs.reload(tab.id);
						window.close();
					}
				} else {
					save.textContent = getLocaleText('save_settings');
					save.disabled = true;
				}
			}
		}
	}

	function resetAction() {
		save.textContent = getLocaleText('save_settings');
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