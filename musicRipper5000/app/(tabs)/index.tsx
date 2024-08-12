import { StyleSheet, Alert, FlatList, TouchableWithoutFeedback } from 'react-native';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import Slider from '@react-native-community/slider';

export default function TabOneScreen() {
  interface MediaFile {
    filename: string;
    uri: string;
    // Add other properties as needed
  }

  const [songs, setSongs] = useState<MediaFile[]>([]);

  
  const filterTitles = (title: string) => {
    if(title){
      let firstPass = title.replace('Y2meta.app - ', '');
      let secondPass = firstPass.replace('(128 kbps)', '');
      let thirdPass = secondPass.replace('(320 kbps)', '');
      return thirdPass.replace('.mp3', '');
    }
    else return title
  }

  const getMedia = async () => {
    const filterMedia = (media: MediaFile[]) => {
      return media.filter(file => file.filename.split('.').pop() === 'mp3');
    }
    const permission = await MediaLibrary.getPermissionsAsync();
    if(permission.granted){
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
      });
      setSongs(filterMedia(media.assets as MediaFile[]));
    }
    else if(!permission.granted && permission.canAskAgain){
      const {status, canAskAgain} = await MediaLibrary.requestPermissionsAsync();
      if(status === 'denied' && !canAskAgain){
        Alert.alert("You cannot use this app without the provided permissions");
      }
    }
  }

  useEffect(() => {
    getMedia();
  }, [])
  return (
    <View style={styles.container}>
      <Text style={{fontSize: 30, margin: 10}} >My Songs</Text>
      <FlatList 
          data={songs}
          contentContainerStyle={{}}
          renderItem={({ item }) => (
            <TouchableWithoutFeedback style={styles.songCard} onPress={() => {console.log(item.filename)}} >
              <Text>{filterTitles(item.filename)}</Text>
              
            </TouchableWithoutFeedback>
          )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  songCard: {
    padding: 10,
    borderColor: 'white',
    borderWidth: 10,
  }
});
