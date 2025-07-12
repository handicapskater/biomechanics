var d = document;
var dw = document.writeln();
var ie = (d.all) ? true : false;
var netscape = (navigator.appName=="Netscape") ? true : false;
function mouseDown(e) {
	if (e.which != 1) {
		e.cancelable = true;
		e.bubbles = false;
		return false;
	}
	return true;
}
function mouseUp(e) {
	if (e.which != 1) {
		alert(window.copyright);
		e.cancelable = true;
		e.bubbles = false;
		return false;
	}
	return true;
}
function contextMenu(e) {
	return false;
}

// Track imageLink calls if DOM is not ready
window.imageQueue = [];

function imageLink(id, imageUrl, alignment = "center") {
	const existingDiv = document.getElementById(id);
	if (existingDiv) {
		const img = document.createElement('img');
		img.src = imageUrl;
		img.alt = id;
		img.style.width = 'auto';
		img.style.height = 'auto';
		existingDiv.innerHTML = ''; // Clear previous content
		existingDiv.appendChild(img);
	} else {
		console.warn(`imageLink: Element with id '${id}' not found. Skipping.`);
	}
}

// Re-run queued imageLinks after load
document.addEventListener("DOMContentLoaded", () => {
	if (window.imageQueue && window.imageQueue.length > 0) {
		window.imageQueue.forEach(i =>
			imageLink(i.id, i.src, i.align, i.width, i.height)
		);
		window.imageQueue = [];
	}
});

if (netscape) {
	window.captureEvents(Event.MOUSEDOWN | Event.MOUSEUP | Event.CONTEXTMENU);
	window.onmousedown 	 = mouseDown;
	window.onmouseup	 = mouseUp;
	window.oncontextmenu = contextMenu;
} else // if (ie)
	d.onmousedown = new Function("if (event.button==2 || event.button==3) alert(window.copyright)");

// Utility Functions
function ButtonUp(theButton) {
	with (theButton) {
		style.borderLeft	= "1px #f0f0f0 solid";
		style.borderTop		= "1px #f0f0f0 solid";
		style.borderRight	= "1px gray solid";
		style.borderBottom	= "1px gray solid";
	}
}
function ButtonDown(theButton, url) {
	with (theButton) {
		style.borderLeft	= "1px gray solid";
		style.borderTop		= "1px gray solid";
		style.borderRight	= "1px #f0f0f0 solid";
		style.borderBottom	= "1px #f0f0f0 solid";
	}
}

function IE_Resize() {
	if (document.all.posLayer) {
		if (parseInt(document.all.posLayer.style.width) < document.body.clientWidth)
			document.all.posLayer.style.left = document.body.clientWidth / 2 - parseInt(document.all.posLayer.style.width) / 2;
		if (parseInt(document.all.posLayer.style.height) < document.body.clientHeight)
			document.all.posLayer.style.top = document.body.clientHeight / 2 - parseInt(document.all.posLayer.style.height) / 2;
	}
}

function NS_Resize(win) {
	win.visibility = 'hide';
	if (origWidth != innerWidth || origHeight != innerHeight) {
		origWidth = innerWidth;
		origHeight = innerHeight;
		location.reload();
	}
	if (document.width < innerWidth)
		win.left = innerWidth / 2 - document.width / 2;
	if (document.height < innerHeight)
		win.top = innerHeight / 2 - document.height / 2;
	win.visibility = 'show';
}

function startPanel(id, left, top, width, height) {
	var str = '<div id="'+id+'" style="position: absolute; left: '+left+'; top: '+top+'; width: '+width+'; height: '+height+'">';
	document.write(str);
}

function printPanel() {
	document.write('</div>');
}

function Panel(id, left, top, width, height) {
	this.id				= id;
	this.ispanel		= true;
	this.left			= left;
	this.top			= top;
	this.width			= width;
	this.height			= height;
}
Panel.prototype.start	= startXPanel;
Panel.prototype.print	= printXPanel;
	function startXPanel() {
		startPanel(this.id, this.left, this.top, this.width, this.height);
	}
	function printXPanel() {
		printPanel();
	}

function setCookie(name, value, days) {
	const expires = new Date(Date.now() + days*864e5).toUTCString();
	document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

function getCookie(name) {
	return document.cookie.split('; ').reduce((r, v) => {
		const parts = v.split('=');
		return parts[0] === name ? decodeURIComponent(parts[1]) : r;
	}, '');
}

function replayHero() {
	localStorage.removeItem('hideHero');
	$('#heroModal').modal('show');
}

document.addEventListener('DOMContentLoaded', function () {
	const modalShown = localStorage.getItem('heroModalShown');

	if (!modalShown) {
		const modalEl = new bootstrap.Modal(document.getElementById('heroModal'), {
			backdrop: 'static',
			keyboard: false
		});
		modalEl.show();
		localStorage.setItem('heroModalShown', 'true');
	}
});

// Function to dismiss hero modal and set localStorage flag
function dismissHero() {
	$('#heroModal').modal('hide');
	localStorage.setItem('hideHero', 'true');
}