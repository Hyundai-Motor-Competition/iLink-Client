package com.ilink.mobile

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createPickupChannel()
  }

  /** 픽업 알림 채널 (중요도 높음: 화면 위에 배너로 뜬다). FCM 기본 채널로 AndroidManifest에 지정 */
  private fun createPickupChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(NotificationManager::class.java)
    nm.createNotificationChannel(
      NotificationChannel(PICKUP_CHANNEL, "픽업 알림", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "출발 · 도착 · 탑승 등 픽업 진행 알림"
      },
    )
  }

  companion object {
    const val PICKUP_CHANNEL = "pickup"
  }
}
