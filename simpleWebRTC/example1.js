import { offer, join, accept, send } from './mp2p2.js';

let activePeerConnection;
let activeChannel;
// Clear UI
localOffer.value = remoteAnswer.value = remoteOffer.value = localAnswer.value = "";

function handleError(err) {
	console.error(err);
	alert(err.message);
}

function writeChat(message, mine = false, date = new Date()) {
	const el = document.querySelector('#chat-log');
	el.innerHTML += `<div class="chat${mine ? ' my-chat' : ''}">[${(new Date())}] ${message}</div>`;
	el.scrollTop = el.scrollHeight;
}

function onChat(data) {
	writeChat(data.chat || data.message, false);
}

function sendMessage () {
	const message = messageTextBox.value;
	if (!message) return;
	try {
		send(activePeerConnection, message);
		// activeChannel.send(JSON.stringify({ message }));
		writeChat(message, true);
		messageTextBox.value = '';
	} catch (err) {
		handleError(err);
	}
}

function activate(channel, peerConnection) {
	activePeerConnection = peerConnection;
	activeChannel = channel;
}

createBtn.onclick = async () => {
	try {
		const { channel, offerCode, peerConnection } = await offer({ onChat });
		localOffer.value = offerCode;
		activate(channel, peerConnection);
	} catch (err) {
		handleError(err);
	}
};

offerRecdBtn.onclick = async () => {
	try {
		const { channel, joinCode, peerConnection } = await join(remoteOffer.value, { onChat });
		localAnswer.value = joinCode;
		activate(channel, peerConnection);
	} catch (err) {
		handleError(err);
	}
};

answerRecdBtn.onclick = () => {
	accept(activePeerConnection, remoteAnswer.value);
};

sendMessageBtn.onclick = sendMessage;
