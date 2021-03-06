//Copyright 2021 Redweller (redweller@gmail.com)
//Licensed under the Apache License, Version 2.0

const ORCT = (function () {
	
	const body = document.getElementsByTagName("body")[0];
	const trackdicesound = document.getElementById("teamsound");
	const settings = JSON.parse(body.getAttribute('settings'));
	let localconfig = {}
	let initialized = false;
	let soundenabled = false;
	
	const build = function (obj) {
		const container = document.createElement('div');
		const switcher = document.createElement('div');
		const sbutton = document.createElement('button');
		
		container.setAttribute('id',obj.id+'container');
		container.appendChild(switcher);
		container.className = 'on';
		switcher.setAttribute('class','switcher');
		switcher.appendChild(sbutton);
		sbutton.innerHTML = om.getIcon('switcher');
		
		sbutton.onclick = function() {
			if (container.className == 'off') container.className = 'on';
			else container.className = 'off';
		}
		
		obj.node = document.createElement('div');
		obj.node.setAttribute('class','tracker');
		container.appendChild(obj.node);
		
		document.getElementsByClassName('map')[0].appendChild(container);
		obj.launch();
	};
	
	const manageLocalStorage = function() {
		if (localconfig.length) return;
		let guid = '';
		const configtext = localStorage.getItem('ORCombatTrackerAddon');
		if (configtext) {
			const config = om.safeJSONParse(configtext);
			if (config) guid = config.guid;
			if (guid) {
				localconfig = config;
				return;
			}
		}
		guid = om.getRandomID();
		localconfig = { guid };
		localStorage.setItem('ORCombatTrackerAddon',JSON.stringify(localconfig));
	};
	
const om = {
	
	init: function() {
		if (initialized) return;
		if (document.getElementsByTagName('canvas')[1]) {
			initialized = true;
			manageLocalStorage();
			if (settings.dice) {
				if (this.safeCheckVar(ORCTdice)) {
					build(ORCTdice);
					this.Sound.init();
				}
			}
			if (settings.combat) {
				if (this.safeCheckVar(ORCTcombat)) {
					ORCTcombat.setGUID(localconfig.guid);
					build(ORCTcombat);
				}
			}
			if (settings.fs) {
				const fsbutton = document.querySelector('.css-1f0v0gs > .css-4y7911-IconButton');
				const panelbutton = document.querySelector('.css-6zb9dw-IconButton');
				if (fsbutton) if (fsbutton.title == 'Enter Full Screen') fsbutton.click();
				if (panelbutton) panelbutton.click();
			}
			if (settings.rt) {
				const tbbutton = document.querySelector("div.css-1e2e67h > div.css-wcquo4 > div > div.css-1vluezq > button");
				const handbutton = document.querySelector("div.css-wcquo4 > div > div.css-1vluezq > div > button:nth-child(3)")
				tbbutton.addEventListener('click', () => {
					handbutton.click();
				})
			}
		
		} else {
			const targetNode = body;
			const config = {childList: true, subtree: true}
			const callback = function(mutationsList, observer) {
				if (document.getElementsByTagName('canvas')[1]) {
					om.init();
					observer.disconnect();
				}
			}
			const observer = new MutationObserver(callback);
			observer.observe(targetNode, config);
		}
	},
	
	Sound: {
		mapel: {},
		init: function () {
			this.mapel = document.getElementsByClassName('map')[0];
			this.mapel.addEventListener('mouseup', om.Sound.enable);
		},
		enable: function () {
			soundenabled = true;
			om.Sound.mapel.removeEventListener( 'mouseup', om.Sound.enable );
		},
		play: function () {
			if (soundenabled && trackdicesound) trackdicesound.play(); 
		},
	},
	
	getGUID: function () {
		return localconfig.guid;
	},
	
	getTimeStamp: function () {
		const now = new Date();
		const hr = ( now.getHours() >9 ? '' : '0' ) + now.getHours();
		const min = ( now.getMinutes() >9 ? '' : '0' ) + now.getMinutes();
		return hr + ':' + min;
	},
	
	getTimeInt: function () {
		const now = new Date();
		return Number(now);
	},
	
	getRandomID: function () {
		const chars = "qazxswedcvfrtgbnhyujmkiop1234567891234567890QAZXSWEDCVFRTGBNHYUJMKLP";
		const size = chars.length-1;
		let max = 10;
		let res = '';
		while(max--)
			res += chars[Math.floor(Math.random()*size)]; 
		return res;
	},
	
	safeJSONParse: function (str) {
		try {
			str = JSON.parse(str);
		} catch (e) {
			return false;
		}
		return str;
	},
	
	safeGetValue: function (txtid) {
		const needle = document.getElementById(txtid);
		if (needle) {
			return needle.value;
		} else {
			return '';
		}
	},
	
	safeCheckVar: function (varid) {
		try {
			if (typeof varid !== 'undefined') return true;
		} catch (e) {
			return false;
		}
	},
	
	getIcon: function (name) {
		switch (name) {
			case 'save': return `
				<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 191.667 191.667" width="18" fill="currentcolor">
				<path d="M95.833,0C42.991,0,0,42.99,0,95.833s42.991,95.834,95.833,95.834s95.833-42.991,95.833-95.834S148.676,0,95.833,0z
					 M150.862,79.646l-60.207,60.207c-2.56,2.56-5.963,3.969-9.583,3.969c-3.62,0-7.023-1.409-9.583-3.969l-30.685-30.685
					c-2.56-2.56-3.97-5.963-3.97-9.583c0-3.621,1.41-7.024,3.97-9.584c2.559-2.56,5.962-3.97,9.583-3.97c3.62,0,7.024,1.41,9.583,3.971
					l21.101,21.1l50.623-50.623c2.56-2.56,5.963-3.969,9.583-3.969c3.62,0,7.023,1.409,9.583,3.969
					C156.146,65.765,156.146,74.362,150.862,79.646z"/>
				</svg>
			`;
			case 'cancel': return `
				<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 512 512" width="18" fill="currentcolor">
				<path d="m256 0c-140.61 0-256 115.39-256 256s115.39 256 256 256 256-115.39 256-256-115.39-256-256-256zm116.675 
					309.027c5.859 5.859 5.856 15.355 0 21.211l-42.437 42.437c-5.859 5.859-15.355 5.856-21.211 0l-53.027-53.042-53.042 
					53.042c-5.859 5.859-15.355 5.856-21.211 0l-42.422-42.437c-5.859-5.859-5.859-15.352 
					0-21.211l53.042-53.027-53.042-53.042c-5.859-5.859-5.859-15.352 0-21.211l42.422-42.422c5.859-5.859 
					15.352-5.859 21.211 0l53.042 53.042 53.027-53.042c5.859-5.859 15.352-5.859 21.211 0l42.437 42.422c5.859 
					5.859 5.856 15.355 0 21.211l-53.042 53.042z"/>
				</svg>
			`;
			case 'next': return `
				<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 493.796 493.796">
				<path fill="currentcolor" d="M355.938,200.956L81.414,12.128c-11.28-7.776-23.012-11.88-33.056-11.88c-22.052,0-36.672,18.496-36.672,48.26v397.036
				c0,14.54,4.228,26.688,10.496,35.144c6.364,8.572,16.32,13.108,27.076,13.108c10.04,0,21.308-4.112,32.584-11.876l274.276-188.828
				c17.632-12.152,27.3-28.508,27.296-46.076C383.414,229.456,373.594,213.1,355.938,200.956z"/>
				<g><path fill="currentcolor" d="M456.446,493.672l-0.293-0.004c-0.048,0-0.095,0.004-0.143,0.004H456.446z"/>
				<path fill="currentcolor" d="M455.638,0L444.29,0.032c-14.86,0-27.724,12.112-27.724,26.992v439.368c0,14.896,12.652,27.124,27.532,27.124
				l12.055,0.152c14.805-0.079,25.957-12.412,25.957-27.252V26.996C482.11,12.116,470.51,0,455.638,0z"/></g>
				</svg>
			`;
			case 'previous': return `
				<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 493.52 493.52">
				<path fill="currentcolor" d="M447.126,0.236c-10.056,0-20.884,4.12-32.148,11.884L140.882,200.952c-17.644,12.152-27.252,28.504-27.252,46.06
				c-0.004,17.56,9.78,33.924,27.428,46.076L415.39,481.784c11.284,7.768,22.568,11.736,32.604,11.736h0.012
				c10.76,0,18.916-4.404,25.276-12.972c6.268-8.46,8.688-20.476,8.688-35.012V48.508C481.974,18.74,469.186,0.236,447.126,0.236z"/>
				<path fill="currentcolor" d="M53.106,0.036L39.894,0C25.018,0,11.55,12.112,11.55,26.996v439.42c0,14.884,13.024,27.1,27.908,27.1h0.456l12.948-0.072
				c14.88,0,28.092-12.164,28.092-27.048V27.028C80.958,12.144,67.97,0.036,53.106,0.036z"/>
				</svg>
			`;
			case 'potion': return `
				<svg id="Layer_1" fill="currentcolor" height="10" viewBox="0 0 512 512" width="10" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1">
				<path d="m436.358 99.541a5.386 5.386 0 0 0 -8.756-6.1c-26.41 28.335-52 16.812-64.3 11.274a6.024 6.024 0 0 0 -7.502 2.285 
				5.954 5.954 0 0 0 .787 7.449c10.68 10.682 26.552 33.013 12.865 62.563a5.387 5.387 0 0 0 8.711 6.069c22.915-23.025 49.461-15.722 
				63.244-9.322a5.938 5.938 0 0 0 7.278-1.834 6.03 6.03 0 0 0 -.444-7.821c-9.502-9.726-29.274-29.97-11.883-64.563z"/>
				<path d="m184.081 421.535a6.273 6.273 0 1 0 6.273 6.273 6.28 6.28 0 0 0 -6.273-6.273z"/>
				<path d="m222.653 347.945a2.742 2.742 0 1 0 2.747-2.745 2.744 2.744 0 0 0 -2.747 2.745z"/>
				<path d="m278.188 403.608a5.86 5.86 0 1 0 -5.861-5.86 5.867 5.867 0 0 0 5.861 5.86z"/>
				<path d="m306.426 249.834a5.714 5.714 0 0 1 -5.63 4.786h-.055a5.646 5.646 0 0 1 -5.514-4.489c-2.065-9.835-8.683-26.78-29.81-29.831a5.266 
				5.266 0 0 1 -4.525-5.052c0-.163.018-.319.027-.478a126.569 126.569 0 0 0 -161.608 77.83l33.373 7.673a155.948 155.948 0 0 0 83.392-3.75 
				100.455 100.455 0 0 0 9.53-3.761 140.091 140.091 0 0 1 112.4-.9 126.536 126.536 0 0 0 -30.491-47.932c-.515 2.207-.827 4.227-1.089 5.904z"/>
				<path d="m298.829 194.1a42.71 42.71 0 0 1 -17.985 20.534 42.915 42.915 0 0 1 19.269 19.483 39.006 39.006 0 0 1 18.244-20.671 38.866 38.866 0 
				0 1 -19.528-19.346z"/><path d="m135.433 341.487a5.026 5.026 0 1 0 5.026 5.026 5.031 5.031 0 0 0 -5.026-5.026z"/>
				<path d="m219.185 306.031a165.957 165.957 0 0 1 -88.742 3.991l-34.043-7.828a126.471 126.471 0 1 0 245.383 2.444 130.314 130.314 0 0 0 
				-112.1-2.739 110.378 110.378 0 0 1 -10.498 4.132zm-83.752 55.507a15.026 15.026 0 1 1 15.025-15.025 15.042 15.042 0 0 1 -15.025 15.025zm48.648 
				82.543a16.273 16.273 0 1 1 16.273-16.273 16.291 16.291 0 0 1 -16.273 16.273zm94.107-62.193a15.86 15.86 0 1 1 -15.861 15.86 15.878 15.878 0 0 
				1 15.861-15.86zm-40.051-33.943a12.742 12.742 0 1 1 -12.737-12.745 12.756 12.756 0 0 1 12.737 12.745z"/><path d="m171.285 72.708h93.126v32.154h-93.126z"/>
				<path d="m258.1 27.3a6.87 6.87 0 0 0 -6.838-6.3h-64.898a6.876 6.876 0 0 0 -6.851 6.4l7.656 35.306h61.543z"/>
				<path d="m324.79 221.455a29.269 29.269 0 0 0 -13.457 12.3 136.488 136.488 0 0 1 43.919 100.285c0 75.245-61.215 136.461-136.46 
				136.461s-136.461-61.216-136.461-136.461 61.216-136.46 136.461-136.46a135.534 135.534 0 0 1 52.546 10.5 31.867 31.867 0 0 0 
				15.744-12.98c-6.571-3.1-13.294-5.619-17.135-6.984a26.1 26.1 0 0 1 -17.415-24.492v-48.762h-69.368v48.767a25.918 25.918 0 0 1 
				-17.215 24.42 155.969 155.969 0 0 0 -103.834 143.951c-.808 41.607 15.025 81.235 44.582 111.585 29.488 30.28 68.563 47.115 110.025 
				47.415q.567 0 1.132 0a155.837 155.837 0 0 0 155.757-155.909 157.365 157.365 0 0 0 -48.821-113.636z"/>
				</svg>
			`;
			case 'physics': return `
				<svg id="Capa_1" enable-background="new 0 0 512.067 512.067" fill="currentcolor" height="10" viewBox="0 0 512.067 512.067" width="10" xmlns="http://www.w3.org/2000/svg">
					<g><path d="m386.969 22.927c3.19-7.644-.508-16.438-8.121-19.597-7.644-3.17-16.428.476-19.597 8.121l-11.477 27.718c-3.175 7.655.488 16.434 
					8.121 19.597 7.644 3.17 16.428-.476 19.597-8.121z"/><path d="m489.14 125.098-27.718 11.477c-7.644 3.17-11.29 11.953-8.121 19.597 3.16 7.627 
					11.936 11.297 19.597 8.121l27.718-11.477c7.644-3.17 11.29-11.953 8.121-19.597-3.148-7.623-11.942-11.3-19.597-8.121z"/><path d="m461.422 313.552 
					27.718 11.477c7.644 3.17 16.428-.476 19.597-8.121 3.18-7.655-.497-16.428-8.121-19.597l-27.718-11.477c-7.644-3.17-16.428.476-19.597 8.121-3.174 
					7.654.488 16.434 8.121 19.597z"/>
					<path d="m120.706 156.172c3.17-7.644-.508-16.417-8.121-19.597l-27.718-11.477c-7.644-3.17-16.428.476-19.597 8.121-3.175 7.655.488 16.434 
					8.121 19.597l27.718 11.477c7.644 3.17 16.427-.476 19.597-8.121z"/><path d="m378.848 446.798c7.644-3.17 11.29-11.953 
					8.121-19.597l-11.477-27.718c-3.159-7.613-11.943-11.301-19.597-8.121-7.644 3.17-11.29 11.953-8.121 19.597l11.477 27.718c3.16 7.627 11.936 11.297 19.597 8.121z"/>
					<path d="m214.756 11.45c-3.159-7.634-11.943-11.301-19.597-8.121-7.644 3.17-11.29 11.953-8.121 19.597l11.477 27.718c3.16 7.627 11.936 11.297 19.597 8.121 
					7.644-3.17 11.29-11.953 8.121-19.597z"/><circle cx="150" cy="362.067" r="150"/><path d="m502.976 211.214-89.757-38.467 
					36.267-90.667c2.229-5.571.923-11.935-3.32-16.177-4.243-4.244-10.608-5.549-16.178-3.321l-90.667 36.268-38.467-89.759c-2.364-5.515-7.786-9.091-13.787-9.091-6 
					0-11.423 3.576-13.787 9.091l-38.468 89.757-90.667-36.268c-5.568-2.227-11.934-.922-16.177 3.321s-5.549 10.606-3.321 16.177l40.242 100.603c37.502 3.051 72.657 
					17.599 101.346 41.938l15.439-15.439c5.849-5.849 5.849-15.365 0-21.213-5.858-5.858-5.858-15.355 0-21.213 5.857-5.858 15.355-5.858 21.213 0 8.5 8.5 13.181 19.8 13.181 
					31.82s-4.681 23.32-13.181 31.819l-15.445 15.446c24.902 29.407 38.852 64.98 41.848 101.301l100.699 40.28c5.595 2.236 11.951.906 16.178-3.321 4.243-4.243 5.549-10.606 
					3.32-16.177l-36.267-90.667 89.757-38.467c5.515-2.364 9.091-7.787 9.091-13.787s-3.578-11.423-9.092-13.787z"/>
				</g></svg>
			`;
			case 'magic': return `
				<svg id="Capa_1" fill="currentcolor" enable-background="new 0 0 512 512" height="10" viewBox="0 0 512 512" width="10" xmlns="http://www.w3.org/2000/svg">
				<g><path d="m387.143 178.571c0 8.3-1.411 16.273-3.972 23.715h70.758v-47.429h-70.758c2.561 7.442 3.972 15.414 3.972 23.714z"/>
				<path d="m58.071 62.429v9.332c16.459-15.101 38.385-24.332 62.429-24.332v30c-34.423 0-62.429 28.006-62.429 62.429v9.332c16.458-15.101 
				38.385-24.332 62.429-24.332v30c-34.423 0-62.429 28.005-62.429 62.428v9.333c16.458-15.101 38.385-24.332 62.429-24.332v30c-34.423 0-62.429 
				28.005-62.429 62.428v9.332c16.458-15.101 38.385-24.332 62.429-24.332v30c-34.423 0-62.429 28.006-62.429 62.429v9.332c16.458-15.101 
				38.385-24.332 62.429-24.332h333.429v-124.858h-90.383c-13.025 12.006-30.405 19.356-49.475 19.356-40.292 0-73.071-32.779-73.071-73.071s32.779-73.071 
				73.071-73.071c19.07 0 36.45 7.351 49.476 19.357h90.382v-124.857h-333.429c-34.423 0-62.429 28.006-62.429 62.429z"/>
				<path d="m314.071 135.5c-23.75 0-43.071 19.321-43.071 43.071s19.321 43.071 43.071 43.071 43.071-19.321 43.071-43.071-19.321-43.071-43.071-43.071zm15.012 
				58.071h-30.023v-30h30.023z"/>
				<path d="m453.929 512v-47.429h-333.429v-30h333.429v-47.429h-333.429c-34.423 0-62.429 28.006-62.429 62.429s28.006 62.429 62.429 62.429z"/>
				</g></svg>
			`;
			case 'settings': return `
				<svg fill="currentcolor" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
				viewBox="0 0 480 480" style="enable-background:new 0 0 480 480;" xml:space="preserve">
				<path d="M160,32c-17.673,0-32,14.327-32,32H32C14.327,64,0,78.327,0,96s14.327,32,32,32h96c0,17.673,14.327,32,32,32
					s32-14.327,32-32V64C192,46.327,177.673,32,160,32z"/>
				<path d="M448,208h-64c0-17.673-14.327-32-32-32c-17.673,0-32,14.327-32,32v64c0,17.673,14.327,32,32,32c17.673,0,32-14.327,32-32
					h64c17.673,0,32-14.327,32-32S465.673,208,448,208z"/>
				<path d="M448,64H240c-17.673,0-32,14.327-32,32s14.327,32,32,32h208c17.673,0,32-14.327,32-32S465.673,64,448,64z"/>
				<path d="M272,208H32c-17.673,0-32,14.327-32,32s14.327,32,32,32h240c17.673,0,32-14.327,32-32S289.673,208,272,208z"/>
				<path d="M448,352H320c-17.673,0-32,14.327-32,32c0,17.673,14.327,32,32,32h128c17.673,0,32-14.327,32-32
					C480,366.327,465.673,352,448,352z"/>
				<path d="M240,320c-17.673,0-32,14.327-32,32H32c-17.673,0-32,14.327-32,32c0,17.673,14.327,32,32,32h176c0,17.673,14.327,32,32,32
					c17.673,0,32-14.327,32-32v-64C272,334.327,257.673,320,240,320z"/>
				</svg>
			`;
			case 'swords': return `
				<svg fill="currentcolor" height="10" viewBox="0 0 512 512.0001" width="10" xmlns="http://www.w3.org/2000/svg">
				<path d="m499.078125 429.492188s-34.148437-34.136719-54.679687-54.65625l-69.414063 69.414062 54.699219 54.675781c24.578125 
					24.648438 56.46875 8.859375 67.335937-2.042969 16.539063-16.386718 22.300781-47.085937 
					2.085938-67.363281-.007813-.007812-.015625-.015625-.027344-.027343zm0 0"/>
				<path d="m432.398438 283.992188c-16.683594-16.683594-43.734376-16.683594-60.417969 0l-87.828125 87.828124c-16.683594 
					16.683594-16.683594 43.734376 0 60.417969 16.683594 16.683594 43.730468 16.683594 60.414062 0l87.832032-87.832031c16.683593-16.683594 
					16.683593-43.730469 0-60.414062zm0 0"/><path d="m12.921875 429.492188c-.011719.011718-.019531.019531-.027344.023437-20.214843 
					20.28125-14.453125 50.976563 2.085938 67.367187 10.867187 10.902344 42.757812 26.6875 67.335937 2.039063l54.699219-54.675781-69.414063-69.410156c-20.53125 
					20.519531-54.679687 54.65625-54.679687 54.65625zm0 0"/><path d="m133.242188 234.785156 
					101.542968-101.542968-128.847656-128.847657c-2.808594-2.816406-6.625-4.394531-10.605469-4.394531h-80.332031c-8.285156 0-15 6.714844-15 
					15v80.332031c0 3.980469 1.578125 7.796875 4.394531 10.605469zm0 0"/><path d="m512 95.332031v-80.332031c0-8.285156-6.714844-15-15-15h-80.332031c-3.980469 
					0-7.792969 1.578125-10.605469 4.394531l-251.609375 251.605469 101.546875 101.546875 251.605469-251.605469c2.816406-2.8125 4.394531-6.628906 4.394531-10.609375zm0 0"/>
				<path d="m140.019531 283.992188c-16.683593-16.683594-43.734375-16.683594-60.417969 0-16.683593 16.683593-16.683593 43.730468 0 60.414062l87.828126 
					87.832031c16.683593 16.683594 43.734374 16.683594 60.417968 0 16.683594-16.683593 16.683594-43.734375 0-60.417969zm0 0"/>
				</svg>
			`;
			case 'start': return `
				<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" viewBox="0 0 16 16">
				<path fill="white" d="M8 0c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zM6 12v-8l6 4-6 4z"></path>
				</svg>
			`;
			case 'switcher': return `
				<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentcolor">
				<path d="M24 24H0V0h24v24z" fill="none" opacity=".87"></path>
				<path d="M15.88 9.29L12 13.17 8.12 9.29c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 
					1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41-.39-.38-1.03-.39-1.42 0z"></path></svg>
			`;
			case 'note': return `
				<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentcolor" transform="scale(-1 1)"><path d="M0 0h24v24H0z" fill="none"></path><path d="M19,3H4.99C3.89,3,3,3.9,3,5l0.01,14c0,1.1,0.89,2,1.99,2h10l6-6V5C21,3.9,20.1,3,19,3z M8,8h8c0.55,0,1,0.45,1,1v0 c0,0.55-0.45,1-1,1H8c-0.55,0-1-0.45-1-1v0C7,8.45,7.45,8,8,8z M11,14H8c-0.55,0-1-0.45-1-1v0c0-0.55,0.45-1,1-1h3 c0.55,0,1,0.45,1,1v0C12,13.55,11.55,14,11,14z M14,19.5V15c0-0.55,0.45-1,1-1h4.5L14,19.5z"></path></svg>
			`;
		}
	},
	
};

return om;
	
}) ();