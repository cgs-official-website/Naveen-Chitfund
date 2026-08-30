import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../core/network/socket_service.dart';
import '../../core/theme/app_theme.dart';
import '../../models/auction.dart';
import '../../providers/auction_provider.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/state_widgets.dart';

class AdminLiveAuctionControlScreen extends ConsumerStatefulWidget {
  final String auctionId;
  const AdminLiveAuctionControlScreen({super.key, required this.auctionId});

  @override
  ConsumerState<AdminLiveAuctionControlScreen> createState() => _AdminLiveAuctionControlScreenState();
}

class _AdminLiveAuctionControlScreenState extends ConsumerState<AdminLiveAuctionControlScreen> {
  final List<BidEvent> _allBids = [];
  double? _lowestBid;
  bool _starting = false;
  bool _closing = false;
  bool _closed = false;
  Map<String, dynamic>? _closeResult;

  void _handleEvent(Map<String, dynamic> event) {
    final type = event['event'];
    final data = Map<String, dynamic>.from(event['data'] ?? {});
    if (type == 'bid_placed') {
      final bid = BidEvent.fromJson(data);
      setState(() {
        _lowestBid = bid.bidPct;
        _allBids.insert(0, bid);
      });
    } else if (type == 'auction_closed') {
      setState(() => _closed = true);
    }
  }

  Future<void> _start() async {
    setState(() => _starting = true);
    try {
      await ref.read(auctionRepositoryProvider).start(widget.auctionId);
      ref.invalidate(_auctionProvider(widget.auctionId));
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  Future<void> _forceClose() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Close auction?'),
        content: const Text('This finalizes the winner and runs the dividend calculation. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Close auction')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _closing = true);
    try {
      final result = await ref.read(auctionRepositoryProvider).close(widget.auctionId);
      setState(() {
        _closed = true;
        _closeResult = result;
      });
    } on ApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _closing = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final auctionAsync = ref.watch(_auctionProvider(widget.auctionId));

    return Scaffold(
      appBar: AppBar(title: const Text('Auction control')),
      body: auctionAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 3),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(_auctionProvider(widget.auctionId))),
        data: (auction) {
          if (auction.status == 'SCHEDULED') {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.event_outlined, size: 56, color: AppColors.navy300),
                  const SizedBox(height: 16),
                  Text('Month ${auction.monthNumber} auction is scheduled', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 20),
                  PrimaryButton(label: 'Start auction (go live)', loading: _starting, onPressed: _start),
                ],
              ),
            );
          }

          if (auction.status == 'COMPLETED' || _closed) {
            return _buildClosedResult(auction);
          }

          // LIVE
          final eventsAsync = ref.watch(auctionEventsStreamProvider(widget.auctionId));
          ref.listen(auctionEventsStreamProvider(widget.auctionId), (prev, next) {
            next.whenData(_handleEvent);
          });

          return eventsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(auctionSocketProvider(widget.auctionId))),
            data: (_) => Column(
              children: [
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: AppColors.navy700, borderRadius: BorderRadius.circular(20)),
                  child: Column(
                    children: [
                      const Text('Current lowest bid', style: TextStyle(color: Colors.white70)),
                      const SizedBox(height: 8),
                      Text(
                        _lowestBid != null ? '${_lowestBid!.toStringAsFixed(2)}%' : '— No bids yet —',
                        style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Text('${_allBids.length} bids received', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    ],
                  ),
                ),
                Expanded(
                  child: _allBids.isEmpty
                      ? const EmptyStateView(
                          icon: Icons.gavel_outlined,
                          title: 'Waiting for bids',
                          message: 'Bids from subscribers will stream in here as they arrive.',
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _allBids.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, i) {
                            final bid = _allBids[i];
                            return ListTile(
                              leading: CircleAvatar(child: Text('#${bid.ticketNumber}')),
                              title: Text('${bid.bidPct.toStringAsFixed(2)}%'),
                              trailing: Text('${bid.bidAt.hour}:${bid.bidAt.minute.toString().padLeft(2, '0')}'),
                            );
                          },
                        ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: PrimaryButton(
                      label: 'Force-close auction',
                      loading: _closing,
                      onPressed: _allBids.isEmpty ? null : _forceClose,
                      icon: Icons.stop_circle_outlined,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildClosedResult(ChitAuction auction) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_outline_rounded, size: 56, color: AppColors.success),
          const SizedBox(height: 16),
          Text('Auction closed', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Winning bid: ${(auction.winningBidPct ?? _closeResult?['winningBidPct'])?.toStringAsFixed(2)}%'),
          const SizedBox(height: 20),
          SecondaryButton(label: 'Back to group', onPressed: () => context.pop()),
        ],
      ),
    );
  }
}

final _auctionProvider = FutureProvider.autoDispose.family((ref, String id) {
  return ref.watch(auctionRepositoryProvider).get(id);
});
