import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auction_provider.dart';
import '../../widgets/state_widgets.dart';

class AuctionResultScreen extends ConsumerWidget {
  final String auctionId;
  const AuctionResultScreen({super.key, required this.auctionId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auctionAsync = ref.watch(_auctionProvider(auctionId));

    return Scaffold(
      appBar: AppBar(title: const Text('Auction result')),
      body: auctionAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 2),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(_auctionProvider(auctionId))),
        data: (auction) {
          if (auction.status != 'COMPLETED') {
            return const EmptyStateView(
              icon: Icons.hourglass_empty_rounded,
              title: 'Result not available yet',
              message: 'This auction has not been finalized by the admin.',
            );
          }
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                const Icon(Icons.emoji_events_rounded, size: 72, color: AppColors.gold500),
                const SizedBox(height: 16),
                Text('Month ${auction.monthNumber} auction closed', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text('Winning bid: ${auction.winningBidPct?.toStringAsFixed(2)}%'),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Dividend breakdown', style: Theme.of(context).textTheme.titleSmall),
                        const SizedBox(height: 8),
                        const Text(
                          'Non-prized subscribers receive their share of the auction discount, '
                          'after foreman commission, credited to their ledger. Check My Chits → '
                          'group detail for your exact dividend entry.',
                        ),
                      ],
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
}

final _auctionProvider = FutureProvider.autoDispose.family((ref, String id) {
  return ref.watch(auctionRepositoryProvider).get(id);
});
