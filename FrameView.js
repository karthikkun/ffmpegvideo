import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Image, Text, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';

const flickerApiUrl = 'https://8tyivulyri.execute-api.us-east-1.amazonaws.com/test/predicted-categories';
const apiKey = 'RR5A1GzeUM5dkaxumy2ib3SMG2FmDOji4rY1briF';

const TILE_WIDTH = 320;
const TILE_HEIGHT = 240;

const FrameView = (props) => {
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    const processPhoto = async (photoUri, index) => {
      try {
        const photoBytes = await FileSystem.readAsStringAsync(photoUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const photo_b64_string = atob(photoBytes)
        // const photo_b64_string = `data:image/jpeg;base64,${photoBytes}`;
        console.log(photo_b64_string)
        const response = await fetch(flickerApiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ photo_b64_string }),
        });
        const responseJson = await response.json();
        console.log('..............', responseJson)

        if (responseJson.predictions && responseJson.predictions.length > 0) {
          const { category, probability } = responseJson.predictions[0];
          const updatedPredictions = { ...predictions };
          updatedPredictions[index] = `${category} (${probability})`;
          setPredictions(updatedPredictions);
          console.log(predictions)
        }
      } catch (error) {
        console.error('Error processing photo:', error);
      }
    };

    const convertImageToBase64 = async (uri) => {
      try {
        const base64String = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setPhotoB64String(base64String);
      } catch (error) {
        console.error('Error converting image to base64:', error);
      }
    };

    const processFrames = async () => {
      setLoading(true);
      await Promise.all(props.frames.map((frameUri, index) => processPhoto(frameUri, index)));
      setLoading(false);
    };

    processFrames();
  }, [props.frames]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView style={styles.scroll}>
          {props.frames.map((frameUri, index) => (
            <View key={index} style={styles.frameContainer}>
              <Image source={{ uri: frameUri }} style={styles.frame} />
              <Text style={styles.label}>{predictions[index]}</Text>
            </View>
          ))}
          <View style={styles.appendFrame} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  frameContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  frame: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    marginBottom: 10,
  },
  label: {
    textAlign: 'center',
  },
  appendFrame: {
    height: 20,
  },
});

export default FrameView;
