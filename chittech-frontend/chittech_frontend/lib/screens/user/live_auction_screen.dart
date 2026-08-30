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

/// The live auction screen. Connects to the backend Socket.IO room for this
/// auction, shows the current lowest bid in real time, a live bid feed, lets
/// the subscriber place a bid, and handles reconnection if the socket drops.
///
/// Every screen state is handled explicitly: initial load, empty (no bids
/// yet), live updates, connection lost / reconnecting, and auction ended.
class LiveAuctionScreen extends ConsumerStatefulWidget {
  final String auctionId;
  const LiveAuctionScreen({super.key, required this.auctionId});

  @override
  ConsumerState<LiveAuctionScreen> createState() => _LiveAuctionScreenState();
}

class _LiveAuctionScreenState extends ConsumerState<LiveAuctionScreen> {
  final _bidController = TextEditingController();
  final List<BidEvent> _recentBids = [];
  double? _currentLowestBid;
  bool _placingBid = false;
  String? _bidError;
  bool _auctionEnded = false;
  String? _winningTicket;

  @override
  void dispose() {
    _bidController.dispose();
    super.dispose();
  }

  Future<void> _placeBid() async {
    final pct = double.tryParse(_bidController.text.trim());
    if (pct == null || pct <= 0 || pct >= 50) {
      setState(() => _bidError = 'Enter a valid bid percentage (0–50)');
      return;
    }
    if (_currentLowestBid != null && pct >= _currentLowestBid!) {
      setState(() => _bidError = 'Your bid must be lower than the current lowest (${_currentLowestBid!}%)');
      return;
    }

    setState(() {
      _placingBid = true;
      _bidError = null;
    });

    try {
      await ref.read(auctionRepositoryProvider).placeBid(widget.auctionId, pct);
      _bidController.clear();
    } on ApiException catch (e) {
      setState(() => _bidError = e.message);
    } finally {
      if (mounted) setState(() => _placingBid = false);
    }
  }

  void _handleSocketEvent(Map<String, dynamic> event) {
    final type = event['event'];
    final data = Map<String, dynamic>.from(event['data'] ?? {});

    if (type == 'bid_placed') {
      final bid = BidEvent.fromJson(data);
      setState(() {
        _currentLowestBid = bid.bidPct;
        _recentBids.insert(0, bid);
        if (_recentBids.length > 20) _recentBids.removeLast();
      });
    } else if (type == 'auction_closed') {
      setState(() {
        _auctionEnded = true;
        _winningTicket = data['winningTicketNumber']?.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(auctionEventsStreamProvider(widget.auctionId));
    final connectionAsync = ref.watch(auctionConnectionStateProvider(widget.auctionId));

    ref.listen(auctionEventsStreamProvider(widget.auctionId), (prev, next) {
      next.whenData(_handleSocketEvent);
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Auction'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(child: _connectionIndicator(connectionAsync.valueOrNull)),
          ),
        ],
      ),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorStateView(
          message: 'Could not connect to the live auction: $e',
          onRetry: () => ref.invalidate(auctionSocketProvider(widget.auctionId)),
        ),
        data: (_) => _buildLiveContent(context),
      ),
    );
  }

  Widget _connectionIndicator(SocketConnectionState? state) {
    switch (state) {
      case SocketConnectionState.connected:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.circle, size: 8, color: AppColors.success),
          SizedBox(width: 6),
          Text('Live', style: TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w600)),
        ]);
      case SocketConnectionState.reconnecting:
      case SocketConnectionState.connecting:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          SizedBox(width: 10, height: 10, child: CircularProgressIndicator(strokeWidth: 1.6)),
          SizedBox(width: 6),
          Text('Connecting…', style: TextStyle(fontSize: 12)),
        ]);
      case SocketConnectionState.disconnected:
        return const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.circle, size: 8, color: AppColors.danger),
          SizedBox(width: 6),
          Text('Reconnecting…', style: TextStyle(fontSize: 12, color: AppColors.danger)),
        ]);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildLiveContent(BuildContext context) {
    if (_auctionEnded) {
      return _AuctionEndedState(
        winningTicket: _winningTicket,
        onViewResult: () => context.pushReplacement('/user/auctions/${widget.auctionId}/result'),
      );
    }

    return Column(
      children: [
        Container(
          width: double.infinity,
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [AppColors.navy800, AppColors.navy700]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              const Text('Current lowest bid', style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 8),
              Text(
                _currentLowestBid != null ? '${_currentLowestBid!.toStringAsFixed(2)}%' : '— No bids yet —',
                style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                _currentLowestBid != null
                    ? 'This subscriber is currently winning the prize'
                    : 'Be the first to bid this month',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
        ),
        Expanded(
          child: _recentBids.isEmpty
              ? const EmptyStateView(
                  icon: Icons.gavel_outlined,
                  title: 'No bids yet',
                  message: 'Bids will appear here in real time as subscribers place them.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _recentBids.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, i) {
                    final bid = _recentBids[i];
                    return ListTile(
                      leading: CircleAvatar(child: Text('#${bid.ticketNumber}')),
                      title: Text('${bid.bidPct.toStringAsFixed(2)}% bid'),
                      trailing: Text(_relativeTime(bid.bidAt)),
                    );
                  },
                ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: AppTextField(
                    label: 'Your bid (%)',
                    controller: _bidController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    hint: 'e.g. 8.5',
                    errorText: _bidError,
                  ),
                ),
                const SizedBox(width: 12),
                Padding(
                  padding: const EdgeInsets.only(top: 24),
                  child: SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      // Disabled while a bid request is in-flight, per spec.
                      onPressed: _placingBid ? null : _placeBid,
                      child: _placingBid
                          ? const SizedBox(
                              height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Bid'),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _relativeTime(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s ago';
    return '${diff.inMinutes}m ago';
  }
}

class _AuctionEndedState extends StatelessWidget {
  final String? winningTicket;
  final VoidCallback onViewResult;
  const _AuctionEndedState({required this.winningTicket, required this.onViewResult});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.emoji_events_rounded, size: 64, color: AppColors.gold500),
            const SizedBox(height: 16),
            Text('Auction ended', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            if (winningTicket != null) Text('Ticket #$winningTicket won this month\'s prize.'),
            const SizedBox(height: 24),
            PrimaryButton(label: 'View result & dividends', onPressed: onViewResult),
          ],
        ),
      ),
    );
  }
}
