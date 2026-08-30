import '../core/network/dio_client.dart';

/// Deliberately isolated from the rest of the app so a real DigiLocker /
/// Aadhaar e-KYC integration can be dropped in later without touching
/// screens. For this MVP, "uploading" a document just transitions the
/// backend's kyc_status via the existing profile PATCH endpoint (setting a
/// PAN number triggers NOT_SUBMITTED -> PENDING server-side).
class KycService {
  /// TODO(kyc-integration): replace with real document upload + DigiLocker/
  /// Aadhaar verification flow. For now this only sets the PAN number, which
  /// the backend uses to flip kyc_status to PENDING.
  Future<void> submitPan(String panNumber) async {
    await DioClient.instance.unwrap(
      () => DioClient.instance.dio.patch('/users/me', data: {'panNumber': panNumber}),
      (data) => data,
    );
  }
}
