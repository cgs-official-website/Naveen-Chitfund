enum SubscriberStatus { nps, sb, ps }

SubscriberStatus subscriberStatusFromString(String s) {
  switch (s) {
    case 'PS':
      return SubscriberStatus.ps;
    case 'SB':
      return SubscriberStatus.sb;
    default:
      return SubscriberStatus.nps;
  }
}

class ChitSubscription {
  final String id;
  final String chitGroupId;
  final int ticketNumber;
  final SubscriberStatus status;
  final String? groupName;
  final double? chitAmount;
  final int? durationMonths;
  final String? groupStatus;

  ChitSubscription({
    required this.id,
    required this.chitGroupId,
    required this.ticketNumber,
    required this.status,
    this.groupName,
    this.chitAmount,
    this.durationMonths,
    this.groupStatus,
  });

  factory ChitSubscription.fromJson(Map<String, dynamic> json) => ChitSubscription(
        id: json['id'] as String,
        chitGroupId: json['chit_group_id'] as String,
        ticketNumber: json['ticket_number'] as int,
        status: subscriberStatusFromString(json['subscriber_status'] as String),
        groupName: json['group_name'] as String?,
        chitAmount: json['chit_amount'] != null ? double.parse(json['chit_amount'].toString()) : null,
        durationMonths: json['duration_months'] as int?,
        groupStatus: json['group_status'] as String?,
      );
}

class Installment {
  final String id;
  final int monthNumber;
  final double amountDue;
  final String status; // PENDING | PAID | OVERDUE

  Installment({required this.id, required this.monthNumber, required this.amountDue, required this.status});

  factory Installment.fromJson(Map<String, dynamic> json) => Installment(
        id: json['id'] as String,
        monthNumber: json['month_number'] as int,
        amountDue: double.parse(json['amount_due'].toString()),
        status: json['status'] as String,
      );
}
