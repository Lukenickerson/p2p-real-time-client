const NOOP = () => {};
const doc = window.document;
const $ = (selector) => doc.querySelector(selector);

function getConnectPeerId() {
	return $('#connect-peer-id').value;
}

function getSendText() {
	return $('#send-text').value;
}

function getMyPeerId() {
	return $('#peer-id').value;
}

let connectionFn = () => console.log('click');
$('.connect-button').onclick = () => connectionFn(getConnectPeerId());

let sendFn = () => {};
$('.send-button').onclick = () => sendFn(getSendText(), getConnectPeerId());

let changePeerId = NOOP;
$('#peer-id').onchange = () => changePeerId(getMyPeerId());

let clearPeerId;
$('.clear-peer-id').onclick = () => clearPeerId();


const ui = {
	updatePeerName(n) {
		$('.peer-number').innerText = n;
	},
	updateConnectionCount(n) {
		$('.connection-count').innerText = n;
	},
	updatePeerId(id) {
		if (id === getMyPeerId()) return;
		console.log('Updating peer id');
		$('#peer-id').value = id || '???';
	},
	updateConnectionList(text) {
		$('.connection-list').innerText = text;
	},
	onConnect(fn) { connectionFn = fn; },
	onSend(fn) { sendFn = fn; },
	onChangePeerId(fn) { changePeerId = fn; },
	onClearPeerId(fn) { clearPeerId = fn; },
};

export default ui;
