// Expo config plugin to add an Android NotificationListenerService and RN bridge
const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

console.log('🚀 Notification Listener Plugin: Starting...');

const SERVICE_CLASS = 'NotificationCaptureService';
const MODULE_CLASS = 'NotificationBridge';
const PACKAGE_CLASS = 'NotificationBridgePackage';
const TASK_SERVICE_CLASS = 'NotificationEventTaskService';
const STORE_CLASS = 'NotificationStore';

function getAndroidPackage(config) {
  const pkg = config.android?.package;
  console.log('📦 Android package:', pkg);
  if (!pkg) throw new Error('Android package not defined in app.json under expo.android.package');
  return pkg;
}

function withNotificationListenerAndroidManifest(config, props) {
  console.log('📝 Configuring Android Manifest...');
  return withAndroidManifest(config, (config) => {
    const pkg = getAndroidPackage(config.modRequest.projectRoot ? config : config);
    console.log('📦 Using package:', pkg);
    const manifest = config.modResults;

    // Ensure service exists under application
    const app = manifest.manifest.application?.[0];
    if (!app) throw new Error('AndroidManifest.xml is missing <application>');

    app.service = app.service || [];

    const serviceName = `.${SERVICE_CLASS}`;
    const hasService = app.service.some((s) => s['$']?.['android:name'] === serviceName);
    if (!hasService) {
      console.log('➕ Adding NotificationCaptureService to manifest');
      app.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
        // Optional label shown in system settings
        'meta-data': props?.serviceLabel
          ? [
            {
              $: {
                'android:name': 'android.service.notification.default_title',
                'android:value': props.serviceLabel,
              },
            },
          ]
          : undefined,
      });
    } else {
      console.log('✅ NotificationCaptureService already exists in manifest');
    }

    // Headless JS task service
    const taskServiceName = `.${TASK_SERVICE_CLASS}`;
    const hasTaskService = app.service.some((s) => s['$']?.['android:name'] === taskServiceName);
    if (!hasTaskService) {
      console.log('➕ Adding headless task service to manifest');
      app.service.push({
        $: {
          'android:name': taskServiceName,
          'android:enabled': 'true',
          'android:exported': 'false',
        },
      });
    }

    // Add permissions
    const usesPermissions = manifest.manifest['uses-permission'] || [];
    const wakePerm = 'android.permission.WAKE_LOCK';
    const hasWake = usesPermissions.some((p) => p.$?.['android:name'] === wakePerm);
    if (!hasWake) {
      console.log('➕ Adding WAKE_LOCK permission');
      usesPermissions.push({ $: { 'android:name': wakePerm } });
    }

    const postPerm = 'android.permission.POST_NOTIFICATIONS';
    const hasPost = usesPermissions.some((p) => p.$?.['android:name'] === postPerm);
    if (!hasPost) {
      console.log('➕ Adding POST_NOTIFICATIONS permission');
      usesPermissions.push({ $: { 'android:name': postPerm } });
    }
    manifest.manifest['uses-permission'] = usesPermissions;

    console.log('✅ Android Manifest configured');
    return config;
  });
}

function writeFileOnce(target, content) {
  if (!fs.existsSync(path.dirname(target))) {
    console.log('📁 Creating directory:', path.dirname(target));
    fs.mkdirSync(path.dirname(target), { recursive: true });
  }
  if (!fs.existsSync(target)) {
    console.log('📝 Writing file:', target);
    fs.writeFileSync(target, content);
  } else {
    console.log('✅ File already exists:', target);
  }
}

function javaPackageToPath(pkg) {
  return pkg.replace(/\./g, '/');
}

function withNotificationListenerFiles(config) {
  console.log('📂 Configuring Android Files...');
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      console.log('📁 Project root:', projectRoot);
      const androidSrcMain = path.join(projectRoot, 'android', 'app', 'src', 'main');
      console.log('📁 Android src main:', androidSrcMain);
      const pkg = getAndroidPackage(config);
      const pkgPath = javaPackageToPath(pkg);
      const javaDir = path.join(androidSrcMain, 'java', pkgPath);
      console.log('📁 Java directory:', javaDir);

      // Service class
      const servicePath = path.join(javaDir, `${SERVICE_CLASS}.java`);
      const serviceCode = `package ${pkg};

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.HeadlessJsTaskService;
import org.json.JSONObject;

public class ${SERVICE_CLASS} extends NotificationListenerService {
  private WritableMap toWritableMap(StatusBarNotification sbn) {
    WritableMap map = Arguments.createMap();
    map.putString("packageName", sbn.getPackageName());
    map.putInt("id", sbn.getId());
    map.putDouble("postTime", (double) sbn.getPostTime());
    Notification n = sbn.getNotification();
    Bundle extras = n != null ? n.extras : null;
    if (extras != null) {
      CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
      CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
      if (titleCs != null) map.putString("title", titleCs.toString());
      if (textCs != null) map.putString("text", textCs.toString());
      CharSequence subCs = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
      if (subCs != null) map.putString("subText", subCs.toString());
    }
    return map;
  }

  private Bundle serialize(StatusBarNotification sbn) {
    Bundle bundle = new Bundle();
    bundle.putString("packageName", sbn.getPackageName());
    bundle.putInt("id", sbn.getId());
    bundle.putLong("postTime", sbn.getPostTime());
    Notification n = sbn.getNotification();
    Bundle extras = n != null ? n.extras : null;
    if (extras != null) {
      CharSequence titleCs = extras.getCharSequence(Notification.EXTRA_TITLE);
      CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
      CharSequence subCs = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
      if (titleCs != null) bundle.putString("title", titleCs.toString());
      if (textCs != null) bundle.putString("text", textCs.toString());
      if (subCs != null) bundle.putString("subText", subCs.toString());
    }
    return bundle;
  }

  private void persist(Context ctx, Bundle data) {
    try {
      JSONObject json = new JSONObject();
      if (data.containsKey("packageName")) json.put("packageName", data.getString("packageName"));
      if (data.containsKey("id")) json.put("id", data.getInt("id"));
      if (data.containsKey("postTime")) json.put("postTime", data.getLong("postTime"));
      if (data.containsKey("title")) json.put("title", data.getString("title"));
      if (data.containsKey("text")) json.put("text", data.getString("text"));
      if (data.containsKey("subText")) json.put("subText", data.getString("subText"));
      ${STORE_CLASS}.add(ctx, json);
    } catch (Exception e) {
      Log.e("${SERVICE_CLASS}", "Persist error", e);
    }
  }

  private void startHeadless(Context ctx, Bundle data) {
    try {
      Intent i = new Intent(ctx, ${TASK_SERVICE_CLASS}.class);
      i.putExtras(data);
      HeadlessJsTaskService.acquireWakeLockNow(ctx);
      ctx.startService(i);
    } catch (Exception e) {
      Log.e("${SERVICE_CLASS}", "Headless start error", e);
    }
  }

  @Override
  public void onNotificationPosted(StatusBarNotification sbn) {
    try {
      WritableMap map = toWritableMap(sbn);
      ${MODULE_CLASS}.sendEvent("NotificationPosted", map);
      Bundle b = serialize(sbn);
      b.putString("_event", "NotificationPosted");
      persist(getApplicationContext(), b);
      startHeadless(getApplicationContext(), b);
    } catch (Exception ignored) {}
  }

  @Override
  public void onNotificationRemoved(StatusBarNotification sbn) {
    try {
      WritableMap map = toWritableMap(sbn);
      ${MODULE_CLASS}.sendEvent("NotificationRemoved", map);
      Bundle b = serialize(sbn);
      b.putString("_event", "NotificationRemoved");
      persist(getApplicationContext(), b);
      startHeadless(getApplicationContext(), b);
    } catch (Exception ignored) {}
  }
}
`;
      writeFileOnce(servicePath, serviceCode);

      // Bridge module
      const bridgePath = path.join(javaDir, `${MODULE_CLASS}.java`);
      const bridgeCode = `package ${pkg};

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import org.json.JSONArray;
import org.json.JSONObject;
import androidx.core.app.NotificationManagerCompat;

public class ${MODULE_CLASS} extends ReactContextBaseJavaModule {
  private static ReactApplicationContext sContext;

  public ${MODULE_CLASS}(ReactApplicationContext reactContext) {
    super(reactContext);
    sContext = reactContext;
  }

  @Override
  public String getName() {
    return "${MODULE_CLASS}";
  }

  static void sendEvent(String eventName, WritableMap params) {
    if (sContext == null) return;
    try {
      sContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    } catch (Exception ignored) {}
  }

  @ReactMethod
  public void isEnabled(Promise promise) {
    try {
      Context ctx = getReactApplicationContext();
      String pkg = ctx.getPackageName();
      boolean allowed = false;
      // 1) Prefer NotificationManagerCompat package check
      try {
        java.util.Set<String> pkgs = androidx.core.app.NotificationManagerCompat.getEnabledListenerPackages(ctx);
        allowed = pkgs != null && pkgs.contains(pkg);
      } catch (Throwable ignored) {}
      // 2) Fallback to Settings.Secure enabled_notification_listeners parsing
      if (!allowed) {
        String enabled = Settings.Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
        if (enabled != null && !enabled.isEmpty()) {
          String svc1 = pkg + "/" + pkg + ".NotificationCaptureService"; // fully qualified
          String svc2 = pkg + "/.NotificationCaptureService"; // short class
          String[] parts = enabled.split(":" );
          for (String p : parts) {
            if (p.equals(svc1) || p.equals(svc2) || p.contains(pkg)) {
              // If any entry belongs to our package, treat as enabled
              allowed = true;
              break;
            }
          }
        }
      }
      promise.resolve(allowed);
    } catch (Exception e) {
      promise.reject("ERR_CHECK", e);
    }
  }

  @ReactMethod
  public void openSettings() {
    try {
      Context ctx = getReactApplicationContext();
      Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      ctx.startActivity(intent);
    } catch (Exception ignored) {}
  }

  @ReactMethod
  public void getSdkInt(Promise promise) {
    try {
      promise.resolve(android.os.Build.VERSION.SDK_INT);
    } catch (Exception e) {
      promise.reject("ERR_SDK_INT", e);
    }
  }

  @ReactMethod
  public void getSaved(Promise promise) {
    try {
      Context ctx = getReactApplicationContext();
      JSONArray arr = ${STORE_CLASS}.getAll(ctx);
      WritableArray out = Arguments.createArray();
      for (int i = 0; i < arr.length(); i++) {
        JSONObject o = arr.getJSONObject(i);
        WritableMap map = Arguments.createMap();
        if (o.has("packageName")) map.putString("packageName", o.optString("packageName"));
        if (o.has("id")) map.putInt("id", o.optInt("id"));
        if (o.has("postTime")) map.putDouble("postTime", o.optDouble("postTime"));
        if (o.has("title")) map.putString("title", o.optString("title"));
        if (o.has("text")) map.putString("text", o.optString("text"));
        if (o.has("subText")) map.putString("subText", o.optString("subText"));
        out.pushMap(map);
      }
      promise.resolve(out);
    } catch (Exception e) {
      promise.reject("ERR_GET_SAVED", e);
    }
  }

  @ReactMethod
  public void clearSaved(Promise promise) {
    try {
      Context ctx = getReactApplicationContext();
      ${STORE_CLASS}.clear(ctx);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("ERR_CLEAR_SAVED", e);
    }
  }
}
`;
      writeFileOnce(bridgePath, bridgeCode);

      // ReactPackage to register the module
      const pkgPathFile = path.join(javaDir, `${PACKAGE_CLASS}.java`);
      const pkgCode = `package ${pkg};

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ${PACKAGE_CLASS} implements ReactPackage {
  @Override
  @NonNull
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new ${MODULE_CLASS}(reactContext));
    return modules;
  }

  @Override
  @NonNull
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
`;
      writeFileOnce(pkgPathFile, pkgCode);

      // Headless JS Task Service
      const taskServicePath = path.join(javaDir, `${TASK_SERVICE_CLASS}.java`);
      const taskServiceCode = `package ${pkg};

import android.content.Intent;
import android.os.Bundle;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

public class ${TASK_SERVICE_CLASS} extends HeadlessJsTaskService {
  private WritableMap bundleToWritable(Bundle b) {
    WritableMap map = Arguments.createMap();
    if (b == null) return map;
    for (String key : b.keySet()) {
      Object val = b.get(key);
      if (val instanceof String) map.putString(key, (String) val);
      else if (val instanceof Integer) map.putInt(key, (Integer) val);
      else if (val instanceof Long) map.putDouble(key, ((Long) val).doubleValue());
      else if (val instanceof Double) map.putDouble(key, (Double) val);
      else if (val instanceof Float) map.putDouble(key, ((Float) val).doubleValue());
      else if (val instanceof Boolean) map.putBoolean(key, (Boolean) val);
      else if (val != null) map.putString(key, String.valueOf(val));
    }
    return map;
  }

  @Override
  protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent != null ? intent.getExtras() : null;
    WritableMap data = bundleToWritable(extras);
    return new HeadlessJsTaskConfig(
      "NotificationEvent",
      data,
      10000,
      true
    );
  }
}
`;
      writeFileOnce(taskServicePath, taskServiceCode);

      // Simple persistent store using SharedPreferences
      const storePath = path.join(javaDir, `${STORE_CLASS}.java`);
      const storeCode = `package ${pkg};

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

public class ${STORE_CLASS} {
  private static final String PREF = "notification_store";
  private static final String KEY = "items";
  private static final int MAX = 200; // keep last 200

  public static synchronized void add(Context ctx, JSONObject obj) {
    try {
      SharedPreferences sp = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
      String raw = sp.getString(KEY, "[]");
      JSONArray arr = new JSONArray(raw);
      arr.put(obj);
      // trim to MAX by removing from start
      if (arr.length() > MAX) {
        JSONArray trimmed = new JSONArray();
        for (int i = Math.max(0, arr.length() - MAX); i < arr.length(); i++) {
          trimmed.put(arr.get(i));
        }
        arr = trimmed;
      }
      sp.edit().putString(KEY, arr.toString()).apply();
    } catch (Exception ignored) {}
  }

  public static synchronized JSONArray getAll(Context ctx) {
    try {
      SharedPreferences sp = ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE);
      String raw = sp.getString(KEY, "[]");
      return new JSONArray(raw);
    } catch (Exception e) {
      return new JSONArray();
    }
  }

  public static synchronized void clear(Context ctx) {
    ctx.getSharedPreferences(PREF, Context.MODE_PRIVATE).edit().remove(KEY).apply();
  }
}
`;
      writeFileOnce(storePath, storeCode);

      // Ensure @color/iconBackground exists to fix AAPT error when adaptive icon references it
      const colorsPath = path.join(androidSrcMain, 'res', 'values', 'colors.xml');
      const adaptiveBg = (config.android && config.android.adaptiveIcon && config.android.adaptiveIcon.backgroundColor) || '#FFFFFF';
      try {
        if (!fs.existsSync(path.dirname(colorsPath))) {
          fs.mkdirSync(path.dirname(colorsPath), { recursive: true });
        }
        if (!fs.existsSync(colorsPath)) {
          const xml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="iconBackground">${adaptiveBg}</color>\n</resources>\n`;
          fs.writeFileSync(colorsPath, xml);
        } else {
          let xml = fs.readFileSync(colorsPath, 'utf8');
          if (!xml.includes('name="iconBackground"')) {
            xml = xml.replace('</resources>', `  <color name="iconBackground">${adaptiveBg}</color>\n</resources>`);
            fs.writeFileSync(colorsPath, xml);
          }
        }
      } catch (e) {
        // best-effort; do not crash plugin
      }

      console.log('✅ Android Files configured');
      return config;
    },
  ]);
}


function withNotificationListenerMainApplication(config) {
  console.log('🔧 Configuring MainApplication...');
  return withMainApplication(config, (mod) => {
    const pkg = getAndroidPackage(config);
    const importLine = `import ${pkg}.${PACKAGE_CLASS};`;
    let src = mod.modResults.contents;

    console.log('📝 Original MainApplication length:', src.length);
    console.log('📝 MainApplication language:', mod.modResults.language);

    // Detectar si es Kotlin o Java
    const isKotlin = mod.modResults.language === 'kt' || src.includes('class MainApplication') || src.includes('override');

    if (isKotlin) {
      console.log('🔧 Detected Kotlin MainApplication');

      // Para Kotlin, no necesitamos agregar import ya que no hay statement de import explícito
      // Solo necesitamos modificar la función getPackages
      if (src.includes('val packages = PackageList(this).packages')) {
        console.log('➕ Adding package registration (Kotlin - immutable list)');
        src = src.replace(
          /(val packages = PackageList\(this\)\.packages)/,
          `$1.toMutableList()\n            packages.add(${PACKAGE_CLASS}())`
        );
      } else if (src.includes('PackageList(this).packages')) {
        console.log('➕ Adding package registration (Kotlin - alternative)');
        src = src.replace(
          /(return PackageList\(this\)\.packages)/,
          `val packages = PackageList(this).packages.toMutableList()\n            packages.add(${PACKAGE_CLASS}())\n            return packages`
        );
      }
    } else {
      console.log('🔧 Detected Java MainApplication');

      if (!src.includes(importLine)) {
        // Insert import after package line
        console.log('➕ Adding import to MainApplication');
        src = src.replace(/(package [^;]+;\n)/, `$1\n${importLine}\n`);
      } else {
        console.log('✅ Import already exists in MainApplication');
      }

      // Add package registration
      if (src.includes('new PackageList(this).getPackages()')) {
        // Old arch path
        console.log('➕ Adding package registration (Java - old arch)');
        src = src.replace(
          /(List<ReactPackage>\s+packages\s*=\s*new PackageList\(this\)\.getPackages\(\);)/,
          `$1\n    packages.add(new ${PACKAGE_CLASS}());`
        );
      } else if (src.includes('getPackages()')) {
        // Fallback: try to add inside getPackages method before return
        console.log('➕ Adding package registration (Java - fallback)');
        src = src.replace(
          /(List<ReactPackage>\s+packages\s*=\s*[^;]+;[\s\S]*?)(return packages;)/,
          `$1\n    packages.add(new ${PACKAGE_CLASS}());\n    $2`
        );
      }
    }

    console.log('📝 Modified MainApplication length:', src.length);
    mod.modResults.contents = src;
    console.log('✅ MainApplication configured');
    return mod;
  });
}

const withNotificationListener = (config, props = {}) => {
  console.log('🔧 Configuring NotificationListener plugin with props:', props);
  config = withNotificationListenerAndroidManifest(config, props);
  config = withNotificationListenerFiles(config, props);
  config = withNotificationListenerMainApplication(config, props);
  console.log('✅ NotificationListener plugin configured successfully');
  return config;
};

module.exports = withNotificationListener;