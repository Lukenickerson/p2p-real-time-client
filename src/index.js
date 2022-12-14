import ui from './ui.js';
import Client from './Client.js';

const urlParams = new URLSearchParams(window.location.search);
const peerName = urlParams.getAll('p')[0] || null;
console.log(peerName);

const client = new Client({
	peerId: peerName,
	onOpen: (id) => {
		ui.updatePeerId(id);
	},
	onConnectionChange: () => {
		ui.updateConnectionCount(client.getOpenConnectionCount());
		const peerNameArr = client.getOpenConnections().map((conn) => conn.peer);
		ui.updateConnectionList(`[${peerNameArr.join(', ')}]`);
	},
	onLog: (logType, ...args) => {
		ui.appendOutput(logType, ...args);
	},
});

ui.onConnect((value) => {
	client.connectToPeer(value);
});

ui.onSend((text, peerId) => {
	client.sendTextToPeer(text, /* peerId */); // TODO: leave peerId out until it can be selected from the UI
});

ui.onChangePeerId((id) => {
	client.changePeerId(id);
});

ui.onClearPeerId(() => {
	client.changePeerId();
});

ui.updatePeerName(peerName);

window.client = client;
