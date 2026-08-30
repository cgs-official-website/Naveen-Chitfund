import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../providers/chit_group_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/buttons_and_inputs.dart';

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _durationController = TextEditingController(text: '20');
  final _commissionController = TextEditingController(text: '5');
  String _policy = 'NON_PRIZED_ONLY';
  bool _loading = false;
  String? _error;

  Future<void> _create() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final group = await ref.read(chitGroupRepositoryProvider).createGroup(
            name: _nameController.text.trim(),
            chitAmount: double.parse(_amountController.text.trim()),
            durationMonths: int.parse(_durationController.text.trim()),
            foremanCommissionPct: double.parse(_commissionController.text.trim()),
            dividendDistributionPolicy: _policy,
          );
      if (mounted) context.pushReplacement('/admin/groups/${group.id}');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Please check the values you entered.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create chit group')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppTextField(label: 'Group name', controller: _nameController, hint: 'Prosperity Chit - 5L / 20mo'),
            const SizedBox(height: 16),
            AppTextField(label: 'Chit amount (₹)', controller: _amountController, keyboardType: TextInputType.number, hint: '500000'),
            const SizedBox(height: 16),
            AppTextField(label: 'Duration (months)', controller: _durationController, keyboardType: TextInputType.number),
            const SizedBox(height: 16),
            AppTextField(label: 'Foreman commission (%)', controller: _commissionController, keyboardType: const TextInputType.numberWithOptions(decimal: true)),
            const SizedBox(height: 16),
            Text('Dividend distribution policy', style: Theme.of(context).textTheme.labelLarge),
            RadioListTile(
              value: 'NON_PRIZED_ONLY',
              groupValue: _policy,
              title: const Text('Non-prized subscribers only'),
              onChanged: (v) => setState(() => _policy = v!),
            ),
            RadioListTile(
              value: 'ALL_SUBSCRIBERS',
              groupValue: _policy,
              title: const Text('All subscribers'),
              onChanged: (v) => setState(() => _policy = v!),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            PrimaryButton(label: 'Create group', loading: _loading, onPressed: _create),
          ],
        ),
      ),
    );
  }
}
