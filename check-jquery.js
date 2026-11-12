"use strict";

const factory = require(process.argv[2]);

function Element(name) {
	this.nodeName = String(name || "div").toUpperCase();
	this.nodeType = 1;
	this.style = {};
	this.childNodes = [];
	this.attributes = [];
	this.parentNode = null;
	this.ownerDocument = null;
}
Element.prototype.appendChild = function(child) {
	this.childNodes.push(child);
	child.parentNode = this;
	return child;
};
Element.prototype.insertBefore = function(child) {
	return this.appendChild(child);
};
Element.prototype.removeChild = function(child) {
	return child;
};
Element.prototype.setAttribute = function(name, value) {
	this[name] = value;
};
Element.prototype.getAttribute = function(name) {
	return Object.prototype.hasOwnProperty.call(this, name) ? String(this[name]) : null;
};
Element.prototype.removeAttribute = function(name) {
	delete this[name];
};
Element.prototype.hasAttribute = function() {
	return false;
};
Element.prototype.getElementsByTagName = function() {
	return [];
};
Element.prototype.getElementsByClassName = function() {
	return [];
};
Element.prototype.getElementsByName = function() {
	return [];
};
Element.prototype.querySelectorAll = function() {
	return [];
};
Element.prototype.querySelector = function() {
	return null;
};
Element.prototype.addEventListener = function() {};
Element.prototype.removeEventListener = function() {};
Element.prototype.cloneNode = function(deep) {
	const copy = new Element(this.nodeName);
	copy.ownerDocument = this.ownerDocument;
	copy.checked = this.checked;
	copy.selected = this.selected;
	copy.value = this.value;
	copy.defaultValue = this.defaultValue;
	copy.type = this.type;
	copy.id = this.id;
	copy.name = this.name;
	copy.disabled = this.disabled;
	copy.className = this.className;
	if (deep) {
		for (const child of this.childNodes) {
			if (child && child.cloneNode) {
				copy.appendChild(child.cloneNode(true));
			}
		}
	}
	return copy;
};
Element.prototype.contains = function() {
	return false;
};
Object.defineProperty(Element.prototype, "firstChild", {
	get() {
		return this.childNodes[0] || null;
	},
});
Object.defineProperty(Element.prototype, "lastChild", {
	get() {
		return this.childNodes[this.childNodes.length - 1] || null;
	},
});
Element.prototype.innerHTML = "";
Object.defineProperty(Element.prototype, "innerHTML", {
	set(html) {
		this.childNodes = [];
		parseInto(String(html), this);
	},
	get() {
		return "";
	},
});

function parseInto(html, parent) {
	const re = /<([a-zA-Z][\w:-]*)([^>]*)>([\s\S]*?)<\/\1>|<([a-zA-Z][\w:-]*)([^>]*)\/?>|([^<]+)/g;
	let match;
	while ((match = re.exec(html))) {
		if (match[6] && match[6].trim()) {
			parent.appendChild({ nodeType: 3, nodeValue: match[6], textContent: match[6] });
			continue;
		}
		const name = match[1] || match[4];
		if (!name) {
			continue;
		}
		const el = new Element(name);
		el.ownerDocument = parent.ownerDocument || parent;
		const attrs = match[2] || match[5] || "";
		const attrRe = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
		let attr;
		while ((attr = attrRe.exec(attrs))) {
			const value = attr[2] ?? attr[3] ?? attr[4] ?? "";
			el.setAttribute(attr[1], value);
			if (attr[1] === "selected") {
				el.selected = true;
			}
			if (attr[1] === "checked") {
				el.checked = true;
			}
			if (attr[1] === "disabled") {
				el.disabled = true;
			}
		}
		if (name.toLowerCase() === "textarea") {
			el.defaultValue = match[3] || "";
			el.value = el.defaultValue;
		}
		if (name.toLowerCase() === "option") {
			el.selected = el.selected || false;
		}
		parent.appendChild(el);
		if (match[3]) {
			parseInto(match[3], el);
		}
	}
}
Element.prototype.getAttributeNode = function() {
	return null;
};
Element.prototype.setAttributeNode = function() {};
Element.prototype.compareDocumentPosition = function() {
	return 0;
};
Element.prototype.getClientRects = function() {
	return [];
};
Element.prototype.getBoundingClientRect = function() {
	return { top: 0, left: 0, width: 0, height: 0 };
};
Element.prototype.hasChildNodes = function() {
	return this.childNodes.length > 0;
};

const document = {
	nodeType: 9,
	nodeName: "#document",
	readyState: "complete",
	compatMode: "CSS1Compat",
	childNodes: [],
	createElement(name) {
		const el = new Element(name);
		el.ownerDocument = document;
		return el;
	},
	createElementNS(_ns, name) {
		return document.createElement(name);
	},
	createDocumentFragment() {
		const el = document.createElement("#fragment");
		el.nodeType = 11;
		return el;
	},
	createTextNode(text) {
		return { nodeType: 3, nodeValue: String(text), textContent: String(text) };
	},
	createComment(text) {
		return { nodeType: 8, nodeValue: String(text) };
	},
	createAttribute(name) {
		return { name: name, value: "" };
	},
	getElementById() {
		return null;
	},
	getElementsByTagName() {
		return [];
	},
	getElementsByClassName() {
		return [];
	},
	getElementsByName() {
		return [];
	},
	querySelectorAll() {
		return [];
	},
	querySelector() {
		return null;
	},
	addEventListener() {},
	removeEventListener() {},
};
document.documentElement = document.createElement("html");
document.head = document.createElement("head");
document.body = document.createElement("body");
document.location = { href: "https://example.test/", protocol: "https:", hash: "" };
document.implementation = {
	createHTMLDocument() {
		const created = {
			nodeType: 9,
			nodeName: "#document",
			readyState: "complete",
			compatMode: "CSS1Compat",
			childNodes: [],
			location: document.location,
			createElement: document.createElement,
			createElementNS: document.createElementNS,
			createDocumentFragment: document.createDocumentFragment,
			createTextNode: document.createTextNode,
			getElementsByTagName() {
				return [];
			},
			querySelectorAll() {
				return [];
			},
			querySelector() {
				return null;
			},
			addEventListener() {},
			removeEventListener() {},
		};
		created.documentElement = document.createElement("html");
		created.head = document.createElement("head");
		created.body = document.createElement("body");
		created.head.ownerDocument = created;
		created.body.ownerDocument = created;
		return created;
	},
};
document.appendChild = function(child) {
	document.childNodes.push(child);
	child.parentNode = document;
	return child;
};

const window = {
	document: document,
	navigator: { userAgent: "node", language: "en" },
	location: { href: "https://example.test/", protocol: "https:", hash: "" },
	addEventListener() {},
	removeEventListener() {},
	getComputedStyle() {
		return {
			getPropertyValue() {
				return "";
			},
		};
	},
	setTimeout: setTimeout,
	clearTimeout: clearTimeout,
	setInterval: setInterval,
	clearInterval: clearInterval,
	HTMLElement: Element,
	Element: Element,
	Node: Element,
	console: console,
};
window.window = window;
window.self = window;
window.top = window;
document.defaultView = window;
document.parentWindow = window;

try {
	const jQuery = factory(window);
	if (jQuery.fn.jquery !== "3.7.1") {
		throw new Error("version " + jQuery.fn.jquery);
	}
	if (!/^jQuery/.test(jQuery.expando)) {
		throw new Error("expando " + jQuery.expando);
	}
	const made = jQuery("<div>");
	made.text("jquery_ok");
	const text = made.text();
	if (text !== "jquery_ok") {
		throw new Error("text " + text);
	}
	process.stdout.write("jquery_ok " + jQuery.fn.jquery + " " + jQuery.expando.slice(0, 6) + "\n");
} catch (err) {
	process.stderr.write(String(err && err.message || err) + "\n");
	process.exit(1);
}
