//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

const ORCTdice = (function () {
	
	const obsconfig = {childList: true, subtree: true,};
	const players = {};
	const player_trays = [];
	let lognode = {};
	let om = {};
	let yourdice = '';
	let dicetimer = 0;
	let dicetracker;
	
		
	
	const obNeedles = {
		dice_result_parent_css: 'css-zkfaav',
		dice_result_icon_css: 'css-z54kij',
		dice_result_p_css: 'css-lr82js',
		dice_results_nodes_css: 'css-l3rx45',
	}
	
	
	let playerDiceChanged = function (changeList, observer) {
		const guid = om.getRandomID();
		for (const change of changeList) {
			if ((change.type === 'childList') && (change.addedNodes.length)) {
				checkDice(change.addedNodes, guid);
			}
		}
		outputDice(guid);
	}
	
	let yourDiceChanged = function (changeList, observer) {
		for (const change of changeList) {
			if (change.type === 'characterData') {
				dicetimer = om.getTimeInt();
				monitorPlayer();
			}
			if (change.type === 'childList') {
				if (change.addedNodes.length) {
					dicetimer = om.getTimeInt();
					monitorPlayer();
					if (!yourdice) yourdice = om.getRandomID();
				}
				checkDice(change.addedNodes, yourdice);
			}
		}
	}
	
	
	let checkPlayers = function (changeList, observer) {
		for (const c in changeList) {
			const change = changeList[c];
			if (change.addedNodes.length) {
				if (change.addedNodes[0].children[0]) {
					od.outputLog(getPlayerName(change.addedNodes[0]) + ' joins');
					checkTray(change.addedNodes[0]);
					const observer = new MutationObserver(playerDiceChanged);
					observer.observe(change.addedNodes[0], obsconfig);
				}
			}
			if (change.removedNodes.length)  {
				if (change.removedNodes[0].children[0]) {
					od.outputLog(getPlayerName(change.removedNodes[0]) + ' leaves');
					delete player_trays[getPlayerName(change.removedNodes[0])];
				}
			}
		}
	}
	
	let checkPreexistingPlayers = function (node) {
		for (const player of node.children) {
			if (getPlayerName(player).includes('(you)')) {
				const yourconfig = {childList: true, subtree: true, characterData: true,};
				const yourobserver = new MutationObserver(yourDiceChanged);
					yourobserver.observe(player, yourconfig);
			} else {
				const observer = new MutationObserver(playerDiceChanged);
				if (player.parentElement.className=='simplebar-content')
					observer.observe(player, obsconfig);
			}
		}
	}
	
	let checkDice = function (nodes,guid) {
		for (const node of nodes) {
			if (node.className == obNeedles.dice_result_p_css) {
				checkRolls(node, guid);
				continue;
			}
			if (node.firstElementChild) {
				if (node.firstElementChild.className == obNeedles.dice_result_parent_css) {
					const nodes = node.getElementsByClassName(obNeedles.dice_result_p_css);
					for (const diceval of nodes) {
						checkRolls(diceval, guid);
					}
					checkTray(node);
					continue;
				}
			}
			const nodes = node.getElementsByClassName(obNeedles.dice_result_p_css);
			for (const diceval of nodes) {
				checkRolls(diceval, guid);
			}
		}
	}
	
	let monitorPlayer = function () {
		const curtime = om.getTimeInt();
		const trayarea = document.querySelector("div.css-q2g4a8");
		const hidebutton = document.querySelector("button.css-ww5hk0-IconButton");
		const resetbutton = document.querySelector("button.css-1frvkv-IconButton");
		if ((curtime-dicetimer)>2000) {
			dicetimer = 0;
			if (resetbutton) {
				trayarea.style.pointerEvents = 'auto';
				hidebutton.style.pointerEvents = 'auto';
				resetbutton.style.pointerEvents = 'auto';
			}
			dicetracker = clearInterval(dicetracker);
			outputDice(yourdice);
			yourdice = '';
			return;
		}
		if (!dicetracker) {
			dicetracker = setInterval(monitorPlayer, 1000);
			trayarea.style.pointerEvents = 'none';
			if (resetbutton) {
				hidebutton.style.pointerEvents = 'none';
				resetbutton.style.pointerEvents = 'none';
			}
		}
	}
	
	let checkRolls = function (p, guid) {
		if (p.tagName == 'P') {
			const roll = p.textContent;
			const div = p.parentElement.firstElementChild;
			if (div.className != 'css-1to936t') return;
			const icon = div.firstElementChild.children[1].getAttribute('d');
			const dice = getDice(icon);
			const name = p.parentElement.parentElement.parentElement.parentElement.firstElementChild.textContent;
			if (name && icon && roll) {
				if (!players[guid]) {
					players[guid] = { [name] : { [dice] : { icon, rolls: [p]} } }; 
				} else if (!players[guid][name]) {
					players[guid][name] = { [dice] : { icon, rolls: [p]} };
				} else if (!players[guid][name][dice]) {
					players[guid][name][dice] = { icon, rolls: [p]};
				} else {
					if (players[guid][name][dice].rolls[players[guid][name][dice].rolls.length-1]!=p)
					players[guid][name][dice].rolls.push(p);
				}
			} else {
				
			}
		}
	}
	
	let checkTray = function (player) {
		const icon = player.getElementsByTagName('button');
		if (icon[0]) {
			if (icon[0].title == 'Show Rolls') {
				icon[0].click();
				const pname = getPlayerName(player);
				if (player_trays[pname]) od.outputLog(pname+' tempts fate');
				else {
					player_trays[pname] = true;
					player.setAttribute('belongs',pname);
				}
			}
		}
	}
	
	let getDice = function (d) {
		switch (d.length) {
			case 1367: return 20;
			case 1080: return 12;
			case 1077: return 10;
			case 1104: return 8;
			case 832: return 6;
			case 262: return 4;
			case 1730: return 100;
			default: return 0;
		}
	}
	
	let getPlayerName = function (node) {
		if (node.parentElement) {
			if (node.parentElement.className == 'simplebar-content') {
				if (node.children) return node.children[0].innerText;
			} else if (node.parentElement.parentElement.className == 'simplebar-content') {
				return node.parentElement.children[0].innerText;
			}
		} else if (node.children) {
			return node.children[0].innerText;
		} else return '';
	}
	
	let getIconFromParent = function (node) {
		const diceico = node.parentElement;
		if (diceico) {
			const svgpath = diceico.firstElementChild.children[0].children[1];
			return svgpath;
		} else {
			return false;
		}
	}
	
	let outputDice = function (guid) {
		for (let name in players[guid]) {
			const d = players[guid][name];
			let yourroll = false;
			let verb = ' rolls ';
			if (name.includes('(you)')) {
				name = 'You';
				verb = ' roll ';
				yourroll = true;
			}
			let txt = '';
			let res = 0;
			let dtx = '';
			let svg = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentcolor"';
			for (const dice in d) {
				const r = d[dice];
				let dicetext = [];
				let diceicon = r.icon;
				let dicenum = 0;
				for (const roll in r.rolls) {
					const rval = r.rolls[roll].innerText;
					dicenum++;
					res += Number(rval);
					dicetext.push(rval);
				}
				dtx += ' <svg '+svg+'><path d="'+diceicon+'"></svg> '+dicetext.join(' ');
				txt += ' ' + dicenum + 'd'+dice+' ('+dicetext.join(' ')+')';
			}
			const maintxt = name + verb +res;
			const titletxt = txt;
			const dicetxt = '<div class="dice">'+res + ' :' + dtx+'</div>';
			od.outputLog(maintxt + dicetxt, titletxt);
			if (!yourroll) om.Sound.play();
		}
		delete players[guid];
	}
	
	let scrollTracker = function(event) {
		od.node.scrollTop = od.node.scrollTop + event.deltaY;
	}
	
	
let od = {
	
	id: 'dice',
	node: {},
	
	t: function () {return players},
		
	launch: function () {
		this.node.innerHTML = '<div></div><div class="dicelog"></div><div></div>';
		lognode = this.node.getElementsByClassName('dicelog')[0];
		om = ORCT;
		
		const sidebar = document.getElementsByClassName('simplebar-content')[0];
		const trayswitch = document.querySelector("button.css-ww5hk0-IconButton");
		const dicebar = document.getElementsByClassName('css-phv10r')[0];
		const dicetray = document.getElementsByTagName('canvas')[0];
		const sheet = window.document.styleSheets[0];
		
		if (sidebar) {
			checkPreexistingPlayers(sidebar);
			const barconfig = {childList: true, };
			const barobserver = new MutationObserver(checkPlayers);
			barobserver.observe(sidebar, barconfig);
		}
		
		if (dicebar) {
			dicebar.onclick = function () {
				if (dicebar.children[12].getAttribute('aria-label')=='Share Dice Rolls') {
					dicebar.children[12].click();
				}
			};
			dicebar.lastElementChild.style.display = 'none';
			const newbutton = document.createElement('button');
			newbutton.innerHTML = dicebar.lastElementChild.innerHTML;
			newbutton.className = "css-4y7911-IconButton";
			newbutton.style.color = "gray";
			newbutton.title = "Sharing can't be switched off";
			dicebar.appendChild(newbutton);
		}
		
		if (dicetray) {
			dicetray.onclick = function () {
				const trayclose = document.getElementsByClassName('css-ww5hk0-IconButton')[0];
				if (trayclose) {
					if (trayclose.title=='Hide Dice Tray') {
						trayclose.click();
					}
				}
			};
		}
		
		if (trayswitch) {
			trayswitch.addEventListener( 'click', function () {
				if (!yourdice) {
					const trayclose = document.getElementsByClassName('css-ww5hk0-IconButton')[0];
					const dicereset = document.getElementsByClassName('css-1frvkv-IconButton')[0];
					if (trayclose.title != 'Show Dice Tray') return;
					if (dicereset) dicereset.click();
				}
			});
		}
		
		this.node.onwheel = scrollTracker;
		const ruletohidereroll = '{ visibility: hidden;cursor:default!important; }';
		sheet.insertRule('.css-cn6g20-IconButton, .css-cn6g20-IconButton:hover '+ruletohidereroll, sheet.cssRules.length);
		
		od.outputLog('Session started');
	},
	
	outputLog: function (txt, title) {
		if (!title) title = txt;
		const stamp = om.getTimeStamp()
		lognode.innerHTML += 
			'<div class="entry" title="'+title+'">'+
				'<div>'+ stamp + '</div><div>' + txt + '</div>'+
			'</div>';
	},
		
};

return od;

}) ();
