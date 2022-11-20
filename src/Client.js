// Expects Peer on the window scope

const NOOP = () => {};

class Client {
	constructor({
		peerId,
		onOpen = NOOP,
		onConnectionChange = NOOP,
	} = {}) {
		this.Peer = window.Peer;
		if (!this.Peer) console.error('No Peer found on window scope');
		this.peerId = peerId || undefined; // undefined --> automatically generate
		this.peer = null; // created later
		// hooks
		this.onOpen = onOpen;
		this.onConnectionChange = onConnectionChange;
		// Start it up
		this.setupPeer();
	}

	handlePeerInput(data, conn) {
		console.log('Received', data, 'from connection', conn.peer);
	}

	handlePeerClose() {
		// TODO
		console.log('Peer close not supported yet');
	}

	handlePeerDisconnected() {
		// TODO
		console.log('Peer disconnect not supported yet');
	}

	handlePeerError(err) {
		console.error('Peer error:', err);
	}

	handlePeerConnection(conn) {
		console.log('Connection was made to peer', conn.peer, '\n', conn);
		conn.on('data', (data) => this.handlePeerInput(data, conn));
		console.log('Total connections:', Object.keys(this.peer.connections));
		conn.on('open', () => this.onConnectionChange());
		conn.on('close', () => this.onConnectionChange());
		conn.on('error', (err) => this.handlePeerError(err)); // TODO: handle connection error different?
		this.onConnectionChange();
	}

	setupPeer() {
		const Peer = this.Peer || window.Peer;
		this.peer = new Peer(this.peerId);
		this.peer.on('open', (id) => {
			console.log('My peer ID is:', id);
			this.peerId = id;
			this.onOpen(id);
		});
		this.peer.on('connection', (conn) => {
			this.handlePeerConnection(conn);
		});
		this.peer.on('call', () => console.warn('Not supported'));
		this.peer.on('close', () => this.handlePeerClose());
		this.peer.on('disconnected', () => this.handlePeerDisconnected());
		this.peer.on('error', (err) => this.handlePeerError(err));
	}

	connectToPeer(peerId) {
		console.log('Connecting to', peerId, '...');
		const conn = this.peer.connect(peerId);
		this.handlePeerConnection(conn);
	}

	disconnectFromPeer() {
		this.peer.disconnect();
		// this.peer.destroy();
	}

	getFirstPeerId() {
		const connectionKeys = Object.keys(this.peer.connections);
		return connectionKeys[0];
	}

	sendTextToPeer(text, peerIdParam) {
		const peerId = peerIdParam || this.getFirstPeerId();
		const conn = this.peer.connections[peerId][0]; // TODO: handle when there are multiple connections per peer id?
		console.log('Sending text', text, 'to connection', conn.peer, conn);
		conn.send(text);
	}

	getAllConnections() {
		const connectionKeys = Object.keys(this.peer.connections);
		return connectionKeys.reduce((arr, key) => {
			return arr.concat(this.peer.connections[key]);
		}, []);
	}

	getOpenConnections() {
		return this.getAllConnections().filter((conn) => conn.open);
	}

	getOpenConnectionCount() {
		return this.getOpenConnections().length;
	}

	async changePeerId(id) {
		this.peerId = id;
		await this.peer.destroy();
		this.setupPeer();
	}
}

export default Client;
