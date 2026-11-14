package com.ilink.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * 앱이 앞에 있어도 기기 알림(배너)을 띄운다 (src/services/localNotify.ts, iOS LocalNotifyModule.swift와 같은 이름 · 메서드).
 * FCM은 앱이 앞에 있으면 알림을 띄우지 않아서, 앱이 세션 이벤트(SES-09)를 보고 직접 띄운다. 채널은 FCM과 같은 'pickup'.
 */
class LocalNotifyModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "ILinkLocalNotify"

  /** 권한은 JS(PermissionsAndroid)가 묻는다. 여기서는 알림을 띄울 수 있는지만 돌려준다 */
  @ReactMethod
  fun requestPermission(promise: Promise) {
    promise.resolve(canPost())
  }

  @ReactMethod
  fun show(id: String, title: String, body: String, promise: Promise) {
    if (!canPost()) {
      Log.w(TAG, "notifications disabled, skip $id")
      promise.resolve(null)
      return
    }
    val n = NotificationCompat.Builder(ctx, MainApplication.PICKUP_CHANNEL)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(title)
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_STATUS)
      .setAutoCancel(true)
      .setContentIntent(ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let {
        android.app.PendingIntent.getActivity(
          ctx, 0, it, android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT,
        )
      })
      .build()
    try {
      NotificationManagerCompat.from(ctx).notify(id.hashCode(), n)
      Log.i(TAG, "show $id $title")
      promise.resolve(null)
    } catch (e: SecurityException) {
      promise.reject("NOTIFY", e.message, e)
    }
  }

  private fun canPost(): Boolean {
    val granted = Build.VERSION.SDK_INT < 33 ||
      ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    return granted && NotificationManagerCompat.from(ctx).areNotificationsEnabled()
  }

  private companion object {
    const val TAG = "iLinkNotify"
  }
}
