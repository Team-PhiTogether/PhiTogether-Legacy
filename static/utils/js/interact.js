export default class InterAct {
	/** @param {HTMLElement} element */
	constructor(element) {
		this.element = element;
		this.callbacks = [];
	}
	/**
	 * @typedef {object} MouseCallbacks
	 * @property {(ev:MouseEvent)} mousedownCallback
	 * @property {(ev:MouseEvent)} mousemoveCallback
	 * @property {(ev:MouseEvent)} mouseupCallback
	 * @property {(ev:MouseEvent)} mouseoutCallback
	 * @param {MouseCallbacks} param0
	 */
	setMouseEvent({
		mousedownCallback = function() {},
		mousemoveCallback = function() {},
		mouseupCallback = function() {},
		mouseoutCallback = function() {}
	}) {
		const mousedown = evt => {
			evt.preventDefault();
			mousedownCallback(evt);
		}
		// 韪╁潙锛氬move鍜寀p杩涜preventDefault浼氬奖鍝峣nput鍏冪礌浜や簰
		const mousemove = evt => {
			mousemoveCallback(evt);
		}
		const mouseup = evt => {
			mouseupCallback(evt);
		}
		const mouseout = evt => {
			mouseoutCallback(evt);
		}
		this.element.addEventListener('mousedown', mousedown);
		self.addEventListener('mousemove', mousemove);
		self.addEventListener('mouseup', mouseup);
		this.element.addEventListener('mouseout', mouseout);
		return this.callbacks.push({ mousedown, mousemove, mouseup, mouseout }) - 1;
	}
	/** @param {number} [id] */
	clearMouseEvent(id) {
		const { mousedown, mousemove, mouseup, mouseout } = this.callbacks[id];
		this.element.removeEventListener('mousedown', mousedown);
		self.removeEventListener('mousemove', mousemove);
		self.removeEventListener('mouseup', mouseup);
		this.element.removeEventListener('mouseout', mouseout);
		this.callbacks[id] = null;
	}
	/**
	 * @typedef {object} TouchCallbacks
	 * @property {(ev:TouchEvent)} touchstartCallback
	 * @property {(ev:TouchEvent)} touchmoveCallback
	 * @property {(ev:TouchEvent)} touchendCallback
	 * @property {(ev:TouchEvent)} touchcancelCallback
	 * @param {TouchCallbacks} param0
	 */
	setTouchEvent({
		touchstartCallback = function() {},
		touchmoveCallback = function() {},
		touchendCallback = function() {},
		touchcancelCallback = function() {}
	}) {
		const passive = { passive: false }; //warning
		const touchstart = evt => {
			evt.preventDefault();
			touchstartCallback(evt);
		}
		const touchmove = evt => {
			evt.preventDefault();
			touchmoveCallback(evt);
		}
		const touchend = evt => {
			evt.preventDefault();
			touchendCallback(evt);
		}
		const touchcancel = evt => {
			evt.preventDefault();
			touchcancelCallback(evt);
		}
		this.element.addEventListener('touchstart', touchstart, passive);
		this.element.addEventListener('touchmove', touchmove, passive);
		this.element.addEventListener('touchend', touchend);
		this.element.addEventListener('touchcancel', touchcancel);
		return this.callbacks.push({ touchstart, touchmove, touchend, touchcancel }) - 1;
	}
	/** @param {number} [id] */
	clearTouchEvent(id) {
		const { touchstart, touchmove, touchend, touchcancel } = this.callbacks[id];
		this.element.removeEventListener('touchstart', touchstart);
		this.element.removeEventListener('touchmove', touchmove);
		this.element.removeEventListener('touchend', touchend);
		this.element.removeEventListener('touchcancel', touchcancel);
		this.callbacks[id] = null;
	}
	/**
	 * @typedef {object} KeyboardCallbacks
	 * @property {(ev:KeyboardEvent)} keydownCallback
	 * @property {(ev:KeyboardEvent)} keyupCallback
	 * @param {KeyboardCallbacks} param0
	 */
	setKeyboardEvent({
		keydownCallback = function() {},
		keyupCallback = function() {}
	}) {
		const isInput = () => {
			if (document.activeElement instanceof HTMLTextAreaElement) return true;
			if (document.activeElement instanceof HTMLInputElement) {
				const type = document.activeElement.getAttribute('type');
				if (/^(button|checkbox|image|radio|reset|submit)$/.test(type)) return false;
				return true;
			}
			return false;
		}
		const keydown = evt => {
			if (isInput()) return;
			evt.preventDefault();
			keydownCallback(evt);
		}
		const keyup = evt => {
			if (isInput()) return;
			evt.preventDefault();
			keyupCallback(evt);
		}
		self.addEventListener('keydown', keydown);
		self.addEventListener('keyup', keyup);
		return this.callbacks.push({ keydown, keyup }) - 1;
	}
	/** @param {number} [id] */
	clearKeyboardEvent(id) {
		const { keydown, keyup } = this.callbacks[id];
		self.removeEventListener('keydown', keydown);
		self.removeEventListener('keyup', keyup);
		this.callbacks[id] = null;
	}
}