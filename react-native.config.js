// iOS에는 Firebase 설정 파일(GoogleService-Info.plist)이 아직 없어서 FCM 네이티브 모듈을 iOS에서는 빼고 빌드한다.
// plist를 받으면 이 설정을 지우고 pod install 한 뒤 src/services/push.ts의 Android 제한을 푼다.
module.exports = {
  dependencies: {
    '@react-native-firebase/app': { platforms: { ios: null } },
    '@react-native-firebase/messaging': { platforms: { ios: null } },
  },
};
