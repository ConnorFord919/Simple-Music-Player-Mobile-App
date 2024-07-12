import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, SafeAreaView, FlatList, Image, Button, Alert} from 'react-native';
import { useState, useEffect} from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from "expo-av";

export default function App() {
  const [songs, setSongs] = useState([]);
  getPermission = async () => {
    const permission = await MediaLibrary.getPermissionsAsync();
    if(permission.granted){
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
      });
      setSongs(media);
    }
    else if(!permission.granted && permission.canAskAgain){
      const {status, canAskAgain} = await MediaLibrary.requestPermissionsAsync();
      if(status === 'denied' && !canAskAgain){
        Alert.alert("You cannot use this app without the provided permissions");
      }
    }
  }
  useEffect(() => {
    getPermission();
  }, [])
  useEffect(() => {
    if(songs.assets.length > 0){
      const playBackObj = new Audio.Sound();
      playBackObj.loadAsync({uri: songs.assets[0].uri}, {shouldPlay: false});
    }else console.log(songs.assets[0]);
  }, [songs])
  
  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.header} >
        <Text style={styles.logo} >Musica Max</Text>
      </View>
      <View style={styles.playListHeader} >
        <Text>My Playlists</Text>
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <Text>{`Name: ${item.filename}, Uri: ${item.uri}`}</Text>
            </View>
          )}
        />
      </View>
      <View style={styles.topSongsHeader} >
        <Text>Top Songs</Text>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    height: '100%'
  },
  header: {
    width: '100%',
    height: '200px',
    backgroundColor:'#72A0C1',
  },
  logo: {
    fontSize: 25,
    paddingTop: 50,
    textAlign: 'center'
  },
  playListHeader: {
    backgroundColor: "green",
    padding : 20
  },
  topSongsHeader : {
    backgroundColor: "blue",
    padding : 20
  }
});
