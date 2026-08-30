enum KycStatus { notSubmitted, pending, approved, rejected }

KycStatus kycStatusFromString(String? s) {
  switch (s) {
    case 'APPROVED':
      return KycStatus.approved;
    case 'REJECTED':
      return KycStatus.rejected;
    case 'PENDING':
      return KycStatus.pending;
    default:
      return KycStatus.notSubmitted;
  }
}

class AppUser {
  final String id;
  final String fullName;
  final String phone;
  final String? email;
  final String role; // 'admin' | 'user'
  final KycStatus kycStatus;
  final String? panNumber;

  AppUser({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email,
    required this.role,
    required this.kycStatus,
    this.panNumber,
  });

  bool get isAdmin => role == 'admin';

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        email: json['email'] as String?,
        role: json['role'] as String? ?? 'user',
        kycStatus: kycStatusFromString(json['kycStatus'] as String?),
        panNumber: json['panNumber'] as String?,
      );
}
