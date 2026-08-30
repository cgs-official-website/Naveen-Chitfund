class PaymentRecord {
  final String id;
  final double amount;
  final String status; // CREATED | SUCCESS | FAILED
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final DateTime createdAt;

  PaymentRecord({
    required this.id,
    required this.amount,
    required this.status,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    required this.createdAt,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) => PaymentRecord(
        id: json['id'] as String,
        amount: double.parse(json['amount'].toString()),
        status: json['status'] as String,
        razorpayOrderId: json['razorpay_order_id'] as String?,
        razorpayPaymentId: json['razorpay_payment_id'] as String?,
        createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      );
}
