class ChitAuction {
  final String id;
  final String chitGroupId;
  final int monthNumber;
  final String status; // SCHEDULED | LIVE | COMPLETED | CANCELLED
  final double? winningBidPct;
  final String? winningSubscriptionId;
  final DateTime? scheduledAt;
  final DateTime? closedAt;

  ChitAuction({
    required this.id,
    required this.chitGroupId,
    required this.monthNumber,
    required this.status,
    this.winningBidPct,
    this.winningSubscriptionId,
    this.scheduledAt,
    this.closedAt,
  });

  factory ChitAuction.fromJson(Map<String, dynamic> json) => ChitAuction(
        id: json['id'] as String,
        chitGroupId: json['chit_group_id'] as String,
        monthNumber: json['month_number'] as int,
        status: json['status'] as String,
        winningBidPct: json['winning_bid_pct'] != null ? double.parse(json['winning_bid_pct'].toString()) : null,
        winningSubscriptionId: json['winning_subscription_id'] as String?,
        scheduledAt: json['scheduled_at'] != null ? DateTime.tryParse(json['scheduled_at']) : null,
        closedAt: json['closed_at'] != null ? DateTime.tryParse(json['closed_at']) : null,
      );
}

class BidEvent {
  final double bidPct;
  final String subscriptionId;
  final int ticketNumber;
  final DateTime bidAt;

  BidEvent({required this.bidPct, required this.subscriptionId, required this.ticketNumber, required this.bidAt});

  factory BidEvent.fromJson(Map<String, dynamic> json) => BidEvent(
        bidPct: double.parse(json['bidPct'].toString()),
        subscriptionId: json['subscriptionId'] as String,
        ticketNumber: json['ticketNumber'] as int,
        bidAt: DateTime.tryParse(json['bidAt'] ?? '') ?? DateTime.now(),
      );
}
