//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

let runtime = {};
let settings = {};

if (typeof browser !== 'undefined') runtime = browser.runtime;
else runtime = chrome.runtime;

runtime.sendMessage({method: "getSettings"}, function(response) {
	
	const docbody = document.body;
	const dochead = document.getElementsByTagName("head")[0];
	settings = response;
	docbody.setAttribute("settings",JSON.stringify(response));
	docbody.setAttribute("obrtpath",runtime.getURL('/'));
	
	if (settings.combat || settings.dice) {
		var maincss = document.createElement("link");
		var scriptmain = document.createElement("script");
		
		scriptmain.setAttribute("type", "text/javascript");
		scriptmain.src = runtime.getURL('/injected/orctmain.js');
		
		maincss.setAttribute("rel", "stylesheet");
		maincss.setAttribute("href", runtime.getURL('/injected/style.css'));
		dochead.appendChild(maincss);
		dochead.appendChild(scriptmain);

		docbody.setAttribute("onLoad", "ORCT.init();");
	}

	if (settings.combat) {
		var scriptcomb = document.createElement("script");
		var scriptlzsc = document.createElement("script");

		scriptcomb.setAttribute("type", "text/javascript");
		scriptlzsc.setAttribute("type", "text/javascript");

		scriptcomb.src = runtime.getURL('/injected/ctracker.js');
		scriptlzsc.src = runtime.getURL('/injected/lz-string.js');

		dochead.appendChild(scriptcomb);
		dochead.appendChild(scriptlzsc);
	}
	
	if (settings.dice) {
		var scriptcomb = document.createElement("script");
		scriptcomb.setAttribute("type", "text/javascript");
		scriptcomb.src = runtime.getURL('/injected/dtracker.js');
		dochead.appendChild(scriptcomb);
	}
	
	if (settings.sound) {
		var dicesound = document.createElement("audio");
		var traysound = document.createElement("audio");
		var teamsound = document.createElement("audio");
		dicesound.setAttribute('id','dicesound');
		traysound.setAttribute('id','traysound');
		teamsound.setAttribute('id','teamsound');
		dicesound.src = runtime.getURL('/audio/dice_own.mp3');
		traysound.src = runtime.getURL('/audio/tray_own.mp3');
		teamsound.src = runtime.getURL('/audio/dice_party.mp3');
		docbody.appendChild(dicesound);
		docbody.appendChild(traysound);
		docbody.appendChild(teamsound);
		
		var makeItSound = function () {
			let cls1 = 'css-dlaunn-IconButton';
			let cls2 = 'css-cn6g20-IconButton';
			let dice = document.getElementsByClassName(cls1);
			let reroll = document.getElementsByClassName(cls2);
			if (dice.length != 7) return;
			for (var d=0; d<7; d++) {
				dice[d].addEventListener( 'click', function () {
					dicesound.play();
				})
			}
			if (!settings.dice) {
				if (reroll.length == 1) { // reroll button only appears on roll :(
					reroll[0].addEventListener( 'click', function () {
						traysound.play();
					})
				}
			}
			docbody.removeEventListener( 'click', makeItSound );
		}
		docbody.addEventListener( 'click', makeItSound );
	}
	
});
