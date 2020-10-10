import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, useRef } from 'react';
import { Dimensions, TouchableOpacity, Platform } from 'react-native';
import * as Permissions from 'expo-permissions';
import * as FaceDetector from 'expo-face-detector';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import styled from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';

const ALBUM_NAME = 'Smiley Cam';

const { width, height } = Dimensions.get('window');

const CenterView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: cornflowerblue;
`;

const Text = styled.Text`
  color: #fff;
  font-size: 22px;
`;

const SmilingProbability = styled.Text`
  margin-top: 10px;
  color: #fff;
  font-size: 22px;
`;

const IconBar = styled.View`
  margin-top: 20px;
`;

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const [cameraStyle, setCameraStyle] = useState({
    width: width - 40,
    height: height / 1.5,
    overflow: 'hidden',
    borderRadius: 20,
  });
  const [smileDetect, setSmileDetect] = useState(false);
  const [smilingProbability, setSmilingProbability] = useState(0);
  const cameraRef = useRef(null);

  const permissionFn = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    if (status === 'granted') {
      setHasPermission('granted');
    } else {
      setHasPermission('denied');
    }
  };

  const switchCameraType = () => {
    cameraType === Camera.Constants.Type.front
      ? setCameraType(Camera.Constants.Type.back)
      : setCameraType(Camera.Constants.Type.front);
  };

  const onFacesDetected = ({ faces }) => {
    const face = faces[0];
    if (face) {
      setSmilingProbability(face.smilingProbability);
      if (face.smilingProbability > 0.7) {
        setSmileDetect(true);
        takePhoto();
      }
    }
  };

  const takePhoto = async () => {
    try {
      if (cameraRef.current) {
        const { uri } = await cameraRef.current.takePictureAsync({
          quality: 1,
          exit: true,
        });
        if (uri) savePhoto(uri);
      }
    } catch (error) {
      alert(error);
      setSmileDetect(false);
    }
  };

  const savePhoto = async uri => {
    try {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status === 'granted') {
        const asset = await MediaLibrary.createAssetAsync(uri);
        let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        if (album === null) {
          album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album.id);
        }
        setTimeout(() => {
          setSmileDetect(false);
        }, 2000);
      } else {
        hasPermission(false);
      }
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    permissionFn();
  }, []);

  return (
    <CenterView>
      {hasPermission === 'granted' ? (
        <>
          <Camera
            ref={cameraRef}
            style={cameraStyle}
            type={cameraType}
            onFacesDetected={smileDetect ? null : onFacesDetected}
            faceDetectorSettings={{
              mode: FaceDetector.Constants.Mode.fast,
              detectLandmarks: FaceDetector.Constants.Landmarks.all,
              runClassifications: FaceDetector.Constants.Classifications.all,
              minDetectionInterval: 100,
              tracking: true,
            }}
          />
          <SmilingProbability>
            {(smilingProbability * 100).toFixed(1)}%
          </SmilingProbability>
          <IconBar>
            <TouchableOpacity onPress={switchCameraType}>
              <MaterialIcons
                name={
                  cameraType === Camera.Constants.Type.front
                    ? 'camera-rear'
                    : 'camera-front'
                }
                color="#ffffff"
                size={50}
              />
            </TouchableOpacity>
          </IconBar>
        </>
      ) : hasPermission === 'denied' ? (
        <Text>Don't have permission for this</Text>
      ) : (
        <Text>Loading</Text>
      )}
      <StatusBar style="auto" />
    </CenterView>
  );
}
