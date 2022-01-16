//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

const ORCTcombat = (function () {
	
	let	master = true;
	let locked = false;
	let guid = false;
	let	combat = {};
	let	turns = {};
	let om = {};
	let trackernodes = {};
	let tracker;
	let processTracker;
	let	container;
	let combatants;
	let curturn;
	let mapGUID;
	let notelength;


	function refreshState() {
		refreshTracker();
		if (master && Object.keys(combat).length) sendPackage();
	}

	function haltState() {
		if (processTracker) processTracker = clearInterval(processTracker);
		else processTracker = 'hang';
	}

	function resumeState() {
		if (!processTracker) refreshTracker();
		if (processTracker=='hang') processTracker = false;
	}

	function refreshTracker() {
		
		let list = '';
		let need_container = '';
		combatants = [];
		receivePackage();
		
		for (var shp in Konva.shapes) {
			const entity = Konva.shapes[shp];
			if (entity._partialText) {
				if (entity.parent.parent.parent.parent.attrs['name'] == 'character') {
					var id = entity.parent.parent.parent.parent.attrs.id.slice(0,8);
					window.NEW = entity.parent.parent.parent.parent
					var combatant = {
						id: id,
						salt: entity.parent.parent.parent.parent._id,
						name: entity._partialText,
						color: entity.parent.parent.parent.children[0].children[0].attrs.stroke,
						health: '-', 
						init: 0,
						status: '',
						inactive: 'inactive',
						turn: '',
					};
					if (combat[id]) {
						let cstat = combat[id];
						if (cstat.hp) {
							if (!master) combatant.health = 'DMG -' + (cstat.dmg*1);
							else combatant.health = (cstat.hp-cstat.dmg) + ' / ' + cstat.hp;
							combatant.status = getHealthStatus(cstat);
						} else if (cstat.dmg) {
							combatant.health = 'DMG -' + (cstat.dmg*1);
							combatant.status = 2;
						}
						combatant.init = combat[id].init;
						if (combatant.init != '')
							combatant.inactive = '';
					}
					combatant.sort = (combatant.init*1000)+(combatant.salt);
					combatants[combatant.sort] = combatant;
				} else {
					if (Konva.shapes[shp].attrs.text[0] == '!') 
						need_container = shp;
				}
			} else if (entity._id == 2) {
				if (!entity.attrs.image) continue;
				const src = entity.attrs.image.currentSrc;
				if (mapGUID) {
					if (mapGUID != src) {
						mapGUID = src;
						combat = {};
						combatants = [];
						turns = {};
						notelength = 10;
					}
				} else {
					mapGUID = src;
				}
			};
		}
		
		container = need_container;
		
		for (var c in combatants) {
			if (combatants[c].id == turns.active) combatants[c].turn = 'my_turn';
			list = outputCombat(c) + list;
		}
		
		if ((turns) && (turns.currentRound != curturn)) {
			if (typeof ORCTdice !== 'undefined') {
				if (turns.currentRound) {
					ORCTdice.outputLog('Combat round '+turns.currentRound);
				} else {
					ORCTdice.outputLog('Combat ended');
				}
				curturn = turns.currentRound;
			}
		}
		
		trackernodes.topmenu.innerHTML = '';
		trackernodes.main.innerHTML = '<div class="trackervals">'+list+'</div>';
		trackernodes.botmenu.innerHTML = manageTurns();
		
		applyColor();
		
		if (!processTracker) processTracker = setInterval(refreshTracker, 3000);
	}


	function sendPackage() {
		const transport = Konva.shapes[container];
		const cmbtr = {};
		if (!transport) return;
		for (const c in combat) {
			cmbtr[c] = [];
			for (const prop in combat[c]) {
				cmbtr[c].push(combat[c][prop]);
			}
		}
		const pckg = JSON.stringify({
			guid,
			turns,
			cmbtr,
		});
		const packed = LZString.compressToBase64(pckg);
		const wrapped = '!|' + packed + '|';
		notelength = wrapped.length;
		if (wrapped.length>1024) {
			console.log('Note character limit reached');
			return;
		}
		const curtext = transport.attrs.text;
		if (wrapped != curtext) {
			const noteobj = Konva.shapes[container].parent;
			const callForDialog = noteobj.eventListeners.click[0].handler;
			const evtobj = {
				currentTarget: noteobj, 
				target: Konva.shapes[container], 
				pointerId: 999, 
				evt: { isTrusted: true }
			};
			callForDialog(evtobj);
			const delivery = document.getElementById('changeNoteText');
			if (!delivery) return;
			if (delivery.value[0] != '!') return;
			delivery.parentElement.parentElement.style.display = 'none';
			if (delivery) {
				let changeNote = {}
				delivery.value = wrapped;
				for (const prop in delivery) { 
					if (prop.includes('__reactProps')) changeNote = delivery[prop]; 
				}
				changeNote.onChange({target: delivery});
			}
		}
	}

	function receivePackage() {
		if (container) {
			let delivery = Konva.shapes[container];
			if (delivery) {
				var handin = delivery.attrs.text;
				var unwrap = handin.split('|');
				if (!master || !notelength) notelength = handin.length;
				if ((unwrap.length==3) && (unwrap[0]=='!')) {
					var pckg = om.safeJSONParse(LZString.decompressFromBase64(unwrap[1]));
					if (pckg) {
						if (pckg.guid) {
							if (pckg.cmbtr) {
								pckg.combat = {};
								for (const c in pckg.cmbtr) {
									const itm = pckg.cmbtr[c];
									pckg.combat[c] = {
										init: itm[0],
										hp: itm[1],
										dmg: itm[2],
										eff1: itm[3],
										eff2: itm[4],
										eff3: itm[5],
										dur1: itm[6],
										dur2: itm[7],
										dur3: itm[8],
									}
								}
							}
							if (pckg.guid != guid) {
								combat = pckg.combat;
								turns = pckg.turns;
								master = false;
							} else {
								if (!Object.keys(combat).length) {
									combat = pckg.combat;
									turns = pckg.turns;
								}
								master = true;
							}
							locked = true;
							return;
						}
					}
				}
			}
		}
		locked = false;
	}

	function switchMapOwner(ismaster) {
		if (!locked) {
			master = (ismaster ? true : false ) ;
		}
		refreshTracker();
	}


		
	function setValues(id) {
		var old_state = combat[id] ;
		var init = document.getElementById('ct_init').value;
		combat[id] = {
			init: (isNaN(init)?'':init),
			hp: document.getElementById('ct_hp').value,
			dmg: document.getElementById('ct_dmg').value,
			eff1: document.getElementById('ct_eff1').value,
			eff2: document.getElementById('ct_eff2').value,
			eff3: document.getElementById('ct_eff3').value,
		}
		for (var i=1; i<=3; i++) {
			newdur = document.getElementById('ct_dur'+i).value
			if ((turns.active == id) && (old_state['dur'+i]!=newdur) && (newdur>0)) {
				combat[id]['dur'+i] = 1*newdur + 1;
			} else {
				combat[id]['dur'+i] = newdur;
			}
		}
		refreshState();
	}

	function setInitValues() {
		for (var c in combatants) {
			var l = combatants[c].id;
			if ( om.safeGetValue('ct_init_'+l) || om.safeGetValue('ct_hp_'+l) ) {
				var init = document.getElementById('ct_init_'+l).value;
				var hp = document.getElementById('ct_hp_'+l).value;
				if (combat[l]) {
					combat[l].init = (isNaN(init)?'':init);
					combat[l].hp = (isNaN(hp)?'':hp);
				} else {
					combat[l] = {
						init: (isNaN(init)?'':init),
						hp: (isNaN(hp)?'':hp),
						dmg:'',eff1:'',eff2:'',eff3:'',dur1:'',dur2:'',dur3:''
					}
				}
			}
		}
	}
	
	function saveCtSettings() {
		const check_tab = document.getElementById('cbtab_stats');
		if (!check_tab) return;
		if (check_tab.className == 'hidden') setColorValues();
		else setInitValues();
		refreshState();
	}

	function passEffects() {
		var ch = combat[turns.active];
		for (var i=1; i<=3; i++) {
			if (ch['dur'+i]) {
				ch['dur'+i]--;
				if (ch['dur'+i]<=0) ch['dur'+i]='';
			}
		}
	}


	function nextTurn() {
		if (turns.battle) {
			turns.current++;
			passEffects();
			var curnum = getTurnOrder(turns.current);
			var curchar = combatants[curnum];
			var thisturn = true;
			if (curnum ==0) thisturn = false;
			else if (!curchar) thisturn = false;
			else if (!curchar.init) thisturn = false;
			if (thisturn) {
				turns.active = curchar.id;
			} else {
				turns.active = combatants[getTurnOrder(0)].id;
				turns.currentRound++;
				turns.current = 0;
			}
		} else {
			first = combatants[getTurnOrder(0)];
			if ( first.init ) {
				turns.battle = true;
				turns.active = first.id;
				turns.currentRound = 1;
				turns.current = 0;
			}
		}
		refreshState();
	}


	function prevTurn() {
		if (turns.current>0) {
			turns.current--;
			curchar = combatants[getTurnOrder(turns.current)];
			turns.active = curchar.id;
			refreshTracker();
		}
	}

	function getTurnOrder(t) {
		var i = Object.keys(combatants).length-1;
		if (i < t) return 0;
		for (var c in combatants) {
			if (i<=t) return c;
			i--;
		}
		return c;
	}

	function getHealthStatus(cstat) {
		var st = Math.floor(2 * (cstat.hp-cstat.dmg) / cstat.hp)+1;
		if ( (cstat.hp-cstat.dmg)<=0 ) st = 0;
		return st;
	}

	function getHealthString(hp) {
		switch (hp) {
			case '3': return 'healthy';
			case '2': return 'wounded';
			case '1': return 'bleeding';
			case '0': return 'dying';
			default: break;
		}
	}

	function outputEffects(c) {
		var e = '';
		if (combat[c]) {
			var p = combat[c];
			if (p.dur1) e += '<a title="'+p.eff1+' '+p.dur1+' rounds">'+om.getIcon('physics')+'</a>';
			if (p.dur2) e += '<a title="'+p.eff2+' '+p.dur2+' rounds">'+om.getIcon('potion')+'</a>';
			if (p.dur3) e += '<a title="'+p.eff3+' '+p.dur3+' rounds">'+om.getIcon('magic')+'</a>';
		}
		return e;
	}

	function flushInit(keepInit) {
		if (!keepInit) {
			for (var c in combatants) {
				combatants[c].init = '';
			}
			for (var t in combat) {
				combat[t].init = '';
			}
		}
		turns = {};
		refreshState();
	}
	
	function checkInit() {
		const inits = [];
		const cont = document.querySelector('.cv_settings');
		if (!cont) return;
		for (const itm of cont.children) {
			if (itm.children[1].children[0]) {
				const thisinit = itm.children[1].children[0].value;
				itm.children[1].className = '';
				if (thisinit && !isNaN(thisinit)) {
					if (!inits[thisinit]) {
						inits[thisinit] = [itm.children[1].children[0]];
					} else {
						inits[thisinit].push(itm.children[1].children[0]);
						for (const i in inits[thisinit]) {
							inits[thisinit][i].parentElement.className = 'double';
						}
					}
				}
			}
		}
	}

	
	function switchInfoTabs(el) {
		if (master) {
			if (el.parentElement.id=='cbset_stats') {
				var switch_id = 'cbset_info';
				var mute_id = 'cbtab_info';
				var show_id = 'cbtab_stats';
			} else {
				var switch_id = 'cbset_stats';
				var mute_id = 'cbtab_stats';
				var show_id = 'cbtab_info';
			}
			el.parentElement.classList.remove('off');
			document.getElementById(switch_id).classList.add('off');
			document.getElementById(show_id).classList.remove('hidden');
			document.getElementById(mute_id).classList.add('hidden');
		}
	}
	
	
	function showHelp() {
		let swidth = screen.width;
		let sleft = (swidth - 700) / 2;
		let params = `
			popup=yes,
			scrollbars=no,resizable=no,status=no,
			location=no,toolbar=no,menubar=no,
			width=700,height=700,left=${sleft},top=50
		`;
		window.open(document.body.getAttribute('obrtpath') + 'action/help.html#combat', 'About OBRT', params);
	}

	function outputCombat(ch) {
		var c = combatants[ch];
		var e = outputEffects(c.id);
		return `
		<div class="${c.inactive} ${c.turn}" onClick="ORCTcombat.control.enterValues('${ch}')">
			<div><span style="color:${c.color};font-weight:bolder;">•</span></div>
			<div class="ct_name" title="${c.name}">${c.name}</div>
			<div class="ct_hp ct_hp${c.status}" title="${c.health}"><a class="hp1">♥</a><a class="hp2">♥</a><a class="hp3">♥</a></div>
			<div>
				${e}
			</div>
		</div>
		`;
	}


	function endCombat() {
		if (!master) return;
		processTracker = clearInterval(processTracker);
		document.getElementById('turns').innerHTML = `
		<button class="css-1olwjck-IconButton" style="float:left" onClick="ORCTcombat.control.refreshTracker()" title="Cancel">
			${om.getIcon('cancel')}
		</button> 
		<div class="finishtext">
			<div class="finishbutton ">
				<button class="css-1olwjck-IconButton" onClick="ORCTcombat.control.flushInit()" title="Finish combat and RESET initiative">
					${om.getIcon('save')}
				</button>
				<button class="css-1olwjck-IconButton" style="color:green" onClick="ORCTcombat.control.flushInit('preserve')" title="Finish combat and keep initiative">
					${om.getIcon('save')}
				</button>
			</div>
			<span>End combat and reset INIT?</span>
		</div>
		`;
	}


	function manageTurns() {
		if (turns.battle && master) {
			return `
			<div id="turns" class="turns">
				<span class="move_turn" onclick="ORCTcombat.control.endCombat()" title="Finish combat?">
				Round ${turns.currentRound}
				</span>
				<span class="next_turn" onClick="ORCTcombat.control.nextTurn()" title="Next turn">
					${om.getIcon('next')}
				</span>
				<span class="prev_turn" onClick="ORCTcombat.control.endCombat()" title="Finish combat">
					${om.getIcon('swords')}
				</span>
			</div>
			`;
		} else if (!master) {
			if (turns.currentRound) var currentRound = 'Round '+turns.currentRound + ' ' + om.getIcon('swords');
			else currentRound = 'Not in combat';
			if (locked) var cantset = 'inactive';
			return `
			<div id="turns" class="turns">
				<span class="move_turn">
				${currentRound}
				</span>
				<a class="set_btn ${cantset}" title="Settings" onClick="ORCTcombat.control.showSettings()">${om.getIcon('settings')}</a>
			</div>
			`;
		} else {
			var ctready = '';
			if (!Object.keys(combatants).length) ctready = 'inactive';
			else if (!combatants[getTurnOrder(0)].init) ctready = 'inactive';
			return `
			<div id="turns" class="turns ${ctready}"><span class="move_turn" onClick="ORCTcombat.control.nextTurn()">
				Start
				${om.getIcon('swords')}</span>
				<a class="set_btn" title="Settings" onClick="ORCTcombat.control.showSettings()">${om.getIcon('settings')}</a>
			</div>
			`;
		}
	}


	function enterValues(ch) {
		if (!master) return;
		processTracker = clearInterval(processTracker);
		let name = combatants[ch].name;
		let id = combatants[ch].id;
		if (!combat[id]) vals = {init:'',hp:'',dmg:'',eff1:'',eff2:'',eff3:'',dur1:'',dur2:'',dur3:''};
		else vals = combat[id] ;
		settrack = `
		<div class="cv_title">${name}</div>
		<form onsubmit="ORCTcombat.control.setValues('${id}')" autocomplete="off">
		<input type="submit" style="position: absolute; left: -9999px"/>
		<div class="combatvals">
			<div><div><label for="ct_init">Initiative</label></div><div><input type="text" id="ct_init" size="5" value="${vals.init}"></div></div>
			<div><div><label for="ct_hp">Health</label>/<label for="ct_dmg">dmg</label></div><div>
				<input type="text" id="ct_hp" size="1.5" value="${vals.hp}">
				<input type="text" id="ct_dmg" onClick="this.setSelectionRange(0, this.value.length)"size="1.5" value="${vals.dmg}">
			</div></div>
		</div><div class="cv_effects">
			<div><div>Effects</div><div>Name</div><div>Rounds</div></div>
			<div><div>${om.getIcon('physics')}</div>
				<div><input type="text" id="ct_eff1" size="3" value="${vals.eff1}"></div>
				<div><input type="text" id="ct_dur1" size="1" value="${vals.dur1}"></div>
			</div>
			<div><div>${om.getIcon('potion')}</div>
				<div><input type="text" id="ct_eff2" size="3" value="${vals.eff2}"></div>
				<div><input type="text" id="ct_dur2" size="1" value="${vals.dur2}"></div>
			</div>
			<div><div>${om.getIcon('magic')}</div>
				<div><input type="text" id="ct_eff3" size="3" value="${vals.eff3}"></div>
				<div><input type="text" id="ct_dur3" size="1" value="${vals.dur3}"></div>
			</div>
		</div></form>
		<div class="cv_action">
		<button class="css-1olwjck-IconButton" onClick="ORCTcombat.control.refreshTracker()" title="Cancel">
			${om.getIcon('cancel')}
		</button> 
		<button class="css-1olwjck-IconButton" onClick="ORCTcombat.control.setValues('${id}')" title="Save stats">
			${om.getIcon('save')}
		</button></div>`
		trackernodes.main.innerHTML = settrack;
		trackernodes.topmenu.innerHTML = '';
		trackernodes.botmenu.innerHTML = '';
	}


	function showSettings() {
		processTracker = clearInterval(processTracker);
		var mode1 = (master ? 'checked="true"' : '');
		var mode2 = (!master ? 'checked="true"' : '');
		var hideinfo = (master ? 'hidden' : '');
		var hideinfotab = (master ? ' off' : '');
		var hidestatstab = (!master ? ' off' : '');
		var noteprc = Math.round(100 * notelength / 1024);
		var clientmode = (!master ? 'client' : '');
		var lockedmode = (locked ? 'locked' : '');
		var notecheck_width = '';
		if (!notelength) noteprc = 0;
		if (container && locked) {
			var infotext = 'Combat data sharing is enabled. Please enjoy your game.';
		} else {
			var infotext = 'To share or store your combat data for this map please create a '+
				om.getIcon('note')+' Sticky Note with ! (exclamation mark) in it.';
		}
		if (noteprc) {
			notecheck_width = 'style="width:'+noteprc+'%;"';
			if (noteprc>100) 
				notecheck_width = 'style="width:100%;border-bottom-color: red;"';
		}
		if (notelength > 1024)
			infotext = 'You have exceeded the limit of characters that can be stored. Other players now can\'t see your updates';
		trackernodes.topmenu.innerHTML = `
		<div class="cv_tabs ${clientmode}">
			<div class="gap"></div>
			<div class="cv_tab ${hideinfotab}" id="cbset_info"><div onClick="ORCTcombat.control.switchInfoTabs(this)">Info</div></div>
			<div class="gap"></div>
			<div class="cv_tab ${hidestatstab}" id="cbset_stats"><div onClick="ORCTcombat.control.switchInfoTabs(this)">Stats</div></div>
			<div class="gap"></div>
		</div>`;
		var html = `
		<div id="cbtab_info" class="${clientmode} ${hideinfo} ${lockedmode}">
			<div class="master_check">
				<input type="radio" id="ct_mode1" name="ct_mode" value="master" ${mode1} onClick="ORCTcombat.control.switchMapOwner(true)">
				<label for="ct_mode1">Master</label>
				<input type="radio" id="ct_mode2" name="ct_mode" value="client" ${mode2} onClick="ORCTcombat.control.switchMapOwner(false)">
				<label for="ct_mode2">Client</label>
			</div>
			<div class="info_text">
				${infotext}
			</div>
			<div class="info_helper" title="${noteprc}%">
				<div class="notecheck">
					<div class="notetext">
						Sharing capacity
					</div>
					<div id="note_occupied" ${notecheck_width}>
					</div>
				</div>
				<div id="helpico" onclick="ORCTcombat.control.showHelp()">
					<svg version="1.1" fill="currentcolor" id="Help" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 535.5 535.5" xml:space="preserve">
						<path d="M446.25,0h-357c-28.05,0-51,22.95-51,51v357c0,28.05,22.95,51,51,51h102l76.5,76.5l76.5-76.5h102c28.05,0,51-22.95,51-51
									V51C497.25,22.95,474.3,0,446.25,0z M293.25,408h-51v-51h51V408z M346.8,211.65l-22.95,22.95c-20.399,17.85-30.6,33.15-30.6,71.4
									h-51v-12.75c0-28.05,10.2-53.55,30.6-71.4l30.601-33.15c10.2-7.65,15.3-20.4,15.3-35.7c0-28.05-22.95-51-51-51s-51,22.95-51,51
									h-51c0-56.1,45.9-102,102-102c56.1,0,102,45.9,102,102C369.75,175.95,359.55,196.35,346.8,211.65z"></path>
					</svg>
					<span>Help</span>
				</div>
			</div>
		</div>
		`;
		if (master) {
			html += `<div id="cbtab_stats">
				<form onsubmit="ORCTcombat.control.saveCtSettings()" autocomplete="off">
				<input type="submit" style="position: absolute; left: -9999px"/>
				<div class="cv_settings">
					<div class="header"><div>Name</div><div>Init</div><div>HP</div></div>
			`;
			for (var c in combatants) {
				var l = combatants[c].id;
				html += `<div>
					<div title="${combatants[c].name}">${combatants[c].name}</div>
					<div>
						<input 
							type="text" id="ct_init_${l}" size="1" 
							onkeyup="ORCTcombat.control.checkInit()" 
							value="${(combatants[c].init?combatants[c].init:'')}"
						>
					</div>
					<div>
						<input 
							type="text" id="ct_hp_${l}" size="1" 
							value="${(combat[l]?(combat[l].hp?combat[l].hp:''):'')}"
							onClick="this.setSelectionRange(0, this.value.length)"
						>
					</div>
				</div>
				`;
			}
		}
		html += `</div></div></form>`;
		trackernodes.botmenu.innerHTML = `<div class="cv_action">
		<button class="css-1olwjck-IconButton" onClick="ORCTcombat.control.refreshTracker()" title="Cancel">
			${om.getIcon('cancel')}
		</button> 
		<button class="css-1olwjck-IconButton ${clientmode}" onClick="ORCTcombat.control.saveCtSettings()" title="Save stats">
			${om.getIcon('save')}
		</button></div>
		`;
		trackernodes.main.innerHTML = html;
		checkInit();
	}

let oc = {
		
	id: 'combat',
	node: {},

	launch: function () {
		
		tracker = this.node;
		om = ORCT;
		
		const toolbarbutton = document.querySelector('.css-1vluezq').firstChild;
		const combatswitcher = document.querySelector('#combatcontainer > div.switcher');
		toolbarbutton.addEventListener("click", function() {
			if (toolbarbutton.getAttribute('aria-label')!='Show Map Controls') {
				tracker.style.right = '0px';
				combatswitcher.firstElementChild.className = 'docked';
			} else {
				tracker.style.right = '50px';
				combatswitcher.firstElementChild.className = '';
			}
		});
		
		document.getElementsByTagName('canvas')[1].onclick = refreshState;
		window.onblur = haltState;
		window.onfocus = resumeState;
				
		trackernodes.topmenu = document.createElement('div');
		trackernodes.main = document.createElement('div');
		trackernodes.botmenu = document.createElement('div');
		trackernodes.main.className = 'wrapscroll';
		
		this.node.onwheel = (evt) => {
			const node = document.querySelector('#combatcontainer div.wrapscroll');
			if (node) node.scrollTop = node.scrollTop + evt.deltaY;		
		};
		
		tracker.appendChild(trackernodes.topmenu);
		tracker.appendChild(trackernodes.main);
		tracker.appendChild(trackernodes.botmenu);
		
		if (!processTracker) refreshTracker();
		
	},
	
	setGUID: function (setguid) {
		guid = setguid;
	},
	
	control: {
		enterValues,
		refreshTracker,
		flushInit,
		endCombat,
		nextTurn,
		prevTurn,
		showSettings,
		setValues,
		saveCtSettings,
		switchMapOwner,
		switchInfoTabs,
		showHelp,
		checkInit,
	},
	
};


return oc;

}) ();
