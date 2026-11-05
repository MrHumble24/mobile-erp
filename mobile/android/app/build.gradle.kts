import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
}

/**
 * The build machine's LAN IPv4, baked into `BuildConfig.DEV_HOST` so a real
 * device reaches the dev server without anyone typing an IP. Picks the first
 * up, non-loopback, non-virtual, site-local interface, preferring Wi-Fi/Ethernet
 * (en, wlan, wl names). Falls back to the emulator host 10.0.2.2 when none found.
 */
fun detectLanHost(): String = runCatching {
    val ifaces = Collections.list(NetworkInterface.getNetworkInterfaces())
        .filter { it.isUp && !it.isLoopback && !it.isVirtual }
        .sortedBy { i -> if (listOf("en", "wlan", "wl").any { i.name.startsWith(it) }) 0 else 1 }
    ifaces.firstNotNullOfOrNull { iface ->
        Collections.list(iface.inetAddresses)
            .firstOrNull { it is Inet4Address && it.isSiteLocalAddress }
            ?.hostAddress
    }
}.getOrNull() ?: "10.0.2.2"

android {
    namespace = "uz.malika.erp"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "uz.malika.erp"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // The dev server host, auto-detected at build time (see detectLanHost).
        buildConfigField("String", "DEV_HOST", "\"${detectLanHost()}\"")
    }

    // i18n is read straight from the web client — single source, never copied.
    // Packaged as assets: `<locale>/<namespace>.json`.
    sourceSets["main"].assets.srcDir("$rootDir/../../client/src/shared/i18n")

    buildTypes {
        release {
            optimization {
                enable = true
                packageScope = setOf("androidx.**", "kotlin.**", "kotlinx.**")
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.retrofit)
    implementation(libs.retrofit.serialization)
    implementation(libs.okhttp)
    implementation(libs.kotlinx.serialization.json)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.androidx.security.crypto)

    implementation(libs.androidx.camera.core)
    implementation(libs.androidx.camera.camera2)
    implementation(libs.androidx.camera.lifecycle)
    implementation(libs.androidx.camera.view)
    implementation(libs.mlkit.barcode.scanning)
    implementation(libs.mlkit.text.recognition)

    // Product pictures: Coil draws imageUrl against the API base URL with
    // memory + disk cache, so the till grid scrolls and seen pictures show offline.
    implementation(libs.coil.compose)
    implementation(libs.coil.network.okhttp)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.serialization.json)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
