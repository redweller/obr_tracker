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
	let colors = {};
	let tracker;
	let processTracker;
	let	container;
	let combatants;
	let curturn;
	let mapGUID;
	let notelength;
	let fogcontainers = [];
	let turnstate = '';
	let highlighted = '';
	let highlight = true;


	function refreshState() {
		refreshTracker();
		if (master && 
			(Object.keys(combat).length ||
			Object.keys(colors).length))
			sendPackage();
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
					//window.NEW = entity.parent.parent.parent.parent
					var combatant = {
						id: id,
						key: shp,
						salt: entity.parent.parent.parent.parent._id,
						name: entity._partialText,
						color: entity.parent.parent.parent.children[0].children[0].attrs.stroke,
						health: '-', 
						init: 0,
						status: '',
						inactive: 'inactive',
						turn: '',
						concurrent: false,
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
						if (combatant.init != '') {
							combatant.inactive = '';
							for (const key in combat) {
								if ((combat[key].init == combatant.init) &&
									(key != id)) 
									combatant.concurrent = true;
							}
						}
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
						colors = {};
						combatants = [];
						turns = {};
						notelength = 10;
					}
				} else {
					mapGUID = src;
				}
			} else {
				if (entity.attrs.points && 
					entity.attrs.fillPatternImage && 
					entity.attrs.fill && 
					entity.attrs.stroke) {
						fogcontainers = entity.parent.children;
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
		manageTurns();
		
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
			c: colors
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
			fillNote(wrapped);
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
								combat = pckg.combat || {};
								turns = pckg.turns || {};
								colors = pckg.c || {};
								master = false;
							} else {
								if (!Object.keys(combat).length &&
									!Object.keys(colors).length) {
									combat = pckg.combat || {};
									turns = pckg.turns || {};
									colors = pckg.c || {};
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
	
	function fillNote(txt) {
		const transport = Konva.shapes[container];
		if (!transport) return;
		const noteobj = transport.parent;
		invokeDialog (noteobj);
		const delivery = document.getElementById('changeNoteText');
		if (!delivery) return;
		if (delivery.value[0] != '!') return;
		delivery.parentElement.parentElement.style.display = 'none';
		let changeNote = {}
		if (txt) delivery.value = txt;
		for (const prop in delivery) { 
			if (prop.includes('__reactProps')) changeNote = delivery[prop]; 
		}
		changeNote.onChange({target: delivery});
	}
	
	function invokeDialog (node) {
		const caller = node.eventListeners.click[0].handler;
		const evtobj = {
			currentTarget: node, 
			target: node, 
			pointerId: 999, 
			evt: { isTrusted: true }
		};
		caller(evtobj);
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
	
	function setColorValues() {
		const bgcheck = document.getElementById('ct_colorbg');
		const fgcheck = document.getElementById('ct_hidefog');
		const hgcheck = document.getElementById('ct_highlight');
		const h = document.getElementById('ct_hue');
		const s = document.getElementById('ct_sat');
		const l = document.getElementById('ct_lum');
		if (bgcheck.checked) {
			colors.h = h.value;
			colors.s = s.value;
			colors.l = l.value;
		} else {
			colors = {};
		}
		if (fgcheck.checked) {
			colors.f = 1;
		} else {
			delete colors.f;
		}
		if (hgcheck.checked) {
			highlight = true;
		} else {
			highlight = false;
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
			highlightChar();
			var curnum = getTurnOrder(turns.current);
			var curchar = combatants[curnum];
			var thisturn = true;
			if (curnum ==0) thisturn = false;
			else if (!curchar) thisturn = false;
			else if (!curchar.init) thisturn = false;
			if (thisturn) {
				turns.active = curchar.id;
				highlightChar(curchar.key);
			} else {
				turns.active = combatants[getTurnOrder(0)].id;
				turns.currentRound++;
				turns.current = 0;
				highlightChar(combatants[getTurnOrder(0)].key);
			}
		} else {
			first = combatants[getTurnOrder(0)];
			if ( first.init ) {
				turns.battle = true;
				turns.active = first.id;
				turns.currentRound = 1;
				turns.current = 0;
				highlightChar(first.key);
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
	
	function highlightChar(curchar) {
		if (!highlight) return;
		let switchoff = false;
		if (curchar) {
			highlighted = curchar;
		} else {
			if (!highlighted) return;
			curchar = highlighted;
			highlighted = '';
			switchoff = true;
		}
		let charobj = Konva.shapes[curchar].parent.parent.parent.parent;
		if (!charobj) return;
		if (!charobj.eventListeners) return;
		invokeDialog(charobj);
		let dialog = document.querySelector('.css-2qb2ir > .css-18mg9wb');
		if (!dialog) return;
		dialog.parentElement.parentElement.style.display = 'none';
		let colorselector = document.querySelector('.css-2qb2ir > .css-18mg9wb > .css-wym4ve');
		if (switchoff == !colorselector.childElementCount) return;
		colorselector.click();
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
		highlightChar();
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
	
	function colorFog(c) {
		if (document.querySelectorAll('.css-v0lvu6').length == 2) return;
		for (const shp of fogcontainers) {
			if ((shp.attrs.fill == 'rgba(34, 34, 34, 0.5)') ||
				(shp.attrs.fillPriority == 'pattern'))
				continue;
			if (!c) c = 'rgb(34, 34, 34)';
			if (shp.attrs.fill != c) {
				shp.attrs.fill = c;
				shp.attrs.stroke = c;
				fillNote();
			}
		}
	}
	
	function applyColor() {
		let c = '';
		if (colors.h) {
			c = 'hsl('+colors.h+', '+colors.s+'%, '+colors.l+'%)';
			document.body.style.background = c;
			const lpane = document.querySelector('.css-1d9f0cb');
			const rpane = document.querySelector('.css-4bdvxc');
			if (lpane) lpane.style.background = 'var(--theme-ui-colors-overlay)';
			if (rpane) rpane.style.background = 'var(--theme-ui-colors-overlay)';
		} else {
			c = 'hsl(230, 25%, 18%)';
			document.body.removeAttribute('style');
			const lpane = document.querySelector('.css-1d9f0cb');
			const rpane = document.querySelector('.css-4bdvxc');
			if (lpane) lpane.style.background = 'var(--theme-ui-colors-background)';
			if (rpane) rpane.removeAttribute('style');
		}
		if (colors.f) {
			colorFog(c);
		} else {
			colorFog();
		}
	}
	
	function adjustBg(ch, lim) {
		if (ch.value < 0) ch.value = 0;
		if (ch.value > lim) ch.value = lim;
		if (!ch.value || isNaN(ch.value)) ch.value = (lim==100?25:230);
	}
	
	function previewColor(el) {
		const p = document.getElementById('bg_picker');
		if (p) {
			const bgcheck = document.getElementById('ct_colorbg');
			const fgcheck = document.getElementById('ct_hidefog');
			const h = document.getElementById('ct_hue');
			const s = document.getElementById('ct_sat');
			const l = document.getElementById('ct_lum');
			if (bgcheck.checked) {
				adjustBg(h, 360);
				adjustBg(s, 100);
				adjustBg(l, 100);
				h.parentElement.classList.remove('hidden');
				const c = 'hsl('+h.value+', '+s.value+'%, '+l.value+'%)';
				if (p.style['background-color'] != c) {
					p.style['background-color'] = c;
					document.body.style.background = c;
					if (fgcheck.checked) colorFog(c);
					else colorFog();
					if (el) if (el.parentElement.className == 'bg_colors') el.focus();
				}
			} else {
				h.parentElement.classList.add('hidden');
				document.body.removeAttribute('style');
				if (fgcheck.checked) colorFog('hsl(230, 25%, 18%)');
				else colorFog();
			}
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
		var cc = c.concurrent ? '<a title="Concurrent action">('+c.init+')</a>' : '';
		return `
		<div class="${c.inactive} ${c.turn}" onClick="ORCTcombat.control.enterValues('${ch}')" translate="no">
			<div><span style="color:${c.color};font-weight:bolder;">•</span></div>
			<div class="ct_name" title="${c.name}">${c.name}</div>
			<div class="cc">${cc}</div>
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
		turnstate = 'end';
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
		let output = '';
		let curstate = '';
		if (turns.battle && master) {
			curstate = 'round'+turns.currentRound;
			output = `
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
			curstate = currentRound;
			output = `
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
			curstate = 'waiting';
			output = `
			<div id="turns" class="turns ${ctready}"><span class="move_turn" onClick="ORCTcombat.control.nextTurn()">
				Start
				${om.getIcon('swords')}</span>
				<a class="set_btn" title="Settings" onClick="ORCTcombat.control.showSettings()">${om.getIcon('settings')}</a>
			</div>
			`;
		}
		if (turnstate != curstate) {
			turnstate = curstate;
			trackernodes.botmenu.innerHTML = output;
		}
	}


	function enterValues(ch) {
		if (!master) return;
		turnstate = 'edit';
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
		turnstate = 'settings';
		processTracker = clearInterval(processTracker);
		var mode1 = (master ? 'checked="true"' : '');
		var mode2 = (!master ? 'checked="true"' : '');
		var mode3 = (colors.f ? 'checked="true"' : '');
		var mode4 = (colors.h ? 'checked="true"' : '');
		var mode5 = (highlight ? 'checked="true"' : '');
		var hidehsl = (!colors.h ? 'hidden' : '');
		//var hidestats = (master ? 'hidden' : '');
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
			var infotext = 'To share & store your combat data enable this feature on map selection screen or create a '+
				om.getIcon('note')+' Sticky Note with "!" in it.';
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
			<form onsubmit="ORCTcombat.control.saveCtSettings()" autocomplete="off">
			<div class="master_check">
				<input type="radio" id="ct_mode1" name="ct_mode" value="master" ${mode1} onClick="ORCTcombat.control.switchMapOwner(true)">
				<label for="ct_mode1">Master</label>
				<input type="radio" id="ct_mode2" name="ct_mode" value="client" ${mode2} onClick="ORCTcombat.control.switchMapOwner(false)">
				<label for="ct_mode2">Client</label>
			</div>
			<div class="highlight_check">
				<input type="checkbox" id="ct_highlight" name="ct_highlight" ${mode5}>
				<label for="ct_highlight">Highlight active char</label>
			</div>
			<div class="fog_check">
				<input type="checkbox" id="ct_hidefog" name="ct_hidefog" ${mode3} onClick="ORCTcombat.control.previewColor()">
				<label for="ct_hidefog">Blend fog w/bg color</label>
			</div>
			<div class="bg_check">
				<input type="checkbox" id="ct_colorbg" name="ct_colorbg" ${mode4} onClick="ORCTcombat.control.previewColor()">
				<label for="ct_colorbg">Recolor background</label>
				<div class="bg_colors ${hidehsl}">
					<label title="Hue" for="ct_hue">H:</label>
					<input title="Hue"
								type="number" id="ct_hue" size="1" 
								onkeyup="ORCTcombat.control.previewColor(this)"
								onclick="this.focus()"
								value="${colors.h || 230}"
							>
					<label title="Saturation" for="ct_sat">S:</label>
					<input title="Saturation"
								type="number" id="ct_sat" size="1" 
								onkeyup="ORCTcombat.control.previewColor(this)" 
								onclick="this.focus()"
								value="${colors.s || 25}"
							>
					<label title="Lightness" for="ct_lum">L:</label>
					<input title="Lightness"
								type="number" id="ct_lum" size="1" 
								onkeyup="ORCTcombat.control.previewColor(this)" 
								onclick="this.focus()"
								value="${colors.l || 18}"
							>
					<div title="Preview" id="bg_picker"></div>
				</div>
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
			</form>
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
	
	let db = {};
	let maps = {};
	let obruserid = null;

	function processMaps() {
		let maps, states;
		const transaction = db.transaction(['states','maps'], 'readonly');
		const stored_maps = transaction.objectStore('maps');
		let request = stored_maps.getAll();
		request.onsuccess = function(event) {
			const list = request.result;
			maps = {};
			list.forEach((map) => {
				let unique = 0;
				list.forEach((i) => {if (i.name == map.name) unique++;});
				if (unique == 1) maps[map.id] = map;
			});
			const stored_states = transaction.objectStore('states');
			request = stored_states.getAll();
			request.onsuccess = function(event) {
				const states = request.result;
				const statelist = [];
				request.result.forEach( (state,i) => {
					if (maps[state.mapId])
						statelist[maps[state.mapId].name] = i;
				});
				processButtons(states,statelist);
			}
		};
	}

	function processRemoval(stateid, btn) {
		const transaction = db.transaction(["states"], "readwrite");
		const statesStore = transaction.objectStore("states");
		let request = statesStore.get(stateid);
		request.onsuccess = function (event) {
			let state = request.result;
			for (const n in state.notes) {
				if (!state.notes[n].text) continue;
				if (state.notes[n].text[0] == '!') {
					delete state.notes[n];
				}
			}
			request = statesStore.put(state);
			request.onsuccess = function(event) {
				processButtonReaction(false, stateid, btn);
			};
		}
	}

	function processAddition(stateid, btn) {
		const transaction = db.transaction(['states'], "readwrite");
		const stateStore = transaction.objectStore('states');
		let request = stateStore.get(stateid);
		request.onsuccess = function(event) {
			let state = request.result;
			let userguid = {guid: ORCT.getGUID()};
			let date = new Date() * 1;
			let noteid = ORCT.getRandomID();
			let notetxt = LZString.compressToBase64(JSON.stringify(userguid));
			let note = {
				color: 'black',
				id: noteid,
				lastModified: date,
				lastModifiedBy: obruserid,
				locked: false,
				rotation: 0,
				size: 1,
				text: '!|'+notetxt+'|',
				textOnly: false,
				visible: true,
				x: -10,
				y: 0,
			};
			if (checkNotes(state.notes)) {
				btn.classList.add('on');
			} else {
				state.notes[noteid] = note;
				const stateStore = transaction.objectStore('states');
				request = stateStore.put(state);
				request.onerror = () => {};
				request.onsuccess = function(event) {
					processButtonReaction(true, stateid, btn);
				};
			}
		};
	}

	function processButtons(states,statelist) {
		const btns = document.getElementsByClassName('css-kvyrub obrt');
		if (!btns.length) return;
		for (const btn of btns) {
			const nm = btn.getAttribute('name');
			const icon = btn.children[0];
			const state = states[statelist[nm]];
			if (!state) {
				btn.title = 'Can\'t process this map';
				icon.classList.remove('on');
				btn.onclick = null;
				continue;
			}
			if (checkNotes(state.notes)) {
				processButtonReaction(true, state.mapId, icon);
			} else {
				processButtonReaction(false, state.mapId, icon);
			}
		}
	}
	
	function processButtonReaction(ison, stateid, icon) {
		const btn = icon.parentElement;
		if (ison) {
			icon.title = 'OBRT Sharing currently ON';
			icon.classList.add('on');
			btn.onclick = () => {showDisConfirmation(stateid,icon)};
		} else {
			icon.title = 'OBRT Sharing currently OFF';
			icon.classList.remove('on');
			btn.onclick = () => {processAddition(stateid,icon)};
		}
	}

	function checkNotes(notes) {
		for (const n in notes) {
			if (!notes[n].text) continue;
			if (notes[n].text[0] == '!') return true;
		}
		return false;
	}

	function manageThumbs() {
		if (!maps.length) return;
		for (const map of maps) {
			const btns = map.getElementsByClassName('obrt');
			if (btns.length) return;
			const div = document.createElement('div');
			const btn = document.createElement('button');
			const name = map.getAttribute('aria-label');
			div.setAttribute('name',name);
			div.className = 'css-kvyrub obrt';
			btn.className = 'css-1gx1hhr-IconButton swords';
			map.appendChild(div);
			div.appendChild(btn);
			btn.innerHTML = ORCT.getIcon('swords');
		}
		processMaps();
	}

	function waitForIt () {
		const portals = document.getElementsByClassName('ReactModalPortal');
		const obsconfig = {childList: true, subtree: true,};
		for (const portal of portals) {
			const observer = new MutationObserver(modalChecker);
			observer.observe(portal, obsconfig);
		}
		let request = indexedDB.open('OwlbearRodeoDB',410);
		request.onerror = function(event) {
			console.log("Database error: " + event.target.errorCode);
		};
		request.onsuccess = function(event) {
			db = event.target.result;
			const transaction = db.transaction(['user'], "readonly");
			const userStore = transaction.objectStore('user');
			let request = userStore.get('userId');
			request.onsuccess = function(event) {
				obruserid = request.result.value;
			}
		};
	}

	function modalChecker (changeList) {
		for (const c in changeList) {
			const change = changeList[c];
			if (change.addedNodes.length) {
				for (const node of change.addedNodes) {
					if (!node.getElementsByClassName) continue;
					const dialog = node.getElementsByClassName('css-vurnku')[0];
					if (dialog) {
						if (!dialog.getElementsByClassName) continue;
						maps = dialog.getElementsByClassName('css-1faj2pb');
						if (maps.length) manageThumbs();
					}
				}
			}
		}
	}

	function showDisConfirmation(stateid, btn) {
		html = `
	<div class="ReactModal__Overlay ReactModal__Overlay--after-open" style="position: fixed; inset: 0px; background-color: rgba(0, 0, 0, 0.73); z-index: 100; display: flex; align-items: center; justify-content: center;"><div class="ReactModal__Content ReactModal__Content--after-open" tabindex="-1" role="dialog" aria-modal="true" style="position: absolute; inset: initial; border: 1px solid rgb(204, 204, 204); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; background-color: var(--theme-ui-colors-background); overflow: auto; border-radius: 4px; outline: none; padding: 20px; max-height: 100%; max-width: 300px; opacity: 1; transform: scale(1);"><div class="css-vurnku"><label class="obrt-dialog-label">Disable OBRT sharing</label><p class="obrt-dialog-text">This will disable OBRT data sharing and remove existing combat data. If this is your current map, you'll need to reopen it.</p><p class="obrt-dialog-text">Once applied, this operation cannot be undone.</p><div class="obrt-dialog-actions"><button class="obrt-dialog-button" id="obrt_dialog_cancel">Cancel</button><button class="obrt-dialog-button" id="obrt_dialog_disable">Disable</button></div></div><button id="obrt_dialog_close" title="Close" aria-label="Close" class="css-1kl6cmo-IconButton"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentcolor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg></button></div></div>
		`;
		const dialog = document.createElement('div');
		const cancelfunc = () => {document.body.removeChild(dialog)};
		dialog.className = 'ReactModalPortal';
		dialog.innerHTML = html;
		document.body.appendChild(dialog);
		document.getElementById('obrt_dialog_cancel').onclick = cancelfunc;
		document.getElementById('obrt_dialog_close').onclick = cancelfunc;
		document.getElementById('obrt_dialog_disable').onclick = () => {
			processRemoval(stateid, btn);
			document.body.removeChild(dialog);
		};
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
			if (toolbarbutton.className!='css-1fj1vmy-IconButton') {
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
		waitForIt();
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
		previewColor,
	},
	
};


return oc;

}) ();
