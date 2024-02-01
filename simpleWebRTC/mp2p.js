import STUN_SERVERS from './STUN_SERVERS.js';

const OFFER = 'offer';
const ANSWER = 'answer';
const CHANNEL_NAME = 'test';

let activeChannel;

function makePeerConnection(eventHandlers = {}) {
	var cfg = { 'iceServers': STUN_SERVERS.map((url) => ({ 'url': `stun:${url}` }))};
	let con = { 'optional': [{'DtlsSrtpKeyAgreement': true}] };
	const pc = new RTCPeerConnection(cfg, con);
	pc.onconnectionstatechange = (e) => console.log('peer connection onconnectionstatechange');
	pc.ondatachannel = (e) => console.log('peer connection ondatachannel');
	pc.onnegotiationneeded = (e) => console.log('peer connection onnegotiationneeded');
	pc.onsignalingstatechange = (e) => console.log('peer connection onsignalingstatechange');
	pc.ontrack = (e) => console.log('peer connection ontrack');
	// ICE events
	pc.onicecandidate = (e) => console.log('peer connection onicecandidate');
	pc.onicecandidateerror = (e) => console.log('peer connection onicecandidateerrpr');
	pc.oniceconnectionstatechange = (e) => console.log('peer connection oniceconnectionstatechange');
	pc.onicegatheringstatechange = (e) => console.log('peer connection onicegatheringstatechange', e, pc.iceGatheringState);
	if (eventHandlers.onIceCandidate) {
		pc.onicecandidate = (e) => {
			console.log(e);
			if (e.candidate !== null || pc.iceGatheringState !== 'complete') return;
			eventHandlers.onIceCandidate(e, pc.localDescription);
		};
	}
	return pc;
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

function offer(options) {
	let offerCode, peerConnection, channel;
	return new Promise((resolve) => {
		const onIceCandidate = (e, localDescription) => {
			offerCode = encodeDescription(localDescription);
			resolve({ channel, peerConnection, offerCode });
		};
		peerConnection = makePeerConnection({ onIceCandidate });
		channel = makeChannel({ peerConnection, ...options });
		setupConnection(peerConnection, OFFER);
	});
}

async function join(offerCode, options) {
	let joinCode, peerConnection, channel;
	return new Promise((resolve) => {
		const onIceCandidate = (e, localDescription) => {
			joinCode = encodeDescription(localDescription);
			resolve({ channel, peerConnection, joinCode });
		};
		peerConnection = makePeerConnection({ onIceCandidate });
		peerConnection.ondatachannel = (e) => {
			channel = makeChannel({ channel: (e.channel || e), onChat });
		};
		connectByEncodedString(peerConnection, offerCode);
		setupConnection(peerConnection, ANSWER);
		return { channel, peerConnection };
	});
}

function accept(answerCode, peerConnection) {
	connectByEncodedString(peerConnection, answerCode);
}

const mP2P = { offer, join, accept };
export { offer, join, accept };
export default mP2P;
