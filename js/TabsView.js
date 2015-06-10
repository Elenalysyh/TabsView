'use strict';

(function() {

	function TabsView(place , options) {

		window.TabsViewInstances = window.TabsViewInstances != undefined ? window.TabsViewInstances + 1 : 0;

		this.element = place;
		this.num = 0;
		this.STOP_EDIT_SAVE = 13;
		this.STOP_ESC = 27;
		this.lastPressKey = 0;
		this._defaults = {
			tabs: [],
			defaultTitle: "Double click to edit",
			defaultDescription: "Double click to edit",
			tabsTemplate: '<div id="wrapperTab"><ul class="nav nav-tabs" id="wrapperNavUl"></ul><span class="newTab btn btn-primary" id="makeNewTab">NewTab</span><div class="tab-content" id="wrapperContentDiv"></div>',
			titleTemplate: '<li data-id="{{index}}" class="tab-title "><a data-toggle="tab"><input class="noView inputZone"><span class="titleZone">{{title}}</span><span class="closeTag">X</span></a></li>',
			descriptionTemplate: '<div class="contentElemOfTab tab-pane fade in" data-id="{{index}}"><div><textarea class="textareaZone noView"></textarea><span class="content">{{descriptionTab}}</span></div></div>',
			prefixTabsView: 'view',
			prefixId: 'idTab'
		};
		this.options = Object.assign({}, this._defaults, options);
		this.index = this.options.prefixTabsView + '' + window.TabsViewInstances;
		this.build();
		this.wrapperNav = this.element.querySelector("#wrapperNavUl");
		this.wrapperContent = this.element.querySelector("#wrapperContentDiv");

		for (var i = 0; i < this.options.tabs.length; i += 1) {
			this.addTab(this.options.tabs[i]);
		}

		this.activateTab();
		this._assignHandlers();
		this._onloadHash();
	};

	/**
	 * Returns data of all tabs
	 *
	 * @return {object}  
	 */
	TabsView.prototype.getTabsData = function() {
		var objectData = {};
		var dataId;
		var titleCont;
		var descriptionFor;
		var allDataId = this.wrapperNav.childNodes;
		for (var i = 0; i < allDataId.length; i += 1) {
			dataId = allDataId[i].getAttribute('data-id');
			titleCont = allDataId[i].querySelector(".titleZone").textContent;
			descriptionFor = this.wrapperContent.querySelector('[data-id=' + dataId + ']').textContent;
			objectData[dataId] = {
				title: titleCont,
				description: descriptionFor
			};
		}
		return objectData;
	};


	/**
	 * program sets the title of tab at the specified index
	 *
	 * @param {string} indexIdTab
	 * @param {string} newtitle
	 * @return {undefined}
	 */
	TabsView.prototype.setTitle = function(indexIdTab, newtitle) {
		var changedTabTitle = this.wrapperNav.querySelector('[data-id=' + indexIdTab + ']');
		changedTabTitle.querySelector(".titleZone").innerHTML = newtitle;
	}

	/**
	 * program sets the description of tab at the specified index
	 *
	 * @param {string} indexIdTab
	 * @param {string} newDescription
	 * @return {undefined}
	 */
	TabsView.prototype.setDescription = function(indexIdTab, newDescription) {
		var changedTabDescription = this.wrapperContent.querySelector('[data-id=' + indexIdTab + ']');
		changedTabDescription.querySelector(".content").innerHTML = newDescription;
	}

	/**
	 * program sets the title and the description at the specified index
	 *
	 * @param {string}, indexIdTab
	 * @param {object}, newData
	 * @return {undefined}
	 */
	TabsView.prototype.setTabData = function(indexIdTab, newData) {
		this.setTitle(indexIdTab, newData.title);
		this.setDescription(indexIdTab, newData.description);
	}

	/**
	 * Activates the indicated tab in the hash when the page is reloaded
	 *
	 * @return {undefined}
	 */
	TabsView.prototype._onloadHash = function() {
		if (!location.hash || location.hash === '#') {
			return;
		}
		var whichActiveTab;
		var lastTab;
		var withoutHash = location.hash.replace("#", "");
		try {
			var contentHash = JSON.parse(withoutHash);
		} catch (error) {
			console.debug('Unable to parse');
			return;
		}
		whichActiveTab = this.wrapperNav.childNodes;
		for (var i = 0; i < whichActiveTab.length; i += 1) {
			if (whichActiveTab[i].getAttribute("data-id") == contentHash[this.index]) {
				this.activateTab(contentHash[this.index]);
				return;
			}
		}
		lastTab = this.wrapperNav.lastChild.getAttribute("data-id");
		contentHash[this.index] = lastTab;
		this.activateTab(lastTab);
		location.hash = JSON.stringify(contentHash);
	};

	/** 
	 * Changes the hash value when changing the active tabs
	 *
	 * @return {undefined}
	 */
	TabsView.prototype._changeHash = function() {
		var activeId = this.element.querySelector(".active").getAttribute("data-id");
		var withoutHash = location.hash.replace("#", "");
		var contentHash = {};
		try {
			contentHash = JSON.parse(withoutHash);
		} catch (e) {
			console.debug('Unable to parse');
		}
		contentHash[this.index] = activeId;
		location.hash = JSON.stringify(contentHash);
	};

	/** 
	 *Transfer element on which the event occurred from edit mode to view mode.
	 * if press the Enter or losing focus, it save changing. if press the Esc, it dont save changing
	 *
	 * @param  {object}, an event that call the function
	 * @return {undefined}
	 */
	TabsView.prototype._onKeyupBlur = function(event) {
		var el = event.delegateTarget;
		var value = el.value || this.options.defaultTitle;
		var titleEl = el.parentNode.parentNode;
		var textEl = el.nextSibling;
		var tabIndex = titleEl.getAttribute('data-id');

		if (event.keyCode === this.STOP_EDIT_SAVE || event.type === "focusout" && this.lastPressKey !== this.STOP_ESC) {
			textEl.innerText = value;
			this.titleViewMode(tabIndex);
			this.descriptionViewMode(tabIndex);
		}
		if (event.keyCode === this.STOP_ESC) {
			this.lastPressKey = event.keyCode;
			this.titleViewMode(tabIndex);
			this.descriptionViewMode(tabIndex);
		}
	};

	/**
	 * Build the main html for the element TabsView
	 *
	 * @return {undefined}
	 */
	TabsView.prototype.build = function() {
		this.element.innerHTML = this.options.tabsTemplate;
	};

	/**
	 * In string "template" replaces the fenced part of the string {{}}, to the set value "variables".
	 *
	 * @param {string}, template, the original string
	 * @param {object}, variables
	 * @return {string}, new string with replacement
	 */
	TabsView.prototype.buildTemplate = function(template, variables) {
		for (var key in variables) {
			var reformedKeyForSearch = "{{" + key + "}}";
			var stringForReplace = variables[key];
			do {
				template = template.replace(reformedKeyForSearch, stringForReplace);
			}
			while (template.indexOf(reformedKeyForSearch) !== -1);
		}
		return template;
	};

	/** 
	 * Build html for each tab, @param containing parameters of the tab
	 *
	 * @param {object}, dataNewTab
	 * return {undefined}
	 */
	TabsView.prototype.buildTab = function(dataNewTab) {
		var htmlForNewTitle = this.buildTemplate(this.options.titleTemplate, dataNewTab);
		var htmlForNewDescription = this.buildTemplate(this.options.descriptionTemplate, dataNewTab);
		this.wrapperNav.innerHTML += htmlForNewTitle;
		this.wrapperContent.innerHTML += htmlForNewDescription;
	};

	/** 
	 * Return a unique index for a new tab with a given prefix
	 *
	 * @param {string}, prefix
	 * @return {string} 
	 */
	TabsView.prototype._generateTabIndex = function(prefix) {
		return prefix + (this.num++);
	};

	/** 
	 * Adds a property index in the object containing the data tab, if that is absent
	 *
	 * @param {object}, data of tab
	 * @return {string}
	 */
	TabsView.prototype.addTab = function(data) {
		data.index = data.index || this._generateTabIndex(this.options.prefixId);
		this.buildTab(data);
		var dataIndex = data.index;
		return data.index;
	};

	/**
	 * Activates the tab, which has a specified index
	 
	 * @param {string}, indexActiveTab, tab which will be active
	 * @return {undefined}
	 */
	TabsView.prototype.activateTab = function(indexActiveTab) {
		var allActive = this.element.querySelectorAll(".active");
		for (var i = 0; i < allActive.length; i += 1) {
			allActive[i].classList.remove("active");
		}
		var elemsHaveIndexActiveTab = this.getElementsByIndex(indexActiveTab);
		for (var i = 0; i < elemsHaveIndexActiveTab.length; i += 1) {
			elemsHaveIndexActiveTab[i].classList.add("active");
		}
		if (!indexActiveTab) {
			var activeId = this.wrapperNav.lastChild.getAttribute("data-id");
			var activeElemAtFirst = this.element.querySelectorAll('[data-id=' + activeId + ']');
			for (var i = 0; i < activeElemAtFirst.length; i += 1) {
				activeElemAtFirst[i].classList.add("active");
			}
		}
	};

	/**
	 * Return index tab, in which the event occurred
	 *
	 * @param {object}, event 
	 * @return {string}
	 */
	TabsView.prototype._getIndexByHtml = function(event) {
		var target = event.target;
		while (!target.getAttribute("data-id")) {
			target = target.parentNode;
		}
		return target.getAttribute("data-id");
	};

	/**
	 * Making the active tab in which the event occurred
	 *
	 * @param object
	 * @return void
	 */
	TabsView.prototype._onTitleClick = function(event) {
		var indexIdTab = this._getIndexByHtml(event);
		this.activateTab(indexIdTab);
	};

	/**
	 * delegates event
	 *
	 * @param {object}
	 * @param {string}
	 * @param {string}
	 * @param {function}
	 * @return {undefined}
	 */
	TabsView.prototype._delegate = function(container, selector, type, handler) { //  событиt type запускает функцию handler относительно элемента с selector, находящегося в элементе container.
		container.addEventListener(type, function(e) {
			var el = e.target;
			do {
				if (el === container) return;
				if (!el.classList.contains(selector)) continue;
				e.delegateTarget = el;
				handler.apply(this, arguments);
				return;
			} while (el = el.parentNode);
		})
	};

	/** 
	 * Return an array of elements that have an index @param
	 *
	 * @param {string}, indexIdTab
	 * return {array}
	 */
	TabsView.prototype.getElementsByIndex = function(indexIdTab) {
		return this.element.querySelectorAll('[data-id=' + indexIdTab + ']');
	};

	TabsView.prototype._removeTab = function(event) {
		var indexIdTab = this._getIndexByHtml(event);
		this.deleteTab(indexIdTab);
	}



	/**
	 * Removes the tab in which the event occurred
	 *
	 * @param {object}, event 
	 * @return {undefined}
	 */
	TabsView.prototype.deleteTab = function(indexIdTab) {
		var elemsDelete = this.getElementsByIndex(indexIdTab);
		for (var i = 0; i < elemsDelete.length; i += 1) {
			if (elemsDelete[i].nextSibling) {
				this.activateTab(elemsDelete[i].nextSibling.getAttribute("data-id"));
			} else if (elemsDelete[i].previousSibling) {
				this.activateTab(elemsDelete[i].previousSibling.getAttribute("data-id"));
			}
			elemsDelete[i].remove();
		}
	};

	/**
	 * Creates a new tab
	 *
	 * @return {undefined}
	 */
	TabsView.prototype.createTab = function() {
		var data = {
			title: this.options.defaultTitle,
			descriptionTab: this.options.defaultDescription
		};
		this.addTab(data);
		this.activateTab(data.index);
		this.titleEditMode(data.index);
	};

	/**
	 * Edit mode title tab, which has index @param
	 *
	 * @param {string}, indexIdTab
	 * @return {undefined}
	 */
	TabsView.prototype.titleEditMode = function(indexIdTab) {
		var titleTab = this.getElementsByIndex(indexIdTab);
		var seachInput;
		var seachTitle;

		for (var i = 0; i < titleTab.length; i += 1) {
			seachInput = titleTab[i].querySelector('.inputZone');
			seachTitle = titleTab[i].querySelector('.titleZone');
			if (seachTitle || seachInput) {
				seachInput.classList.remove("noView");
				seachInput.focus();
				if (seachTitle.textContent === this.options.defaultTitle) {
					seachInput.style.width = 50 + "px";
				} else {
					seachInput.setAttribute("value", seachTitle.textContent);
					seachInput.style.width = seachTitle.offsetWidth + 5 + "px";
				}
				seachTitle.classList.add("noView");
			}
		}
	};

	/**
	 * View mode title tab which has index @param
	 *
	 * @param {string} , indexIdTab
	 * @return {undefined}
	 */
	TabsView.prototype.titleViewMode = function(indexIdTab) {
		var titleTab = this.getElementsByIndex(indexIdTab);
		var seachInput;
		var seachTitle;

		for (var i = 0; i < titleTab.length; i += 1) {
			seachInput = titleTab[i].querySelector('.inputZone');
			seachTitle = titleTab[i].querySelector('.titleZone');
			if (seachTitle || seachInput) {
				seachInput.classList.add("noView");
				seachTitle.classList.remove("noView");
			}
		}
	};

	/**
	 * Activates the edit mode title tab, on which the event occurred
	 *
	 * @param {object}, event
	 * @return {undefined}
	 */
	TabsView.prototype.editTitle = function(event) {
		var indexIdTab = this._getIndexByHtml(event);
		this.titleEditMode(indexIdTab);
		this.lastPressKey = event.keyCode;
	};

	/**
	 * Edit mode description tab, which has index @param
	 *
	 * @param {string}, indexIdTab
	 * @return {undefined}
	 */
	TabsView.prototype.descriptionEditMode = function(indexIdTab) {
		var descriptionContent = this.getElementsByIndex(indexIdTab);
		var seachInput;
		var seachTitle;

		for (var i = 0; i < descriptionContent.length; i += 1) {
			seachInput = descriptionContent[i].querySelector('.textareaZone');
			seachTitle = descriptionContent[i].querySelector('.content');
			if (seachTitle || seachInput) {
				seachInput.classList.remove("noView");
				seachInput.focus();
				if (seachTitle.textContent !== this.options.defaultDescription) {
					seachInput.innerHTML = seachTitle.textContent;
				}
				seachTitle.classList.add("noView");
			}
		}
	};

	/** 
	 * View mode description tab, which has index @param
	 *
	 * @param {string}, indexIdTab
	 * @return {undefined}
	 */
	TabsView.prototype.descriptionViewMode = function(indexIdTab) {
		var descriptionContent = this.getElementsByIndex(indexIdTab);
		var seachInput;
		var seachTitle;
		for (var i = 0; i < descriptionContent.length; i += 1) {
			seachInput = descriptionContent[i].querySelector('.textareaZone');
			seachTitle = descriptionContent[i].querySelector('.content');
			if (seachTitle || seachInput) {
				seachInput.classList.add("noView");
				seachTitle.classList.remove("noView");
			}
		}
	};

	/**
	 * Activates the edit mode description tab, on which the event occurred
	 *
	 * @param {object}, event
	 * @return {undefined}
	 */
	TabsView.prototype.editDescription = function(event) {
		var indexIdTab = this._getIndexByHtml(event);
		this.descriptionEditMode(indexIdTab);
		this.lastPressKey = event.keyCode;
	};

	/**
	 * Activates all events on the page
	 *
	 * @return {undefined}
	 */
	TabsView.prototype._assignHandlers = function() {
		this._delegate(this.element, 'tab-title', 'click', this._onTitleClick.bind(this));
		this._delegate(this.element, 'closeTag', 'click', this._removeTab.bind(this));
		this._delegate(this.element, 'newTab', 'click', this.createTab.bind(this));
		this._delegate(this.element, 'tab-title', 'dblclick', this.editTitle.bind(this));
		this._delegate(this.element, 'contentElemOfTab', 'dblclick', this.editDescription.bind(this));
		this._delegate(this.element, 'inputZone', 'keyup', this._onKeyupBlur.bind(this));
		this._delegate(this.element, 'textareaZone', 'keyup', this._onKeyupBlur.bind(this));
		this._delegate(this.element, 'inputZone', 'focusout', this._onKeyupBlur.bind(this));
		this._delegate(this.element, 'textareaZone', 'focusout', this._onKeyupBlur.bind(this));
		this._delegate(this.element, 'tab-title', 'click', this._changeHash.bind(this));
		this._delegate(this.element, 'tab-title', 'focusin', this._changeHash.bind(this));
		this._delegate(this.element, 'textareaZone', 'focusin', this._changeHash.bind(this));
	};

	window.TabsView = TabsView;


}());

/**
 * Polyfil Object.assign()   https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
if (!Object.assign) {
	Object.defineProperty(Object, 'assign', {
		enumerable: false,
		configurable: true,
		writable: true,
		value: function(target, firstSource) {
			'use strict';
			if (target === undefined || target === null) {
				throw new TypeError('Cannot convert first argument to object');
			}

			var to = Object(target);
			for (var i = 1; i < arguments.length; i++) {
				var nextSource = arguments[i];
				if (nextSource === undefined || nextSource === null) {
					continue;
				}

				var keysArray = Object.keys(Object(nextSource));
				for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
					var nextKey = keysArray[nextIndex];
					var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
					if (desc !== undefined && desc.enumerable) {
						to[nextKey] = nextSource[nextKey];
					}
				}
			}
			return to;
		}
	});
}

/**
 * focusin/out event polyfill (firefox)  https://gist.github.com/nuxodin/9250e56a3ce6c0446efa
 */
! function() {
	var w = window,
		d = w.document;

	if (w.onfocusin === undefined) {
		d.addEventListener('focus', addPolyfill, true);
		d.addEventListener('blur', addPolyfill, true);
		d.addEventListener('focusin', removePolyfill, true);
		d.addEventListener('focusout', removePolyfill, true);
	}

	function addPolyfill(e) {
		var type = e.type === 'focus' ? 'focusin' : 'focusout';
		var event = new CustomEvent(type, {
			bubbles: true,
			cancelable: false
		});
		event.c1Generated = true;
		e.target.dispatchEvent(event);
	}

	function removePolyfill(e) {
		if (!e.c1Generated) { // focus after focusin, so chrome will the first time trigger tow times focusin
			d.removeEventListener('focus', addPolyfill, true);
			d.removeEventListener('blur', addPolyfill, true);
			d.removeEventListener('focusin', removePolyfill, true);
			d.removeEventListener('focusout', removePolyfill, true);
		}
		setTimeout(function() {
			d.removeEventListener('focusin', removePolyfill, true);
			d.removeEventListener('focusout', removePolyfill, true);
		});
	}

}();