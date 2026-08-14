import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, StyleSheet, Text, Image, StatusBar, BackHandler } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Menu, Sun, Moon } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { WhyChooseScreen } from '../screens/WhyChooseScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsConditionsScreen } from '../screens/TermsConditionsScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminVehiclesScreen } from '../screens/AdminVehiclesScreen';
import { AdminVehicleDetailScreen } from '../screens/AdminVehicleDetailScreen';
import { AdminAuctionsScreen } from '../screens/AdminAuctionsScreen';
import { AdminLiveBiddingScreen } from '../screens/AdminLiveBiddingScreen';
import { AdminAuctionDetailScreen } from '../screens/AdminAuctionDetailScreen';
import { AdminDealersScreen } from '../screens/AdminDealersScreen';
import { AdminInspectorsScreen } from '../screens/AdminInspectorsScreen';
import { AdminAnalyticsScreen } from '../screens/AdminAnalyticsScreen';
import { DealerDashboardScreen } from '../screens/DealerDashboardScreen';
import { DealerMarketplaceScreen } from '../screens/DealerMarketplaceScreen';
import { DealerBidsScreen } from '../screens/DealerBidsScreen';
import { DealerFavouritesScreen } from '../screens/DealerFavouritesScreen';
import { DealerProfileScreen } from '../screens/DealerProfileScreen';
import { DealerVehicleDetailScreen } from '../screens/DealerVehicleDetailScreen';
import { InspectorDashboardScreen } from '../screens/InspectorDashboardScreen';
import { InspectorProfileScreen } from '../screens/InspectorProfileScreen';
import { InspectorVehiclesScreen } from '../screens/InspectorVehiclesScreen';
import { InspectorVehicleDetailScreen } from '../screens/InspectorVehicleDetailScreen';
import { InspectorAddVehicleScreen } from '../screens/InspectorAddVehicleScreen';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ToastProvider, useToast } from '../context/ToastContext';
import { SidebarDrawer } from '../components/SidebarDrawer';
import { SessionExpiredModal } from '../components/SessionExpiredModal';
import { authService } from '../services/authService';

const Stack = createStackNavigator();

const NavigationContent = () => {
  const { theme, colors, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const lastBackPress = useRef(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Home');
  const navigationRef = useNavigationContainerRef();

  const handleLoginAgain = async () => {
    await authService.logout();
    setDrawerOpen(false);
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // Prevent the app from closing immediately on Android back press when at root screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentRoute = navigationRef.getCurrentRoute() as any;
      if (currentRoute?.name === 'Login' || currentRoute?.name === 'Register') {
        (navigationRef as any).navigate('Home');
        return true;
      }
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        return false;
      }
      lastBackPress.current = now;
      showToast({ message: 'Press back again to exit', type: 'info' });
      return true;
    });
    return () => backHandler.remove();
  }, [navigationRef, showToast]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBg}
        translucent={false}
      />
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const current = navigationRef.getCurrentRoute() as any;
          if (current?.name) {
            setCurrentRoute(current.name);
          }
        }}
      >
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.headerBg,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: colors.headerBorder,
            },
            headerTintColor: colors.foreground,
            cardStyle: { backgroundColor: colors.background },
            headerTitle: () => (
              <View style={styles.brandTitleContainer}>
                <View style={styles.logoCircle}>
                  <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="cover" />
                </View>
                <View style={styles.brandTextWrapper}>
                  <Text style={[styles.headerBrandTitle, { color: colors.foreground }]} numberOfLines={1}>
                    CARYANAM
                  </Text>
                  <Text style={[styles.headerBrandSub, { color: colors.mutedForeground }]} numberOfLines={1} ellipsizeMode="tail">
                    INSPECTION & BIDDING
                  </Text>
                </View>
              </View>
            ),
            headerTitleAlign: 'left',
            headerLeft: () => null,
            headerRight: () => (
              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={[styles.circularThemeBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={toggleTheme}
                  activeOpacity={0.7}
                >
                  {theme === 'dark' ? (
                    <Sun size={16} color="#FFC700" />
                  ) : (
                    <Moon size={16} color="#0D0E12" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circularMenuBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => setDrawerOpen(true)}
                  activeOpacity={0.7}
                >
                  <Menu size={20} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            ),
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: 'About Us' }}
          />
          <Stack.Screen
            name="WhyChoose"
            component={WhyChooseScreen}
            options={{ title: 'Why Choose Us' }}
          />
          <Stack.Screen
            name="Contact"
            component={ContactScreen}
            options={{ title: 'Contact Support' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign In', headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Register Account', headerShown: false }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            component={PrivacyPolicyScreen}
            options={{ title: 'Privacy Policy' }}
          />
          <Stack.Screen
            name="TermsConditions"
            component={TermsConditionsScreen}
            options={{ title: 'Terms & Conditions' }}
          />
          <Stack.Screen
            name="AdminDashboard"
            options={{ title: 'Admin Console', headerShown: false }}
          >
            {props => <AdminDashboardScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminVehicles"
            options={{ title: 'Manage Vehicles', headerShown: false }}
          >
            {props => <AdminVehiclesScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminVehicleDetail"
            options={{ title: 'Vehicle Inspection Detail', headerShown: false }}
          >
            {props => <AdminVehicleDetailScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminAuctions"
            options={{ title: 'Auctions Management', headerShown: false }}
          >
            {props => <AdminAuctionsScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminLiveBidding"
            options={{ title: 'Live Bidding Telemetry', headerShown: false }}
          >
            {props => <AdminLiveBiddingScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminAuctionDetail"
            options={{ title: 'Auction Details', headerShown: false }}
          >
            {props => <AdminAuctionDetailScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminDealers"
            options={{ title: 'Registered Dealers Management', headerShown: false }}
          >
            {props => <AdminDealersScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminInspectors"
            options={{ title: 'Registered Inspectors Management', headerShown: false }}
          >
            {props => <AdminInspectorsScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="AdminAnalytics"
            options={{ title: 'Analytics', headerShown: false }}
          >
            {props => <AdminAnalyticsScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="DealerDashboard"
            options={{ title: 'Dealer Console', headerShown: false }}
          >
            {props => <DealerDashboardScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="DealerMarketplace"
            options={{ title: 'Dealer Marketplace', headerShown: false }}
          >
            {props => <DealerMarketplaceScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="DealerBids"
            options={{ title: 'My Bids', headerShown: false }}
          >
            {props => <DealerBidsScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="DealerFavourites"
            options={{ title: 'Favourites', headerShown: false }}
          >
            {props => <DealerFavouritesScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="DealerProfile"
            options={{ title: 'Dealer Profile', headerShown: false }}
          >
            {props => <DealerProfileScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="DealerVehicleDetail"
            options={{ title: 'Vehicle Details', headerShown: false }}
          >
            {props => <DealerVehicleDetailScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="InspectorDashboard"
            options={{ title: 'Inspector Console', headerShown: false }}
          >
            {props => <InspectorDashboardScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="InspectorProfile"
            options={{ title: 'Profile & Settings', headerShown: false }}
          >
            {props => <InspectorProfileScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="InspectorVehicles"
            options={{ title: 'My Vehicles', headerShown: false }}
          >
            {props => <InspectorVehiclesScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="InspectorVehicleDetail"
            options={{ title: 'Inspection Details', headerShown: false }}
          >
            {props => <InspectorVehicleDetailScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
          <Stack.Screen
            name="InspectorAddVehicle"
            options={{ title: 'Perform Evaluation', headerShown: false }}
          >
            {props => <InspectorAddVehicleScreen {...props} onOpenMenu={() => setDrawerOpen(true)} />}
          </Stack.Screen>
        </Stack.Navigator>

        {/* Global Sidebar Drawer Menu */}
        <SidebarDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          navigation={navigationRef}
          currentRouteName={currentRoute}
        />
      </NavigationContainer>

      {/* Global Session Expiry Modal */}
      <SessionExpiredModal onLoginAgain={handleLoginAgain} />
    </View>
  );
};

export const AppNavigator = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <NavigationContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    gap: 8,
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 199, 0, 0.8)',
    backgroundColor: '#0D0E12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  brandTextWrapper: {
    justifyContent: 'center',
    marginTop: 1,
  },
  headerBrandTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    lineHeight: 17,
    marginBottom: 1,
  },
  headerBrandSub: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 11,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    gap: 8,
  },
  circularThemeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularMenuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

