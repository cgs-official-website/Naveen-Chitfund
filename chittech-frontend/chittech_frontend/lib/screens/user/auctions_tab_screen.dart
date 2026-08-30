import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auction_provider.dart';
import '../../providers/chit_group_provider.dart';
import '../../widgets/state_widgets.dart';
import '../../widgets/status_badges.dart';

/// Aggregates upcoming/live auctions across every chit group the user has joined.
class AuctionsTabScreen extends ConsumerWidget {
  const AuctionsTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final myChits = ref.watch(myChitsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Auctions')),
      body: myChits.when(
        loading: () => const SkeletonListLoader(),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(myChitsProvider)),
        data: (subs) {
          if (subs.isEmpty) {
            return const EmptyStateView(
              icon: Icons.gavel_outlined,
              title: 'No auctions yet',
              message: 'Join a chit group to see its monthly auctions here.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: subs.length,
            itemBuilder: (context, i) {
              final sub = subs[i];
              return _GroupAuctionsCard(groupId: sub.chitGroupId, groupName: sub.groupName ?? 'Chit group');
            },
          );
        },
      ),
    );
  }
}

class _GroupAuctionsCard extends ConsumerWidget {
  final String groupId;
  final String groupName;
  const _GroupAuctionsCard({required this.groupId, required this.groupName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auctionsAsync = ref.watch(_groupAuctionsProvider(groupId));

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(groupName, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            auctionsAsync.when(
              loading: () => const SkeletonBox(height: 40),
              error: (_, __) => const Text('Could not load auctions'),
              data: (auctions) {
                if (auctions.isEmpty) return const Text('No auctions scheduled yet.');
                return Column(
                  children: auctions.take(3).map((a) {
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Month ${a.monthNumber}'),
                      trailing: AuctionStatusBadge(status: a.status),
                      onTap: a.status == 'LIVE'
                          ? () => context.push('/user/auctions/${a.id}/live')
                          : a.status == 'COMPLETED'
                              ? () => context.push('/user/auctions/${a.id}/result')
                              : null,
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

final _groupAuctionsProvider = FutureProvider.autoDispose.family((ref, String groupId) {
  return ref.watch(auctionRepositoryProvider).listForGroup(groupId);
});
