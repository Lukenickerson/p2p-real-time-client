// Expects Peer on the window scope

const NOOP = () => {};

class Client {
	constructor({
		peerId,
		onOpen = NOOP,
		onConnectionChange = NOOP,
		onLog = NOOP,
	} = {}) {
		// hooks
		this.onOpen = onOpen;
		this.onConnectionChange = onConnectionChange;
		this.onLog = onLog;
		// Peer
		this.Peer = window.Peer;
		if (!this.Peer) this.log('error', 'No Peer found on window scope');
		this.peerId = peerId || undefined; // undefined --> automatically generate
		this.peer = null; // created later
		// Start it up
		this.setupPeer();
	}

	log(...args) {
		if (!args || !args.length) return;
		let method = 'log';
		if (args[0] === 'warn' || args[0] === 'error' || args[0] === 'info') {
			method = args[0];
		}
		// console[method](...args);
		this.onLog(method, ...args);
	}

	handlePeerInput(data, conn) {
		this.log('Received', data, 'from connection', conn.peer);
	}

	handlePeerClose() {
		this.log('Peer closed');
	}

	handlePeerDisconnected() {
		this.log('Peer disconnected');
	}

	handlePeerError(err) {
		this.log('error', 'Peer error:', err);
	}

	handlePeerConnection(conn) {
		this.log('Connection was attempted to peer', conn.peer, '\n', conn);
		conn.on('data', (data) => this.handlePeerInput(data, conn));
		this.log('Total connections (open or not):', Object.keys(this.peer.connections));
		conn.on('open', () => this.onConnectionChange());
		conn.on('close', () => this.onConnectionChange());
		conn.on('error', (err) => this.handlePeerError(err)); // TODO: handle connection error different?
		this.onConnectionChange();
	}

	setupPeer() {
		const Peer = this.Peer || window.Peer;
		this.peer = new Peer(this.peerId);
		this.peer.on('open', (id) => {
			this.log('My peer ID is:', id);
			this.peerId = id;
			this.onOpen(id);
		});
		this.peer.on('connection', (conn) => {
			this.handlePeerConnection(conn);
		});
		this.peer.on('call', () => this.log('warn', 'Call not supported'));
		this.peer.on('close', () => this.handlePeerClose());
		this.peer.on('disconnected', () => this.handlePeerDisconnected());
		this.peer.on('error', (err) => this.handlePeerError(err));
	}

	connectToPeer(peerId) {
		this.log('Connecting to', peerId, '...');
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
		if (!peerId) {
			this.log('error', 'Cannot send text - No peerId');
			return;
		}
		const peerObj = this.peer.connections[peerId];
		if (!peerObj) {
			this.log('error', 'Cannot send text - No peer connection');
			return;
		}
		const conn = peerObj[0]; // TODO: handle when there are multiple connections per peer id?
		this.log('Sending text', text, 'to connection', conn.peer, conn);
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
