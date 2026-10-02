import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  BackHandler,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react-native';

interface SplashScreenProps {
  navigation: any;
}

const SPLASH_SCREENS = [
  {
    id: 'splash_1',
    image: require('../assets/spalshscreen1.png'),
    title: "India's Trusted Vehicle Bidding Platform",
  },
  {
    id: 'splash_2',
    image: require('../assets/spalshscreen2.png'),
    title: 'Add Vehicles in Just 15 Minutes',
  },
  {
    id: 'splash_3',
    image: require('../assets/spalshscreen3.png'),
    title: 'Detailed Inspection with 140+ Points',
  },
  {
    id: 'splash_4',
    image: require('../assets/spalshscreen4.png'),
    title: 'Bid on Verified Vehicles in Real-Time',
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Handle hardware back press on Android (go to previous slide if not on first)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentIndex > 0) {
        goToSlide(currentIndex - 1);
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [currentIndex]);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < SPLASH_SCREENS.length) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < SPLASH_SCREENS.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    navigation.replace('Home');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex >= 0 && newIndex < SPLASH_SCREENS.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const renderItem = ({ item }: { item: (typeof SPLASH_SCREENS)[0] }) => {
    return (
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#FFC700' }}>
        <Image
          source={item.image}
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          }}
          resizeMode="cover"
        />
      </View>
    );
  };

  const isLastScreen = currentIndex === SPLASH_SCREENS.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* Horizontal Carousel of 4 Splash Screen Images */}
      <FlatList
        ref={flatListRef}
        data={SPLASH_SCREENS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />

      {/* Top Bar with Back and Skip Buttons */}
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { top: Math.max(insets.top + 8, 20) }]}
      >
        {currentIndex > 0 ? (
          <TouchableOpacity
            style={styles.topBackButton}
            onPress={handleBack}
            activeOpacity={0.8}
            accessibilityLabel="Previous slide"
          >
            <ChevronLeft size={20} color="#0D0E12" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topEmptySpacer} />
        )}

        {!isLastScreen ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleFinish}
            activeOpacity={0.8}
            accessibilityLabel="Skip intro"
          >
            <Text style={styles.skipText}>Skip</Text>
            <ChevronRight size={15} color="rgba(13, 14, 18, 0.75)" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <View style={styles.topEmptySpacer} />
        )}
      </View>

      {/* Bottom Floating Control Bar */}
      <View
        pointerEvents="box-none"
        style={[
          styles.bottomControlsWrapper,
          { paddingBottom: Math.max(insets.bottom + 14, 24) },
        ]}
      >
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SPLASH_SCREENS.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => goToSlide(idx)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={[
                styles.dot,
                currentIndex === idx ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Full-Width Next / Get Started Primary Button */}
        <TouchableOpacity
          style={styles.fullWidthButton}
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityLabel={isLastScreen ? 'Get Started' : 'Next slide'}
        >
          <Text style={styles.buttonText}>
            {isLastScreen ? 'Get Started' : 'Next'}
          </Text>
          <View style={styles.arrowIconCircle}>
            <ArrowRight size={18} color="#0D0E12" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Sign In quick link on last screen */}
        {isLastScreen ? (
          <TouchableOpacity
            style={styles.signInRow}
            onPress={handleSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInPrompt}>
              Already have an account?{' '}
              <Text style={styles.signInLinkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC700',
  },
  topBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  topBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(13, 14, 18, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  topEmptySpacer: {
    width: 38,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(13, 14, 18, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0E12',
    letterSpacing: 0.3,
    marginRight: 2,
  },
  bottomControlsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 7,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    width: 28,
    backgroundColor: '#0D0E12',
  },
  inactiveDot: {
    width: 7,
    backgroundColor: 'rgba(13, 14, 18, 0.25)',
  },
  fullWidthButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0D0E12',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 199, 0, 0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  arrowIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFC700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInRow: {
    marginTop: 14,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  signInPrompt: {
    fontSize: 13,
    color: 'rgba(13, 14, 18, 0.75)',
    fontWeight: '600',
  },
  signInLinkText: {
    color: '#0D0E12',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
