import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../core/utils/currency_formatter.dart';
import '../../providers/payment_provider.dart';
import '../../widgets/buttons_and_inputs.dart';

/// Entry point into Razorpay checkout for a single installment.
///
/// NOTE: integrating the actual `razorpay_flutter` SDK requires native
/// Android/iOS configuration (AndroidManifest activity, Info.plist scheme)
/// that can't be wired up from Dart alone. This screen implements the app
/// side of the flow up to launching checkout: it creates the order via the
/// backend, then hands off `razorpayOrderId` + `keyId` to Razorpay's SDK.
/// Swap the TODO block below for `Razorpay().open(options)` once the native
/// project files have the Razorpay SDK added.
class InstallmentPaymentScreen extends ConsumerStatefulWidget {
  final String installmentId;
  const InstallmentPaymentScreen({super.key, required this.installmentId});

  @override
  ConsumerState<InstallmentPaymentScreen> createState() => _InstallmentPaymentScreenState();
}

class _InstallmentPaymentScreenState extends ConsumerState<InstallmentPaymentScreen> {
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _order;

  Future<void> _startCheckout() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final order = await ref.read(paymentRepositoryProvider).createOrder(widget.installmentId);
      setState(() => _order = order);

      // TODO(razorpay-sdk): replace with real checkout launch, e.g.:
      // final razorpay = Razorpay();
      // razorpay.open({
      //   'key': order['keyId'],
      //   'order_id': order['razorpayOrderId'],
      //   'amount': order['amount'],
      //   'currency': order['currency'],
      // });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pay installment')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Secure payment via Razorpay', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Your payment is processed securely by Razorpay. ChitTech never stores your card details.'),
            const SizedBox(height: 24),
            if (_order != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Order created', style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 8),
                      Text('Amount: ${CurrencyFormatter.format((_order!['amount'] as num) / 100, showDecimals: true)}'),
                      Text('Order ID: ${_order!['razorpayOrderId']}'),
                    ],
                  ),
                ),
              ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const Spacer(),
            PrimaryButton(
              label: _order == null ? 'Proceed to pay' : 'Reopen checkout',
              loading: _loading,
              onPressed: _startCheckout,
              icon: Icons.lock_outline_rounded,
            ),
          ],
        ),
      ),
    );
  }
}
