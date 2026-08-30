import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/chit_group_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/cards.dart';
import '../../widgets/state_widgets.dart';

class AdminGroupsListScreen extends ConsumerWidget {
  const AdminGroupsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupsAsync = ref.watch(_allGroupsProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(Routes.createGroup),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New group'),
      ),
      body: groupsAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 5),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(_allGroupsProvider)),
        data: (groups) {
          if (groups.isEmpty) {
            return EmptyStateView(
              icon: Icons.groups_outlined,
              title: 'No chit groups yet',
              message: 'Create your first chit group to get started.',
              actionLabel: 'Create group',
              onAction: () => context.push(Routes.createGroup),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_allGroupsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
              itemCount: groups.length,
              itemBuilder: (context, i) {
                final g = groups[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ChitGroupCard(group: g, onTap: () => context.push('/admin/groups/${g.id}')),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

final _allGroupsProvider = FutureProvider.autoDispose((ref) {
  return ref.watch(chitGroupRepositoryProvider).browseGroups();
});
