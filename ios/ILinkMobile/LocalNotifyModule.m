#import <React/RCTBridgeModule.h>

// Swift LocalNotifyModule을 JS에 ILinkLocalNotify로 내보낸다
@interface RCT_EXTERN_MODULE(ILinkLocalNotify, NSObject)
RCT_EXTERN_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(show:(NSString *)id title:(NSString *)title body:(NSString *)body resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
