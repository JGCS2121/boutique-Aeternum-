import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AETERNUM</Text>
      <Text style={styles.sub}>App funcionando ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131313',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
  },
  sub: {
    color: '#919191',
    fontSize: 14,
    marginTop: 12,
  },
});
