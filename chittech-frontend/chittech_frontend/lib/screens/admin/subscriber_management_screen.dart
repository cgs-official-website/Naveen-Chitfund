import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/admin_provider.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/cards.dart';
import '../../widgets/state_widgets.dart';

class SubscriberManagementScreen extends ConsumerStatefulWidget {
  const SubscriberManagementScreen({super.key});

  @override
  ConsumerState<SubscriberManagementScreen> createState() => _SubscriberManagementScreenState();
}

class _SubscriberManagementScreenState extends ConsumerState<SubscriberManagementScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final subscribersAsync = ref.watch(adminSubscribersProvider);

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: AppTextField(
              label: 'Search subscribers',
              controller: _searchController,
              hint: 'Name or phone number',
              prefixIcon: const Icon(Icons.search_rounded),
            ),
          ),
          Expanded(
            child: subscribersAsync.when(
              loading: () => const SkeletonListLoader(),
              error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(adminSubscribersProvider)),
              data: (subs) {
                final filtered = _searchController.text.isEmpty
                    ? subs
                    : subs.where((s) {
                        final q = _searchController.text.toLowerCase();
                        return (s['full_name'] ?? '').toLowerCase().contains(q) || (s['phone'] ?? '').contains(q);
                      }).toList();

                if (filtered.isEmpty) {
                  return const EmptyStateView(
                    icon: Icons.people_outline_rounded,
                    title: 'No subscribers found',
                    message: 'Try a different search term.',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(adminSubscribersProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final s = filtered[i];
                      return SubscriberRow(
                        name: s['full_name'] ?? '',
                        phone: s['phone'] ?? '',
                        ticketNumber: s['ticket_number'] ?? 0,
                        subscriberStatus: s['subscriber_status'] ?? 'NPS',
                        kycStatus: s['kyc_status'] ?? 'NOT_SUBMITTED',
                        onTap: () => context.push('/admin/subscribers/${s['id']}'),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
