import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/splash_screen.dart';
import '../screens/auth/phone_entry_screen.dart';
import '../screens/auth/otp_verify_screen.dart';
import '../screens/auth/profile_setup_screen.dart';
import '../screens/auth/kyc_status_screen.dart';

import '../screens/user/user_shell.dart';
import '../screens/user/home_dashboard_screen.dart';
import '../screens/user/browse_groups_screen.dart';
import '../screens/user/group_detail_screen.dart';
import '../screens/user/join_confirmation_screen.dart';
import '../screens/user/my_chits_screen.dart';
import '../screens/user/auctions_tab_screen.dart';
import '../screens/user/live_auction_screen.dart';
import '../screens/user/auction_result_screen.dart';
import '../screens/user/installment_payment_screen.dart';
import '../screens/user/payment_history_screen.dart';

import '../screens/account/profile_screen.dart';
import '../screens/account/notifications_screen.dart';
import '../screens/account/settings_screen.dart';
import '../screens/account/support_screen.dart';
import '../screens/account/document_vault_screen.dart';

import '../screens/admin/admin_shell.dart';
import '../screens/admin/admin_dashboard_screen.dart';
import '../screens/admin/create_group_screen.dart';
import '../screens/admin/admin_groups_list_screen.dart';
import '../screens/admin/admin_group_detail_screen.dart';
import '../screens/admin/schedule_auction_screen.dart';
import '../screens/admin/admin_live_auction_control_screen.dart';
import '../screens/admin/subscriber_management_screen.dart';
import '../screens/admin/subscriber_detail_screen.dart';
import '../screens/admin/ledger_reports_screen.dart';
import '../screens/admin/admin_settings_screen.dart';

import '../screens/shared/not_found_screen.dart';
import '../screens/shared/offline_screen.dart';

/// Route paths, centralized so screens never hardcode strings for navigation.
class Routes {
  Routes._();
  static const splash = '/';
  static const phoneEntry = '/auth/phone';
  static const otpVerify = '/auth/otp';
  static const profileSetup = '/auth/profile-setup';
  static const kycStatus = '/auth/kyc-status';

  // User shell (bottom nav)
  static const userHome = '/user/home';
  static const browseGroups = '/user/groups';
  static const groupDetail = '/user/groups/:id';
  static const joinConfirm = '/user/groups/:id/join';
  static const myChits = '/user/my-chits';
  static const auctionsTab = '/user/auctions';
  static const liveAuction = '/user/auctions/:id/live';
  static const auctionResult = '/user/auctions/:id/result';
  static const installmentPayment = '/user/pay/:installmentId';
  static const paymentHistory = '/user/payments';

  static const profile = '/account/profile';
  static const notifications = '/account/notifications';
  static const settings = '/account/settings';
  static const support = '/account/support';
  static const documentVault = '/account/documents';

  // Admin shell (drawer nav)
  static const adminDashboard = '/admin/dashboard';
  static const adminGroups = '/admin/groups';
  static const createGroup = '/admin/groups/new';
  static const adminGroupDetail = '/admin/groups/:id';
  static const scheduleAuction = '/admin/groups/:id/schedule-auction';
  static const adminLiveAuctionControl = '/admin/auctions/:id/control';
  static const subscriberManagement = '/admin/subscribers';
  static const subscriberDetail = '/admin/subscribers/:id';
  static const ledgerReports = '/admin/ledger';
  static const adminSettings = '/admin/settings';

  static const offline = '/offline';
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: Routes.splash,
    refreshListenable: _AuthListenable(ref),
    redirect: (context, state) => _redirect(authState, state),
    errorBuilder: (context, state) => const NotFoundScreen(),
    routes: [
      GoRoute(path: Routes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: Routes.phoneEntry, builder: (_, __) => const PhoneEntryScreen()),
      GoRoute(
        path: Routes.otpVerify,
        builder: (_, state) => OtpVerifyScreen(phone: state.extra as String? ?? ''),
      ),
      GoRoute(path: Routes.profileSetup, builder: (_, __) => const ProfileSetupScreen()),
      GoRoute(path: Routes.kycStatus, builder: (_, __) => const KycStatusScreen()),
      GoRoute(path: Routes.offline, builder: (_, __) => const OfflineScreen()),

      // --- USER navigation graph: bottom-nav shell ---
      // This ShellRoute is ONLY reachable when redirect() confirms role == 'user'.
      // An admin token is redirected to /admin/* before it ever reaches here.
      ShellRoute(
        builder: (context, state, child) => UserShell(child: child),
        routes: [
          GoRoute(path: Routes.userHome, builder: (_, __) => const HomeDashboardScreen()),
          GoRoute(path: Routes.browseGroups, builder: (_, __) => const BrowseGroupsScreen()),
          GoRoute(
            path: Routes.groupDetail,
            builder: (_, state) => GroupDetailScreen(groupId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: Routes.joinConfirm,
            builder: (_, state) => JoinConfirmationScreen(groupId: state.pathParameters['id']!),
          ),
          GoRoute(path: Routes.myChits, builder: (_, __) => const MyChitsScreen()),
          GoRoute(path: Routes.auctionsTab, builder: (_, __) => const AuctionsTabScreen()),
          GoRoute(
            path: Routes.liveAuction,
            builder: (_, state) => LiveAuctionScreen(auctionId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: Routes.auctionResult,
            builder: (_, state) => AuctionResultScreen(auctionId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: Routes.installmentPayment,
            builder: (_, state) => InstallmentPaymentScreen(installmentId: state.pathParameters['installmentId']!),
          ),
          GoRoute(path: Routes.paymentHistory, builder: (_, __) => const PaymentHistoryScreen()),
          GoRoute(path: Routes.profile, builder: (_, __) => const ProfileScreen()),
          GoRoute(path: Routes.notifications, builder: (_, __) => const NotificationsScreen()),
          GoRoute(path: Routes.settings, builder: (_, __) => const SettingsScreen()),
          GoRoute(path: Routes.support, builder: (_, __) => const SupportScreen()),
          GoRoute(path: Routes.documentVault, builder: (_, __) => const DocumentVaultScreen()),
        ],
      ),

      // --- ADMIN navigation graph: drawer-nav shell ---
      // Only reachable when redirect() confirms role == 'admin'. A user token
      // is redirected to /user/* before it ever reaches here.
      ShellRoute(
        builder: (context, state, child) => AdminShell(child: child),
        routes: [
          GoRoute(path: Routes.adminDashboard, builder: (_, __) => const AdminDashboardScreen()),
          GoRoute(path: Routes.adminGroups, builder: (_, __) => const AdminGroupsListScreen()),
          GoRoute(path: Routes.createGroup, builder: (_, __) => const CreateGroupScreen()),
          GoRoute(
            path: Routes.adminGroupDetail,
            builder: (_, state) => AdminGroupDetailScreen(groupId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: Routes.scheduleAuction,
            builder: (_, state) => ScheduleAuctionScreen(groupId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: Routes.adminLiveAuctionControl,
            builder: (_, state) => AdminLiveAuctionControlScreen(auctionId: state.pathParameters['id']!),
          ),
          GoRoute(path: Routes.subscriberManagement, builder: (_, __) => const SubscriberManagementScreen()),
          GoRoute(
            path: Routes.subscriberDetail,
            builder: (_, state) => SubscriberDetailScreen(subscriptionId: state.pathParameters['id']!),
          ),
          GoRoute(path: Routes.ledgerReports, builder: (_, __) => const LedgerReportsScreen()),
          GoRoute(path: Routes.adminSettings, builder: (_, __) => const AdminSettingsScreen()),
        ],
      ),
    ],
  );
});

/// The core RBAC boundary: this is the single place that decides which
/// navigation graph a token is allowed to enter. Neither shell references the
/// other's screens, so there is no shared widget tree to accidentally leak
/// admin-only UI to a user token or vice versa.
String? _redirect(AuthState authState, GoRouterState state) {
  final loc = state.matchedLocation;
  final isAuthRoute = loc == Routes.splash ||
      loc == Routes.phoneEntry ||
      loc == Routes.otpVerify ||
      loc == Routes.profileSetup ||
      loc == Routes.kycStatus;

  switch (authState.status) {
    case AuthStatus.unknown:
      return loc == Routes.splash ? null : Routes.splash;

    case AuthStatus.unauthenticated:
      return isAuthRoute && loc != Routes.splash ? null : Routes.phoneEntry;

    case AuthStatus.authenticated:
      if (isAuthRoute) {
        return authState.isAdmin ? Routes.adminDashboard : Routes.userHome;
      }
      final wantsAdminArea = loc.startsWith('/admin');
      final wantsUserArea = loc.startsWith('/user') || loc.startsWith('/account');

      if (wantsAdminArea && !authState.isAdmin) return Routes.userHome;
      if (wantsUserArea && authState.isAdmin) return Routes.adminDashboard;
      return null;
  }
}

/// Bridges Riverpod state changes into something go_router's `refreshListenable`
/// understands, so navigation re-evaluates redirect() whenever auth state changes.
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}
