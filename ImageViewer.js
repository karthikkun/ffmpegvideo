import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, Image } from 'react-native';

const ImageViewer = (props) => {
    return (
        <SafeAreaView style={styles.mainContainer}>
            {props.frames && (
            <ScrollView
                style={styles.scroll}>
                {props.frames.map((frameUri, index) => renderFrame(frameUri, index))}
                <View style={styles.appendFrame} />
            </ScrollView>
        )}
        </SafeAreaView>
    );
}

const TILE_WIDTH = 320;
const TILE_HEIGHT = 240;


const renderFrame = (frameUri, index) => {
      return (
        <Image
          key={index}
          source={{
            uri: frameUri,
          }}
          style={styles.frame}
        />
      );
  };

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    frame: {
      width: TILE_WIDTH,
      height: TILE_HEIGHT
    },
  });

export default ImageViewer