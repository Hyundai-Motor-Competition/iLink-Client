#import <React/RCTBridgeModule.h>

// Swift LiveActivityModule을 JS에 ILinkLiveActivity로 내보낸다
@interface RCT_EXTERN_MODULE(ILinkLiveActivity, NSObject)
RCT_EXTERN_METHOD(start:(NSString *)placeName state:(NSDictionary *)state resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(update:(NSDictionary *)state resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(end:(NSDictionary *)state resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
