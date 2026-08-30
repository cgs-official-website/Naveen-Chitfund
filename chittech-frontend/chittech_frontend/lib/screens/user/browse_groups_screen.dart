import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/chit_group_provider.dart';
import '../../widgets/cards.dart';
import '../../widgets/state_widgets.dart';

class BrowseGroupsScreen extends ConsumerStatefulWidget {
  const BrowseGroupsScreen({super.key});

  @override
  ConsumerState<BrowseGroupsScreen> createState() => _BrowseGroupsScreenState();
}

class _BrowseGroupsScreenState extends ConsumerState<BrowseGroupsScreen> {
  RangeValues? _amountFilter;

  @override
  Widget build(BuildContext context) {
    final groupsAsync = ref.watch(browseGroupsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Browse chit groups')),
      body: groupsAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 5),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(browseGroupsProvider)),
        data: (groups) {
          final filtered = _amountFilter == null
              ? groups
              : groups
                  .where((g) => g.chitAmount >= _amountFilter!.start && g.chitAmount <= _amountFilter!.end)
                  .toList();

          if (groups.isEmpty) {
            return const EmptyStateView(
              icon: Icons.search_off_rounded,
              title: 'No open chit groups',
              message: 'Check back soon — new groups open regularly.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(browseGroupsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, i) {
                final g = filtered[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ChitGroupCard(group: g, onTap: () => context.push('/user/groups/${g.id}')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
