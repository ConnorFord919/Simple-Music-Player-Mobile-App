import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, SafeAreaView, Image, Button, Alert} from 'react-native';
import { useState } from 'react';

export default function App() {
  const [monkey, setMonkey] = useState(0);
  const [sigma, setSigma] = useState(false);
  const change = (add) => {
    setMonkey(prev => (add ? prev + 1 : prev -1 ));
  }
  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.header} >
        <Text style={styles.logo} >Musica Max</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  header: {
    width: '100%',
    height: '200px',
    backgroundColor:'#72A0C1',
    position: 'absolute',
    top:'0%',
    left:'0%'
  },
  logo: {
    fontSize: 25,
    paddingTop: 50,
    textAlign: 'center'
  }
});
