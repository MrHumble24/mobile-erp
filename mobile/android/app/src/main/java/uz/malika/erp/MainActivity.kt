package uz.malika.erp

import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import uz.malika.erp.core.AppEnv
import uz.malika.erp.core.Config
import uz.malika.erp.core.DevHost
import uz.malika.erp.core.LaunchExtras

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Transparent system bars so the warm ground tint runs edge-to-edge under
        // them; bar icon colour follows the theme (dark icons in light mode).
        val dark = resources.configuration.uiMode and
            Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
        val barStyle = if (dark) {
            SystemBarStyle.dark(Color.TRANSPARENT)
        } else {
            SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
        }
        enableEdgeToEdge(statusBarStyle = barStyle, navigationBarStyle = barStyle)
        val container = (application as MalikaApplication).container
        // Debug-only launch extras (adb am start): point Development at a host and,
        // optionally, sign in + open a route. Compiled out of release by DEBUG.
        val launch = if (BuildConfig.DEBUG) LaunchExtras.fromIntent(intent) else null
        launch?.host?.let { host ->
            container.devConfig.setEnv(AppEnv.DEVELOPMENT)
            container.devConfig.setOverride(AppEnv.DEVELOPMENT, DevHost.devUrl(host, Config.DEV_PORT))
        }
        setContent { MalikaApp(container, launch) }
    }
}
