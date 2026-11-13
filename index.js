import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';
import { registerBackgroundHandler } from './src/services/push';

// FCM: 앱이 뒤에 있을 때 온 푸시 처리기는 앱 등록 전에 한 번
registerBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
