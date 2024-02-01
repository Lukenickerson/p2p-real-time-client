// import STUN_SERVERS from './STUN_SERVERS.js';
import { offer, join, accept } from './mp2p2.js';

/*

const OFFER = 'offer';
const ANSWER = 'answer';
const CHANNEL_NAME = 'test';

let activeChannel;

function makePeerConnection(eventHandlers = {}) {
	var cfg = { 'iceServers': STUN_SERVERS.map((url) => ({ 'url': `stun:${url}` }))};
	let con = { 'optional': [{'DtlsSrtpKeyAgreement': true}] };
	const pc = new RTCPeerConnection(cfg, con);
	if (eventHandlers.onIceCandidate) {
		pc.onicecandidate = (e) => {
			if (e.candidate !== null) return;
			eventHandlers.onIceCandidate(e, pc.localDescription);
		};
	}
	pc.onconnectionstatechange = (e) => console.log(e);
	pc.ondatachannel = (e) => console.log(e);
	pc.onicecandidateerrpr = (e) => console.log(e);
	pc.oniceconnectionstatechange = (e) => console.log(e);
	pc.onicegatheringstatechange = (e) => console.log(e);
	pc.onnegotiationneeded = (e) => console.log(e);
	pc.onsignalingstatechange = (e) => console.log(e);
	pc.ontrack = (e) => console.log(e);
	return pc;
}

const pc1 = makePeerConnection({
	onIceCandidate: (e, localDescription) => {
		localOffer.value = encodeDescription(localDescription);
	},
});

const pc2 = makePeerConnection({
	onIceCandidate: (e, localDescription) => {
		localAnswer.value = encodeDescription(localDescription);
	},
});
pc2.ondatachannel = function (e) {
	const channel = e.channel || e;
	activeChannel = makeChannel({ channel, onChat });
}

function encodeDescription(localDescription) {
	return btoa(JSON.stringify(localDescription));
}

function decodeDescription(str) {
	const obj = JSON.parse(atob(str));
	return new RTCSessionDescription(obj);
}

function connectByEncodedString(pc, str) {
	const desc = decodeDescription(str);
	pc.setRemoteDescription(desc);
}

async function setupConnection(pc, type) {
	const sdpDescFn = (type === OFFER) ? () => pc.createOffer() : () => pc.createAnswer();
	const sdpDescription = await sdpDescFn();
	pc.setLocalDescription(sdpDescription);
}

function defaultMessageHandler(e, options) {
	const { onChat } = options;
	console.log(e.data);
	if (e.data.size) {
		fileReceiver1.receive(e.data, {})
	} else {
		// if (e.data.charCodeAt(0) == 2) {
		// 	console.log('start');
		// 	return;
		// }
		var data = JSON.parse(e.data)
		if (data.type === 'file') {
			fileReceiver1.receive(e.data, {})
		} else {
			onChat(data);
		}
	}
}

function makeChannel(options = {}) {
	let dc;
	const { name = CHANNEL_NAME, peerConnection, channel, onMessage } = options;
	if (channel) {
		dc = channel;
	} else {
		dc = peerConnection.createDataChannel(name, { reliable: true });
	}
	dc.onbufferedamountlow = (e) => console.log('onbufferedamountlow', e);
	dc.onclose = (e) => console.log('onclose', e);
	dc.onclosing = (e) => console.log('onclosing', e);
	dc.onerror = (e) => console.log('onerror', e);
	dc.onopen = (e) => console.log('open', e);
	if (onMessage) dc.onmessage = (e) => onMessage(e);
	else {
		dc.onmessage = (e) => defaultMessageHandler(e, options);
	}
	return dc;
}
*/

// ----------------- UI

let activeChannel;
// Clear UI
localOffer.value = remoteAnswer.value = remoteOffer.value = localAnswer.value = "";

function handleError(err) {
	console.error(err);
	alert(err.message);
}

createBtn.onclick = async () => {
	try {
		const { channel, offerCode } = await offer({ onChat });
		localOffer.value = offerCode;
		activeChannel = channel;
	} catch (err) {
		handleError(err);
	}
};

offerRecdBtn.onclick = async () => {
	try {
		const { channel, joinCode } = await join(remoteOffer.value, { onChat });
		localAnswer.value = joinCode;
		activeChannel = channel;
	} catch (err) {
		handleError(err);
	}
};

answerRecdBtn.onclick = () => {
	accept(activeChannel, remoteAnswer.value);
};

function onChat(data) {
	const el = document.querySelector('#chat-log');
	el.innerHTML += `<div class="chat">[${(new Date())}] ${data.chat || data.message}</div>`;
	el.scrollTop = el.scrollHeight
}

function sendMessage () {
	const msgStr = messageTextBox.value;
	if (!msgStr) return;
	try {
		activeChannel.send(JSON.stringify({ message: msgStr }));
		const el = document.querySelector('#chat-log');
		el.innerHTML += '<div class="chat my-chat">[' + new Date() + '] ' + msgStr + '</div>';
		messageTextBox.value = '';
	} catch (err) {
		handleError(err);
	}
}

sendMessageBtn.onclick = sendMessage;
