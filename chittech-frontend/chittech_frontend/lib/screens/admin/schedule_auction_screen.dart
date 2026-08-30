import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../providers/auction_provider.dart';
import '../../widgets/buttons_and_inputs.dart';

class ScheduleAuctionScreen extends ConsumerStatefulWidget {
  final String groupId;
  const ScheduleAuctionScreen({super.key, required this.groupId});

  @override
  ConsumerState<ScheduleAuctionScreen> createState() => _ScheduleAuctionScreenState();
}

class _ScheduleAuctionScreenState extends ConsumerState<ScheduleAuctionScreen> {
  final _monthController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _schedule() async {
    final month = int.tryParse(_monthController.text.trim());
    if (month == null || month <= 0) {
      setState(() => _error = 'Enter a valid month number');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auction = await ref.read(auctionRepositoryProvider).schedule(widget.groupId, month);
      if (mounted) context.pushReplacement('/admin/auctions/${auction.id}/control');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Schedule auction')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppTextField(
              label: 'Month number',
              controller: _monthController,
              keyboardType: TextInputType.number,
              hint: 'e.g. 3',
            ),
            const Text(
              'This creates the auction in SCHEDULED status. Start it live from the '
              'live auction control screen once subscribers are ready to bid.',
              style: TextStyle(fontSize: 12),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 20),
            PrimaryButton(label: 'Schedule auction', loading: _loading, onPressed: _schedule),
          ],
        ),
      ),
    );
  }
}
