import { View, StyleSheet, Text, SafeAreaView, FlatList, Image, Button, Alert, ScrollView, TouchableOpacity, TouchableHighlight, TouchableOpacityBase, TouchableNativeFeedbackBase, TouchableWithoutFeedback} from 'react-native';
import { useState, useEffect} from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from "expo-av";
import Slider from '@react-native-community/slider';

const filterTitles = (title) => {
  if(title){
    let updatedName = title.replace('Y2meta.app - ', '');
    return updatedName.replace('.mp3', '');
  }
  else return title
}

const AudioBar = ({pauseOrPlayAudio, audioPaused, currentSongName, currentSong}) => {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  currentSong.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
    }
    if (status.didJustFinish) {
      setPosition(0);
    }
  });

  const jump = async (interval) => {
    const status = await currentSong.getStatusAsync();
    await currentSong.setPositionAsync(status.positionMillis + (interval * 1000));
  }
  const handleSliderValueChange = async (value) => {
    if (currentSong) {
      const seekPosition = value * duration;
      await currentSong.setPositionAsync(seekPosition);
      setPosition(seekPosition);
    }
  };
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds) % 60;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentSong) {
        const status = await currentSong.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSong]);
  return(
      <View style={styles.audioBar}>
        <Text style={styles.songTitle} >{filterTitles(currentSongName)}</Text>
        <Text style={{marginLeft: 15}} >{`${formatTime(position/1000)} / ${formatTime(duration / 1000)}`}</Text>
        <Slider
          style={styles.progressBar}
          value={duration ? position / duration : 0}
          onValueChange={handleSliderValueChange}
          minimumTrackTintColor="#1EB1FC"
          maximumTrackTintColor="#8ED1FC"
          thumbTintColor="#1EB1FC"
        />
        <View style={styles.mainControls} >
          <Button title='-10' onPress={() => jump(-10)} />
          <TouchableWithoutFeedback onPress={() => pauseOrPlayAudio()} >
            <Image style={styles.btnPausePlay} source={audioPaused ? require('./assets/play.png') : require('./assets/pause.jpg')} />
          </TouchableWithoutFeedback>
          <Button title='+10' onPress={() => jump(10)} />
        </View>
      </View>
  )
  
}

const PlaylistView = ({songs, currentSong, setCurrentSong, setCurrentSongName, setAudioPaused}) => {
  
  useEffect(() => {
    const dismountSong = async () => {
      if(currentSong){
        await currentSong.unloadAsync();
      }
      setCurrentSong(undefined)
    }
    dismountSong();
  })
  return (
    <View style={styles.mySongsHeader} >
        <Text>My Playlists</Text>
        
      </View>
  )
}
const SongView = ({songs, currentSong, setCurrentSong, setCurrentSongName, setAudioPaused}) => {
  const selectSong = async (song) => {
    if(currentSong){
      await currentSong.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.uri },
      { shouldPlay: true },
    );
    setAudioPaused(false);
    setCurrentSongName(song.filename)
    setCurrentSong(newSound);
  }
  return (
    <View style={styles.mySongsHeader} >
        <Text>My Songs</Text>
        <FlatList 
          style={styles.songList}
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.2} style={styles.songCard} onPress={() => selectSong(item)}> 
              <Text style={styles.songTitle} >{filterTitles(item.filename)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
  )
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState();
  const [currentSongName, setCurrentSongName] = useState();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);

  const filterMedia = (media) => {
    const files = [...media.assets];
    return files.filter(file => file.filename.split('.').pop() === 'mp3');
  }
  const pauseOrPlayAudio = async () => {
    if(!audioPaused){
      await currentSong.pauseAsync();
      setAudioPaused(true);
    } 
    else{
      await currentSong.playAsync()
      setAudioPaused(false);
    }
    
  }

  const getPermission = async () => {
    const permission = await MediaLibrary.getPermissionsAsync();
    if(permission.granted){
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
      });
      const filteredMedia = filterMedia(media);
      setSongs(filteredMedia);
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
  
  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.header} >
        <Text style={styles.logo} >Musica Max</Text>
      </View>
      {showPlaylists ? 
        <PlaylistView setAudioPaused={setAudioPaused} setCurrentSongName={setCurrentSongName} currentSong={currentSong} setCurrentSong={setCurrentSong} songs={songs} /> :
        <SongView setAudioPaused={setAudioPaused} setCurrentSongName={setCurrentSongName} currentSong={currentSong} setCurrentSong={setCurrentSong} songs={songs} />
      }
      {(currentSong) &&
        <AudioBar currentSong={currentSong} currentSongName={currentSongName} audioPaused={audioPaused} setAudioPaused={setAudioPaused} pauseOrPlayAudio={pauseOrPlayAudio} />
      }
      <View style={styles.controlBar} >
        <TouchableWithoutFeedback onPress={() => {setShowPlaylists(true);}} >
          <Image 
            style={styles.icon}
            source={require('./assets/playlist.png')} 
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => {setShowPlaylists(false);}}  >
          <Image 
            style={styles.icon}
            source={require('./assets/allSongs.png')}
          />
        </TouchableWithoutFeedback>
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
  },
  mySongsHeader: {
    padding : 20
  }, 
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  }, 
  songCard: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 10,
    padding:10,
    borderStyle: 'solid',
    borderColor: 'black',
    borderWidth: 2
  },
  audioBar : {

  }, 
  controlBar : {
    width: '100%',
    height: 50,
    flex: 1,
    flexDirection: 'row',
    backgroundColor: "#e8e9eb"
  },
  icon: {
    width:50,
    height:50
  },
  songList : {
    height: 500
  },
  btnPausePlay : {
    width : 50,
    height: 50
  }, 
  mainControls : {
    flexDirection: 'row',
    justifyContent: 'space-around', // Adjust this as needed (e.g., 'flex-start', 'center', 'space-around')
    alignItems: 'center', // Adjust this as needed (e.g., 'flex-start', 'flex-end')
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  songTitle: {
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 18, 
    margin: 10
  }
});
