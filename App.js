import 'react-native-gesture-handler';
import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  ScrollView,
  Animated,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const BASE_URL = 'https://aeternum.com.co/';

// ─── Configuración OneSignal ──────────────────────────────────────────────────
const ONESIGNAL_APP_ID = "259c35ff-dde0-4535-b3e8-1fd7102d45af";

// Contexto para el scroll handler
const ScrollContext = createContext(null);

// ─── Drawer personalizado ─────────────────────────────────────────────────────
// ─── Drawer personalizado ─────────────────────────────────────────────────────
function CustomDrawerContent(props) {
  const navigation = useNavigation();

  const handleCategoryPress = (slug) => {
    props.navigation.closeDrawer();
    navigation.navigate('Main', { screen: 'Inicio', params: { url: `${BASE_URL}${slug}` } });
  };

  const menuItems = [
    { name: 'TODO', slug: 'shop', icon: 'apps-outline' },
    { name: 'RECIÉN LLEGADO', slug: 'shop/?orderby=date', icon: 'flash-outline' },
    { name: 'VESTIDOS', slug: 'categoria-producto/vestidos', icon: 'shirt-outline' },
    { name: 'BODYS', slug: 'categoria-producto/bodys', icon: 'body-outline' },
    { name: 'BLUSAS', slug: 'categoria-producto/blusas', icon: 'leaf-outline' },
    { name: 'CONJUNTOS', slug: 'categoria-producto/conjuntos', icon: 'layers-outline' },
    { name: 'REBAJAS', slug: 'shop/?on_sale=1', icon: 'pricetag-outline' },
  ];

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: '#FFFFFF' }}>
      <View style={{ padding: 24, paddingVertical: 40, borderBottomWidth: 0.5, borderBottomColor: '#EEEEEE', alignItems: 'center' }}>
        <Image 
          source={require('./assets/icon.png')} 
          style={{ width: 100, height: 100, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#888888', fontSize: 9, letterSpacing: 3 }}>STYLE AETERNUM</Text>
      </View>

      <View style={{ paddingVertical: 16 }}>
        <Text style={styles.drawerSectionTitle}>COMPRAR POR CATEGORÍA</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.drawerItem}
            onPress={() => handleCategoryPress(item.slug)}
          >
            <Ionicons name={item.icon} size={20} color="#000000" style={{ width: 30 }} />
            <Text style={styles.drawerItemText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 20, paddingVertical: 16, borderTopWidth: 0.5, borderTopColor: '#EEEEEE' }}>
        <Text style={styles.drawerSectionTitle}>MI CUENTA</Text>
        
        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            props.navigation.closeDrawer();
            navigation.navigate('Main', { screen: 'Mi Cuenta', params: { url: `${BASE_URL}my-account/` } });
          }}
        >
          <Ionicons name="person-outline" size={20} color="#000000" style={{ width: 30 }} />
          <Text style={styles.drawerItemText}>Mi Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.drawerItem}
          onPress={() => {
            props.navigation.closeDrawer();
            navigation.navigate('Main', { screen: 'Inicio', params: { url: `${BASE_URL}my-account/customer-logout/` } });
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={{ width: 30 }} />
          <Text style={[styles.drawerItemText, { color: '#FF3B30' }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// ─── WebView Screen ───────────────────────────────────────────────────────────
function WebViewScreen({ route }) {
  const { url } = route.params;
  const webViewRef = useRef(null);
  const navigation = useNavigation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 62 + insets.bottom;

  useEffect(() => {
    if (currentUrl !== url) {
      setCurrentUrl(url);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = '${url}'; true;`);
      }
    }
  }, [url]);

  useEffect(() => {
    const isProduct = currentUrl.includes('/producto/') || currentUrl.includes('/product/');
    navigation.setOptions({
      tabBarStyle: isProduct ? { display: 'none' } : {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0.5,
        borderTopColor: '#EEEEEE',
        height: tabBarHeight,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        paddingTop: 10,
        elevation: 10,
      }
    });
  }, [currentUrl, navigation, insets.bottom, tabBarHeight]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (webViewRef.current && hasLoadedOnce && (url.includes('cart') || url.includes('my-account'))) {
        webViewRef.current.reload();
      }
    });
    return unsubscribeFocus;
  }, [navigation, hasLoadedOnce, url]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hwBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    // Escuchar el evento de refresco desde el Deep Link
    const refreshSub = DeviceEventEmitter.addListener('refresh_webview', () => {
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
    });

    return () => {
      sub.remove();
      refreshSub.remove();
    };
  }, [canGoBack]);

  const autoScrollScript = `
    (function() {
      const isHome = window.location.pathname === '/' || window.location.pathname === '';
      const isShopOrCat = window.location.href.includes('shop') || window.location.href.includes('categoria-producto');

      if (!isHome && isShopOrCat) {
        setTimeout(() => {
          window.scrollTo({
            top: 650,
            behavior: 'smooth'
          });
        }, 600);
      }

      // Forzar redirect_to correcto en cualquier formulario de login (aunque ya tenga uno)
      function forceRedirect(form) {
        let input = form.querySelector('input[name="redirect_to"]');
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'redirect_to';
          form.appendChild(input);
        }
        // Siempre forzar, aunque ya exista un valor previo
        input.value = 'https://aeternum.com.co/my-account/';
      }

      // Aplicar a formularios ya en el DOM
      document.querySelectorAll('form[action*="wp-login.php"], form[id="loginform"], form[name="loginform"]').forEach(forceRedirect);

      // Vigilar formularios añadidos dinámicamente por JS
      const observer = new MutationObserver(() => {
        document.querySelectorAll('form[action*="wp-login.php"], form[id="loginform"], form[name="loginform"]').forEach(forceRedirect);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    })();
    true;
  `;

  const handleLoadStart = () => {
    if (!hasLoadedOnce) {
      setIsPageLoading(true);
    }
  };

  const handleLoadEnd = () => {
    if (!hasLoadedOnce) {
      setIsPageLoading(false);
      setHasLoadedOnce(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={{ flex: 1 }}
          userAgent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
          onNavigationStateChange={(s) => {
            setCanGoBack(s.canGoBack);
            setCurrentUrl(s.url);
            
            // Después de cerrar sesión → inicio
            if (s.url.includes('wp-login.php?loggedout=true')) {
              navigation.navigate('Main', { screen: 'Inicio', params: { url: BASE_URL } });
              return;
            }

            // Si WordPress nos manda al panel de admin → Mi Cuenta
            if (s.url.includes('wp-admin') && !s.url.includes('admin-ajax.php')) {
              navigation.navigate('Main', { screen: 'Mi Cuenta', params: { url: `${BASE_URL}my-account/` } });
              return;
            }

            // Si WordPress muestra su propia página de login/error → volver a Mi Cuenta
            if (s.url.includes('wp-login.php') && !s.url.includes('loggedout') && !s.url.includes('action=logout')) {
              navigation.navigate('Main', { screen: 'Mi Cuenta', params: { url: `${BASE_URL}my-account/?login_error=1` } });
            }
          }}
          injectedJavaScript={autoScrollScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          allowFileAccess={true}
          scalesPageToFit={true}
          setSupportMultipleWindows={false}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onShouldStartLoadWithRequest={(request) => {
            // Interceptar enlaces de WhatsApp para abrirlos en la App nativa
            if (request.url.startsWith('whatsapp://') || request.url.includes('api.whatsapp.com') || request.url.includes('wa.me')) {
              Linking.openURL(request.url).catch(() => {
                console.warn('WhatsApp no está instalado');
              });
              return false; // Evitar que el WebView intente cargarlo
            }
            return true;
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error: ', nativeEvent);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
        />
      </Animated.View>
      
      {isPageLoading && (
        <View style={styles.loader}>
          <ActivityIndicator color="#000000" size="large" />
          <Text style={{ marginTop: 10, fontSize: 10, letterSpacing: 2, color: '#888888' }}>CARGANDO...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Pantallas del Tab ────────────────────────────────────────────────────────
function ScreenInicio({ route }) { 
  const url = route?.params?.url ?? BASE_URL;
  return <WebViewScreen route={{ params: { url } }} />; 
}
function ScreenCategorias({ route }){ 
  const url = route?.params?.url ?? `${BASE_URL}shop/`;
  return <WebViewScreen route={{ params: { url } }} />; 
}
function ScreenCarrito({ route })   { 
  const url = route?.params?.url ?? `${BASE_URL}cart/`;
  return <WebViewScreen route={{ params: { url } }} />; 
}
function ScreenCuenta({ route })    { 
  const url = route?.params?.url ?? `${BASE_URL}my-account/`;
  return <WebViewScreen route={{ params: { url } }} />; 
}

// ─── Header con buscador ──────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'TODO', slug: 'shop' },
  { name: 'RECIÉN LLEGADO', slug: 'shop/?orderby=date' },
  { name: 'VESTIDOS', slug: 'categoria-producto/vestidos' },
  { name: 'BODYS', slug: 'categoria-producto/bodys' },
  { name: 'BLUSAS', slug: 'categoria-producto/blusas' },
  { name: 'CONJUNTOS', slug: 'categoria-producto/conjuntos' },
  { name: 'REBAJAS', slug: 'shop/?on_sale=1' },
];

function HeaderSearchBar() {
  const navigation = useNavigation();
  const [selectedCat, setSelectedCat] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      const searchUrl = `${BASE_URL}?s=${encodeURIComponent(searchQuery)}`;
      navigation.navigate('Main', { screen: 'Inicio', params: { url: searchUrl } });
      setSearchQuery('');
    }
  };

  const handleCategoryPress = (index, slug) => {
    setSelectedCat(index);
    const categoryUrl = `${BASE_URL}${slug}`;
    navigation.navigate('Main', { screen: 'Inicio', params: { url: categoryUrl } });
  };

  return (
    <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => navigation.openDrawer()}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={26} color="#000000" />
          </TouchableOpacity>

          <View style={styles.integratedSearchBar}>
            <Ionicons name="search-outline" size={16} color="#888" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o SKU..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Main', { screen: 'Inicio', params: { url: `${BASE_URL}wishlist/` } })}
            >
              <Ionicons name="heart-outline" size={22} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Main', { screen: 'Mi Cuenta', params: { url: `${BASE_URL}my-account/` } })}
            >
              <View style={styles.dot} />
              <Ionicons name="notifications-outline" size={22} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24, paddingBottom: 4, marginTop: 8 }}
        >
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => handleCategoryPress(i, cat.slug)}
              style={styles.categoryItem}
            >
              <Text style={[
                styles.categoryText, 
                selectedCat === i && styles.categoryTextActive
              ]}>
                {cat.name}
              </Text>
              {selectedCat === i && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Tab Navigator ────────────────────────────────────────────────────────────
function MainTabs() {
  const insets = useSafeAreaInsets();
  const headerHeight = useRef(120);
  const layoutAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerShown = useRef(true);

  const handleScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    const diff = y - lastScrollY.current;
    lastScrollY.current = y;

    if (y <= 10 && !headerShown.current) {
      headerShown.current = true;
      Animated.timing(layoutAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else if (diff > 15 && y > 100 && headerShown.current) {
      headerShown.current = false;
      Animated.timing(layoutAnim, {
        toValue: -headerHeight.current,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (diff < -20 && y > 100 && !headerShown.current) {
      headerShown.current = true;
      Animated.timing(layoutAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [layoutAnim]);

  const tabBarHeight = Platform.OS === 'ios' ? 88 : 62 + insets.bottom;

  return (
    <ScrollContext.Provider value={handleScroll}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <Animated.View
          style={{ marginTop: layoutAnim, zIndex: 10 }}
          onLayout={(e) => { headerHeight.current = e.nativeEvent.layout.height; }}
        >
          <HeaderSearchBar />
        </Animated.View>

        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color }) => {
                const icons = {
                  'Inicio':     focused ? 'home'   : 'home-outline',
                  'Categorías': focused ? 'grid'   : 'grid-outline',
                  'Carrito':    focused ? 'cart'   : 'cart-outline',
                  'Mi Cuenta':  focused ? 'person' : 'person-outline',
                };
                return <Ionicons name={icons[route.name]} size={22} color={color} />;
              },
              tabBarActiveTintColor: '#000000',
              tabBarInactiveTintColor: '#888888',
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '600',
              },
              tabBarStyle: {
                backgroundColor: '#FFFFFF',
                borderTopWidth: 0.5,
                borderTopColor: '#EEEEEE',
                height: tabBarHeight,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                paddingTop: 10,
                elevation: 10,
              },
            })}
          >
            <Tab.Screen 
              name="Inicio" 
              component={ScreenInicio} 
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  // Al pulsar Inicio, forzamos que vuelva a la URL base
                  navigation.navigate('Main', { screen: 'Inicio', params: { url: BASE_URL } });
                },
              })}
            />
            <Tab.Screen 
              name="Categorías" 
              component={ScreenCategorias} 
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  // Evitamos que navegue a la pantalla y abrimos el drawer
                  e.preventDefault();
                  navigation.openDrawer();
                },
              })}
            />
            <Tab.Screen 
              name="Carrito"     
              component={ScreenCarrito} 
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  navigation.navigate('Main', { screen: 'Carrito', params: { url: `${BASE_URL}cart/` } });
                },
              })}
            />
            <Tab.Screen 
              name="Mi Cuenta"   
              component={ScreenCuenta} 
              listeners={({ navigation }) => ({
                tabPress: (e) => {
                  navigation.navigate('Main', { screen: 'Mi Cuenta', params: { url: `${BASE_URL}my-account/` } });
                },
              })}
            />
          </Tab.Navigator>
        </View>
      </View>
    </ScrollContext.Provider>
  );
}


// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    // Inicializar OneSignal
    OneSignal.Debug.setLogLevel(LogLevel.None);
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Solicitar permisos de notificación
    OneSignal.Notifications.requestPermission(true);

    // Listener para cuando llega una notificación
    // Listener para Deep Linking (retorno desde el navegador)
    const handleDeepLink = (event) => {
      // Si recibimos aeternum:// significa que el login terminó
      if (event.url && event.url.includes('aeternum://')) {
        console.log('Deep link recibido, refrescando sesión...');
        // Cerramos el navegador si sigue abierto
        WebBrowser.dismissBrowser();
        // Emitimos evento para que el WebView se recargue
        DeviceEventEmitter.emit('refresh_webview');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <NavigationContainer>
          <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
              headerShown: false,
              drawerActiveTintColor: '#000000',
              drawerInactiveTintColor: '#888888',
              drawerStyle: { backgroundColor: '#FFFFFF', width: '75%' },
              drawerLabelStyle: {
                fontSize: 14,
                fontWeight: '600',
                letterSpacing: 0.5,
              },
              drawerActiveBackgroundColor: '#F5F5F5',
            }}
          >
            <Drawer.Screen name="Main" component={MainTabs} options={{ title: 'Tienda' }} />
          </Drawer.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 2,
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginLeft: -8,
  },
  integratedSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    marginHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
    padding: 4,
  },
  dot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  categoryItem: {
    marginRight: 24,
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 16,
    height: 3,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 2,
    marginLeft: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  drawerItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.5,
  },
});



