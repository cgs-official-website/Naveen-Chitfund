import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as ws_status;
import '../constants/api_config.dart';
import '../storage/secure_storage_service.dart';

enum SocketConnectionState { connecting, connected, disconnected, reconnecting }

/// A minimal Socket.IO-protocol-compatible client for the live auction room.
///
/// NOTE: the backend uses socket.io-server. For a production build, swap this
/// for the `socket_io_client` package (Engine.IO/Socket.IO handshake, ack
/// frames, auto-reconnect) rather than hand-rolling the wire protocol — this
/// class models the *interface* the auction screen needs (connect, join a
/// room, listen for bid/close events, reconnect on drop) so the screen layer
/// doesn't need to change when that swap happens.
class AuctionSocketService {
  WebSocketChannel? _channel;
  StreamController<Map<String, dynamic>>? _eventsController;
  final _connectionStateController = StreamController<SocketConnectionState>.broadcast();
  Timer? _reconnectTimer;
  String? _currentAuctionId;
  bool _manuallyDisconnected = false;

  Stream<SocketConnectionState> get connectionState => _connectionStateController.stream;

  Stream<Map<String, dynamic>> connectToAuction(String auctionId) {
    _manuallyDisconnected = false;
    _currentAuctionId = auctionId;
    _eventsController ??= StreamController<Map<String, dynamic>>.broadcast();
    _open();
    return _eventsController!.stream;
  }

  Future<void> _open() async {
    _connectionStateController.add(SocketConnectionState.connecting);
    try {
      final token = await SecureStorageService.instance.getToken();
      final uri = Uri.parse('${ApiConfig.socketUrl}/socket.io/?EIO=4&transport=websocket');
      _channel = WebSocketChannel.connect(uri);

      _channel!.stream.listen(
        (message) => _handleMessage(message, token),
        onError: (_) => _handleDisconnect(),
        onDone: _handleDisconnect,
      );

      // Join the auction room once the socket is open (fire-and-forget; the
      // backend's join_auction handler tolerates a missing/invalid token for
      // read-only viewers — writes are still enforced via the REST bid endpoint).
      _send('join_auction', {'auctionId': _currentAuctionId, 'token': token});
      _connectionStateController.add(SocketConnectionState.connected);
    } catch (_) {
      _handleDisconnect();
    }
  }

  void _send(String event, Map<String, dynamic> payload) {
    try {
      _channel?.sink.add(jsonEncode({'event': event, 'data': payload}));
    } catch (_) {
      // socket not ready yet — reconnection logic will retry the join.
    }
  }

  void _handleMessage(dynamic raw, String? token) {
    try {
      final decoded = jsonDecode(raw is String ? raw : utf8.decode(raw));
      if (decoded is Map<String, dynamic>) {
        _eventsController?.add(decoded);
      }
    } catch (_) {
      // ignore malformed/protocol frames
    }
  }

  void _handleDisconnect() {
    if (_manuallyDisconnected) return;
    _connectionStateController.add(SocketConnectionState.disconnected);
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      if (_manuallyDisconnected || _currentAuctionId == null) return;
      _connectionStateController.add(SocketConnectionState.reconnecting);
      _open();
    });
  }

  void disconnect() {
    _manuallyDisconnected = true;
    _reconnectTimer?.cancel();
    _channel?.sink.close(ws_status.goingAway);
    _currentAuctionId = null;
  }

  void dispose() {
    disconnect();
    _eventsController?.close();
    _connectionStateController.close();
  }
}
