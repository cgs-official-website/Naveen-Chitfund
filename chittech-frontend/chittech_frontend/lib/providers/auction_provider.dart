import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/dio_client.dart';
import '../core/network/socket_service.dart';
import '../models/auction.dart';

class AuctionRepository {
  Future<List<ChitAuction>> listForGroup(String groupId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/chit-groups/$groupId/auctions', queryParameters: {'limit': 50}),
      (data) => (data['items'] as List).map((e) => ChitAuction.fromJson(e)).toList(),
    );
  }

  Future<ChitAuction> get(String auctionId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.get('/auctions/$auctionId'),
      (data) => ChitAuction.fromJson(Map<String, dynamic>.from(data)),
    );
  }

  Future<ChitAuction> schedule(String groupId, int monthNumber) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/chit-groups/$groupId/auctions', data: {'monthNumber': monthNumber}),
      (data) => ChitAuction.fromJson(Map<String, dynamic>.from(data)),
    );
  }

  Future<void> start(String auctionId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/auctions/$auctionId/start'),
      (data) => data,
    );
  }

  Future<Map<String, dynamic>> placeBid(String auctionId, double bidPct) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/auctions/$auctionId/bid', data: {'bidPct': bidPct}),
      (data) => Map<String, dynamic>.from(data),
    );
  }

  Future<Map<String, dynamic>> close(String auctionId) {
    return DioClient.instance.unwrap(
      () => DioClient.instance.dio.post('/auctions/$auctionId/close'),
      (data) => Map<String, dynamic>.from(data),
    );
  }
}

final auctionRepositoryProvider = Provider((ref) => AuctionRepository());

/// One live socket connection per auction screen instance. Disposed with the screen.
final auctionSocketProvider = Provider.autoDispose.family<AuctionSocketService, String>((ref, auctionId) {
  final service = AuctionSocketService();
  ref.onDispose(service.dispose);
  return service;
});

final auctionEventsStreamProvider = StreamProvider.autoDispose.family<Map<String, dynamic>, String>((ref, auctionId) {
  return ref.watch(auctionSocketProvider(auctionId)).connectToAuction(auctionId);
});

final auctionConnectionStateProvider =
    StreamProvider.autoDispose.family<SocketConnectionState, String>((ref, auctionId) {
  return ref.watch(auctionSocketProvider(auctionId)).connectionState;
});
