import { Video } from 'expo-av';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { FFmpegKit, FFmpegKitConfig, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View, SafeAreaView } from 'react-native';
import ImageViewer from './ImageViewer';

export default function App() {
  const flag = false;
  const DocumentDir = FileSystem.documentDirectory;
  const CacheDir = FileSystem.cacheDirectory;
  const stepFrameDir = `${CacheDir}/stepframe`;
  const keyFrameDir = `${CacheDir}/keyframe`;

  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  
  const [frames, setFrames] = useState(null);
  const [camera, setCamera] = useState(null);
  const [record, setRecord] = useState(null);
  const [recordDuration, setRecordDuration] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const video = React.useRef(null);
  const [status, setStatus] = React.useState({});

  const cleanCacheDir = async (dir) => {
    console.log('clearing cache... ', dir);
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir)
    }
    const cachedFiles = await FileSystem.readDirectoryAsync(dir)
      for(let i = 0; i < cachedFiles.length; i += 1) {
        console.log(`deleting... ${dir}/${cachedFiles[i]}`);
        FileSystem.deleteAsync(`${dir}/${cachedFiles[i]}`, { idempotent: true })
      }
  }

  const stepSampling = async (videoUrl) => {
    await cleanCacheDir(stepFrameDir);
    let outputImagePath = `${stepFrameDir}`;
    FFprobeKit.getMediaInformation(videoUrl).then(
      (information) => {
        console.log('Result: ' + JSON.stringify(information));
        const FRAME_PER_SEC = 1;
        const ffmpegCommand = `-ss 0 -i ${videoUrl} -r ${FRAME_PER_SEC} ${outputImagePath}/stepframe%04d.png`;
        FFmpegKit.executeAsync(
          ffmpegCommand,
          async session => {
            const state = FFmpegKitConfig.sessionStateToString(
              await session.getState(),
            );
            const returnCode = await session.getReturnCode();
            const failStackTrace = await session.getFailStackTrace();
            const duration = await session.getDuration();

            if (ReturnCode.isSuccess(returnCode)) {
              console.log(
                `Encode completed successfully in ${duration} milliseconds;.`,
              );
              console.log(`Check at ${outputImagePath}`);
              successCallback(outputImagePath);
            } else {
              console.log('Encode failed. Please check log for the details.');
              console.log(
                `Encode failed with state ${state} and rc ${returnCode}.${
                  (failStackTrace, '\\n')
                }`,
              );
              // errorCallback();
            }
          },
          log => {
            console.log(log.getMessage());
          },
          statistics => {
            console.log(statistics);
          },
        ).then(session =>
          console.log(
            `Async FFmpeg process started with sessionId ${session.getSessionId()}.`,
          ),
        );
      },
    );
    // const videoDuration = Math.floor(videoMeta.getDuration());
    // setRecordDuration(videoDuration);
    // console.log('videoDuration', videoMeta.getDuration());
  }

  const successCallback = async (outputImagePath) => {
      const _framesURI = [];
      const cachedFiles = await FileSystem.readDirectoryAsync(outputImagePath)
      for (let i = 0; i < cachedFiles.length; i++) {
        _framesURI.push(
          `${outputImagePath}/${cachedFiles[i].replace('%4d', String(i).padStart(4, 0))}`,
        );
      }
      setFrames(_framesURI);
  }


  const keyFrameSampling = async (videoUrl) => {
    await cleanCacheDir(keyFrameDir);
    let outputImagePath = `${keyFrameDir}`;
    FFprobeKit.getMediaInformation(videoUrl).then(
      (information) => {
        console.log('Result: ' + JSON.stringify(information));
        const ffmpegCommand = `-skip_frame nokey -i ${videoUrl} -vsync vfr -frame_pts true ${outputImagePath}/keyframe%04d.png`;
        FFmpegKit.executeAsync(
          ffmpegCommand,
          async session => {
            const state = FFmpegKitConfig.sessionStateToString(
              await session.getState(),
            );
            const returnCode = await session.getReturnCode();
            const failStackTrace = await session.getFailStackTrace();
            const duration = await session.getDuration();

            if (ReturnCode.isSuccess(returnCode)) {
              console.log(
                `Encode completed successfully in ${duration} milliseconds;.`,
              );
              console.log(`Check at ${outputImagePath}`);
              successCallback(outputImagePath);
            } else {
              console.log('Encode failed. Please check log for the details.');
              console.log(
                `Encode failed with state ${state} and rc ${returnCode}.${
                  (failStackTrace, '\\n')
                }`,
              );
              // errorCallback();
            }
          },
          log => {
            console.log(log.getMessage());
          },
          statistics => {
            console.log(statistics);
          },
        ).then(session =>
          console.log(
            `Async FFmpeg process started with sessionId ${session.getSessionId()}.`,
          ),
        );
      },
    );
  }

  const handleVideoLoad = async () => {
    console.log('hello...')
    console.log('url', record)
    let outputImagePath = `${CacheDir}/keyframes/`;
    FFmpegKit.execute(`-i ${record} -vf "select=eq(pict_type\,I)" -vsync vfr ${outputImagePath}/keyframe-%02d.jpeg`)
    .then(async session => {
      const state = FFmpegKitConfig.sessionStateToString(
        await session.getState(),
      );
      const returnCode = await session.getReturnCode();
      const failStackTrace = await session.getFailStackTrace();
      const duration = await session.getDuration();
      // success call back
      console.log('status.........', state)
      console.log(returnCode, failStackTrace, duration)
      if (ReturnCode.isSuccess(returnCode)) {
        console.log(
          `Encode completed successfully in ${duration} milliseconds;`,
        );
      } else if (ReturnCode.isCancel(returnCode)) {
        console.log('Encode canceled');
      } else {
        console.log(
          `Encode failed with state ${state} and rc ${returnCode}.${(failStackTrace, '\\n')}`,
        );
      }
    });
  };

 
  

  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
      const audioStatus = await Camera.requestMicrophonePermissionsAsync();
      setHasAudioPermission(audioStatus.status === 'granted');
    })();
  }, []);

  const takeVideo = async () => {
    if(camera){
        const data = await camera.recordAsync({
          maxDuration:10000
        })
        setRecord(data.uri);
        // await stepSampling(data.uri);
        await keyFrameSampling(data.uri);
    }
  }

  const stopVideo = async () => {
    camera.stopRecording();
  }

  if (hasCameraPermission === null || hasAudioPermission == null) {
    return <View />;
  }
  if (hasCameraPermission === false || hasAudioPermission == false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View>
      {flag ? (
        <ImageViewer frames={frames}/>
      ) : (
        <>
          <View style={{ flex: 1}}>
            <View style={styles.cameraContainer}>
                <Camera 
                ref={ref => setCamera(ref)}
                style={styles.fixedRatio} 
                type={type}
                ratio={'4:3'} />
            </View>
            <Video
              ref={video}
              style={styles.video}
              source={{
                uri: record,
              }}
              useNativeControls
              resizeMode="contain"
              isLooping
              onPlaybackStatusUpdate={status => setStatus(() => status)}
            />
            <View style={styles.buttons}>
              <Button
                title={status.isPlaying ? 'Pause' : 'Play'}
                onPress={() =>
                  status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
                }
              />
              <Button
                title="Flip Video"
                onPress={() => {
                  setType(
                    type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back
                  );
                }}>
              </Button>
              <Button title="Take video" onPress={() => takeVideo()} />
              <Button title="Stop Video" onPress={() => stopVideo()} />
            </View>
            
          </View>
        </>
      )} 
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
      flex: 1,
      flexDirection: 'row'
  },
  fixedRatio:{
      flex: 1,
      aspectRatio: 1
  },
  video: {
    alignSelf: 'center',
    width: 350,
    height: 220,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});