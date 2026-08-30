import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auction_provider.dart';
import '../../providers/chit_group_provider.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/state_widgets.dart';
import '../../widgets/status_badges.dart';

class AdminGroupDetailScreen extends ConsumerWidget {
  final String groupId;
  const AdminGroupDetailScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupAsync = ref.watch(groupDetailProvider(groupId));
    final auctionsAsync = ref.watch(_groupAuctionsProvider(groupId));
    final subscribersAsync = ref.watch(_groupSubscribersProvider(groupId));

    return Scaffold(
      body: groupAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 3),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(groupDetailProvider(groupId))),
        data: (group) {
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(groupDetailProvider(groupId));
              ref.invalidate(_groupAuctionsProvider(groupId));
              ref.invalidate(_groupSubscribersProvider(groupId));
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(group.name, style: Theme.of(context).textTheme.headlineSmall)),
                    GroupStatusBadge(status: group.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${CurrencyFormatter.format(group.chitAmount)} · ${group.durationMonths} months · ${group.subscriberCount} members',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: SecondaryButton(
                        label: 'Schedule auction',
                        icon: Icons.event_outlined,
                        onPressed: () => context.push('/admin/groups/$groupId/schedule-auction'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SecondaryButton(
                        label: group.status == 'CLOSED' ? 'Group closed' : 'Close group',
                        icon: Icons.lock_outline_rounded,
                        onPressed: group.status == 'CLOSED'
                            ? null
                            : () async {
                                await DioClient.instance.unwrap(
                                  () => DioClient.instance.dio.post('/chit-groups/$groupId/close'),
                                  (d) => d,
                                );
                                ref.invalidate(groupDetailProvider(groupId));
                              },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text('Auctions', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                auctionsAsync.when(
                  loading: () => const SkeletonBox(height: 60),
                  error: (_, __) => const Text('Could not load auctions'),
                  data: (auctions) => auctions.isEmpty
                      ? const Text('No auctions scheduled.')
                      : Column(
                          children: auctions.map((a) {
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                title: Text('Month ${a.monthNumber}'),
                                trailing: AuctionStatusBadge(status: a.status),
                                onTap: a.status != 'SCHEDULED' && a.status != 'LIVE'
                                    ? null
                                    : () => context.push('/admin/auctions/${a.id}/control'),
                              ),
                            );
                          }).toList(),
                        ),
                ),
                const SizedBox(height: 24),
                Text('Subscribers', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                subscribersAsync.when(
                  loading: () => const SkeletonBox(height: 60),
                  error: (_, __) => const Text('Could not load subscribers'),
                  data: (subs) => subs.isEmpty
                      ? const Text('No subscribers yet.')
                      : Column(
                          children: subs.map<Widget>((s) {
                            return SubscriberRow(
                              name: s['full_name'] ?? '',
                              phone: s['phone'] ?? '',
                              ticketNumber: s['ticket_number'] ?? 0,
                              subscriberStatus: s['subscriber_status'] ?? 'NPS',
                              kycStatus: s['kyc_status'] ?? 'NOT_SUBMITTED',
                              onTap: () => context.push('/admin/subscribers/${s['id']}'),
                            );
                          }).toList(),
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

final _groupAuctionsProvider = FutureProvider.autoDispose.family((ref, String groupId) {
  return ref.watch(auctionRepositoryProvider).listForGroup(groupId);
});

final _groupSubscribersProvider = FutureProvider.autoDispose.family((ref, String groupId) {
  return ref.watch(adminRepositoryProvider).subscribers(groupId: groupId);
});
