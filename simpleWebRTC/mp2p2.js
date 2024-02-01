import STUN_SERVERS from './STUN_SERVERS.js';

const OFFER = 'offer';
const ANSWER = 'answer';
const CHANNEL_NAME = 'test';
const PEER_CONNECTION_EVENTS = [
	'connectionstatechange',
	'datachannel',
	'negotiationneeded',
	'signalingstatechange',
	'track',
	'icecandidate',
	'icecandidateerror',
	'iceconnectionstatechange',
	'icegatheringstatechange',
];

function addPeerConnectionLogs(pc) {
	PEER_CONNECTION_EVENTS.forEach((key) => {
		const fnName = `on${key}`;
		pc[fnName] = (e) => console.log('peer connection on', key);
	});
}

function makePeerConnection() {
	var cfg = { 'iceServers': STUN_SERVERS.map((url) => ({ 'url': `stun:${url}` }))};
	let con = { 'optional': [{'DtlsSrtpKeyAgreement': true}] };
	const pc = new RTCPeerConnection(cfg, con);
	addPeerConnectionLogs(pc);
	// pc.onconnectionstatechange = (e) => console.log(e);
	return pc;
}

// TODO: Use a class to tie together connection with channels?
/*
class MPeerConnection {
	constructor(type, code, options) {
		this.connection = makePeerConnection();
		this.channels = [];
		makePeerConnectionChannel
	}

	connect(code) { connectByEncodedString(this.connection, code); }
}
*/

async function makePeerConnectionChannel(type, code, options) {
	const pc = makePeerConnection();
	pc.channels = [];
	pc.onicecandidateerror = (e) => {
		console.warn('ice candidate error', e);
		// reject(new Error('ice candidate error'));
	};
	const icePromise = new Promise(async (resolve, reject) => {
		pc.onicecandidate = (e) => {
			console.log('ice candidate', Boolean(e.candidate), pc.iceGatheringState);
			if (e.candidate !== null || pc.iceGatheringState !== 'complete') return;
			resolve();
		};
	});
	const channelPromise = new Promise((resolve, reject) => {
		if (type === ANSWER) {
			pc.ondatachannel = (e) => {
				console.log('---', e.type);
				const channel = makeChannel({ channel: (e.channel || e), ...options });
				pc.channels.push(channel);
				// if (!pc || !channel) return;
				resolve(channel);
			};
			resolve(); // TODO: fix this
		} else {
			const channel = makeChannel({ peerConnection: pc, ...options });
			pc.channels.push(channel);
			resolve(channel);
		}
	});
	if (code) {
		connectByEncodedString(pc, code);
	}
	const sdpDescFn = (type === OFFER) ? () => pc.createOffer() : () => pc.createAnswer();
	const sdpDescription = await sdpDescFn();
	pc.setLocalDescription(sdpDescription);
	const arr = await Promise.allSettled([icePromise, channelPromise]);
	const channel = arr[1].value;
	console.log(arr);
	return { channel, peerConnection: pc };
}

function encodeDescription(sessionDescription) {
	const { type, sdp } = sessionDescription;
	const sdpEncoded = btoa(sdp).replaceAll('=', '');
	return [type.toUpperCase(), sdpEncoded, 'END'].join('_');
	// Simpler encoding:
	// return btoa(JSON.stringify(sessionDescription));
}

function decodeDescription(str) {
	const [typeUp, sdpBase64, end] = str.split('_');
	if (end !== 'END') console.warn('no END');
	const obj = { type: typeUp.toLowerCase(), sdp: atob(sdpBase64) };
	return new RTCSessionDescription(obj);
}

function connectByEncodedString(pc, str) {
	const desc = decodeDescription(str);
	pc.setRemoteDescription(desc);
}

function defaultMessageHandler(e, options) {
	const { onChat } = options;
	console.log(e.data);
	if (e.data.size) {
		// fileReceiver1.receive(e.data, {})
	} else {
		// if (e.data.charCodeAt(0) == 2) {
		// 	console.log('start');
		// 	return;
		// }
		const data = JSON.parse(e.data);
		if (data.type === 'file') {
			// fileReceiver1.receive(e.data, {})
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

async function offer(options) {
	const { peerConnection, channel } = await makePeerConnectionChannel(OFFER, null, options);
	const offerCode = encodeDescription(peerConnection.localDescription);
	return { channel, peerConnection, offerCode };
}

async function join(offerCode, options) {
	const { peerConnection, channel } = await makePeerConnectionChannel(ANSWER, offerCode, options);
	const joinCode = encodeDescription(peerConnection.localDescription);
	return { channel, peerConnection, joinCode };
}

function accept(peerConnection, answerCode) {
	connectByEncodedString(peerConnection, answerCode);
}

function send(param1, param2) {
	const pc = param1; // TODO: Allow channels or mpc to be used?
	const obj = (typeof param2 === 'string') ? { message: param2 } : param2;
	pc.channels[0].send(JSON.stringify(obj));
}

const mp2p = { offer, join, accept, send };
export { offer, join, accept, send };
export default mp2p;
