import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../router/app_router.dart';

/// The full USER navigation shell: bottom-nav with Home, My Chits, Auctions
/// (routed via My Chits -> live auction), Payments, Profile. This shell tree
/// never imports or references any admin screen.
class UserShell extends StatelessWidget {
  final Widget child;
  const UserShell({super.key, required this.child});

  static const _tabs = [
    Routes.userHome,
    Routes.myChits,
    Routes.auctionsTab,
    Routes.paymentHistory,
    Routes.profile,
  ];

  int _indexForLocation(String location) {
    if (location.startsWith(Routes.myChits)) return 1;
    if (location.startsWith(Routes.auctionsTab) || location.contains('/auctions/')) return 2;
    if (location.startsWith(Routes.paymentHistory)) return 3;
    if (location.startsWith(Routes.profile) || location.startsWith('/account/')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _indexForLocation(location);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) => context.go(_tabs[i]),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
          NavigationDestination(
              icon: Icon(Icons.pie_chart_outline_rounded), selectedIcon: Icon(Icons.pie_chart_rounded), label: 'My Chits'),
          NavigationDestination(
              icon: Icon(Icons.gavel_outlined), selectedIcon: Icon(Icons.gavel_rounded), label: 'Auctions'),
          NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long_rounded), label: 'Payments'),
          NavigationDestination(icon: Icon(Icons.person_outline_rounded), selectedIcon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}
