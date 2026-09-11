#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Registers third-party Fabric components; without it they fall back to the
  // legacy view manager path and crash on missing prop setters.
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
// RCTAppDelegate does not implement these two delegate methods, so guard the
// super calls to avoid an unrecognized-selector crash.
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  BOOL handledBySuper = [[self superclass] instancesRespondToSelector:_cmd] &&
                        [super application:application openURL:url options:options];
  return handledBySuper || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  BOOL handledBySuper = [[self superclass] instancesRespondToSelector:_cmd] &&
                        [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return handledBySuper || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  if ([[self superclass] instancesRespondToSelector:_cmd]) {
    [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
  }
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  if ([[self superclass] instancesRespondToSelector:_cmd]) {
    [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
  }
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  if ([[self superclass] instancesRespondToSelector:_cmd]) {
    [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
  } else {
    completionHandler(UIBackgroundFetchResultNoData);
  }
}

@end
