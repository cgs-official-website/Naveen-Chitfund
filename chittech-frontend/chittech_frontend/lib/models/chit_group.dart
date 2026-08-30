class ChitGroup {
  final String id;
  final String name;
  final double chitAmount;
  final int durationMonths;
  final double foremanCommissionPct;
  final String status; // DRAFT | OPEN | RUNNING | CLOSED
  final String dividendDistributionPolicy;
  final int subscriberCount;

  ChitGroup({
    required this.id,
    required this.name,
    required this.chitAmount,
    required this.durationMonths,
    required this.foremanCommissionPct,
    required this.status,
    required this.dividendDistributionPolicy,
    this.subscriberCount = 0,
  });

  factory ChitGroup.fromJson(Map<String, dynamic> json) => ChitGroup(
        id: json['id'] as String,
        name: json['name'] as String,
        chitAmount: double.parse(json['chit_amount'].toString()),
        durationMonths: json['duration_months'] as int,
        foremanCommissionPct: double.parse(json['foreman_commission_pct'].toString()),
        status: json['status'] as String,
        dividendDistributionPolicy: json['dividend_distribution_policy'] as String? ?? 'NON_PRIZED_ONLY',
        subscriberCount: int.tryParse(json['subscriber_count']?.toString() ?? '0') ?? 0,
      );
}
