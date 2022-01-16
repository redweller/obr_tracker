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


window.onload = function () {
	const link_about = document.getElementById('about');
	const link_howto = document.getElementById('howto');
	const link_chlog = document.getElementById('chlog');
	const link_close = document.getElementById('close');
	
	const totop = document.getElementById('totop');
	const node = document.getElementById('scroll');
	const main = document.getElementById('main');
	const bar = document.getElementById('bar');
	const locale = getLocaleText('current_locale');
	
	async function load_help(ref){
		main.innerHTML = await (await fetch(ref)).text();
		help_index();
		changelog_dates();
		scroll_main();
	}
	
	function help_index() {
		const content = document.getElementById('contents');
		const index = document.getElementsByTagName('h2');
		if (!content) return;
		for (let i=0; i<index.length; i++) {
			const item = document.createElement('li');
			const link = document.createElement('a');
			link.innerText = index[i].innerText;
			link.href = '#'+index[i].id;
			content.appendChild(item);
			item.appendChild(link);
		}
	}
	
	function changelog_dates() {
		const dates = document.getElementsByClassName('date');
		for (let i=0; i<dates.length; i++) {
			const date = new Date(dates[i].innerText);
			const options = {day:'2-digit', month:'long', year:'numeric'};
			dates[i].innerText = date.toLocaleDateString(locale,options);
		}
	}
	
	function scroll_main () {
		if (node.scrollTop < 20) totop.className = '';
		else totop.className = 'visible';
	}
	
	link_about.addEventListener('click', function () {
		load_help('../_locales/'+locale+'/about.html');
	});
	
	link_howto.addEventListener('click', function () {
		load_help('../_locales/'+locale+'/howto.html');
	});
	
	link_chlog.addEventListener('click', function () {
		load_help('../_locales/'+locale+'/changelog.html');
	});
	
	link_close.addEventListener('click', function () {
		window.close();
	});
	
	totop.addEventListener('click', function () {
		node.scrollTop = 0;
	});
	
	node.addEventListener('scroll', scroll_main);
	document.addEventListener('contextmenu', event => event.preventDefault());
	document.documentElement.lang = locale;
	
	for (const node of bar.children) {
		if (!node.innerText) continue;
		const check_node = node.innerText.match(/__MSG_([\w_]*)__/);
		if (check_node) {
			node.innerText = getLocaleText(check_node[1]);
		}
	}
	
	async function firstLoad() {
		await load_help('../_locales/'+locale+'/howto.html');
		const anch = document.location.href.match(/#\w*/);
		if (anch) document.location.href = anch[0];
	}
	
	firstLoad();
}