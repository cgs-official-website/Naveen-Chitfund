import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/chit_group_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/buttons_and_inputs.dart';
import '../../widgets/state_widgets.dart';

class JoinConfirmationScreen extends ConsumerStatefulWidget {
  final String groupId;
  const JoinConfirmationScreen({super.key, required this.groupId});

  @override
  ConsumerState<JoinConfirmationScreen> createState() => _JoinConfirmationScreenState();
}

class _JoinConfirmationScreenState extends ConsumerState<JoinConfirmationScreen> {
  bool _agreed = false;
  bool _loading = false;
  String? _error;

  Future<void> _confirmJoin() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(chitGroupRepositoryProvider).joinGroup(widget.groupId);
      ref.invalidate(myChitsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You have joined the chit group!')));
        context.go(Routes.myChits);
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final groupAsync = ref.watch(groupDetailProvider(widget.groupId));

    return Scaffold(
      appBar: AppBar(title: const Text('Confirm your subscription')),
      body: groupAsync.when(
        loading: () => const SkeletonListLoader(itemCount: 2),
        error: (e, _) => ErrorStateView(message: e.toString(), onRetry: () => ref.invalidate(groupDetailProvider(widget.groupId))),
        data: (group) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(group.name, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _row('Chit value', CurrencyFormatter.format(group.chitAmount)),
                      const Divider(height: 20),
                      _row('Duration', '${group.durationMonths} months'),
                      const Divider(height: 20),
                      _row('You will pay monthly',
                          CurrencyFormatter.format(group.chitAmount / group.durationMonths, showDecimals: true)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _agreed,
                onChanged: (v) => setState(() => _agreed = v ?? false),
                title: const Text('I understand this is a chit fund subscription governed by the Chit Funds Act, 1982, and I agree to the terms.'),
                controlAffinity: ListTileControlAffinity.leading,
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const Spacer(),
              PrimaryButton(
                label: 'Confirm & join',
                loading: _loading,
                onPressed: _agreed ? _confirmJoin : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label), Text(value, style: const TextStyle(fontWeight: FontWeight.w700))],
      );
}
