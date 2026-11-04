package uz.malika.erp.shared.ui

import android.provider.Settings
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

/**
 * The signature capture spring (DESIGN.md Motion & Haptics): when a scanned unit
 * is added to a list, its row springs in from the scan field (translationY from
 * −24 dp, scale from 0.96, 350 ms spring, slight overshoot) while the rest of the
 * list dims to 60% for one beat and returns. Reduce motion replaces the spring
 * with a 150 ms fade and drops the dim. Shared by the POS cart and intake drafts;
 * press feedback is separate (`PressIndication`). No other authored motion.
 */
@Composable
fun rememberReduceMotion(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f,
        ) == 0f
    }
}

/** Tracks which list keys arrived after the first composition, so only a freshly
 *  scanned row animates — never the rows already present when the screen opened. */
class CaptureTracker {
    internal val seen = HashSet<Any>()
    internal var initialized = false
}

@Composable
fun rememberCaptureTracker(): CaptureTracker {
    val tracker = remember { CaptureTracker() }
    LaunchedEffect(Unit) { tracker.initialized = true }
    return tracker
}

@Composable
fun CaptureTracker.isNew(key: Any): Boolean = remember(key) {
    val fresh = key !in seen
    seen.add(key)
    initialized && fresh
}

/**
 * Wraps one list row. [isNew] rows spring in; the others briefly dim when [pulse]
 * (the list size) grows, so the whole list reacts to a capture for one beat.
 */
@Composable
fun CaptureSpringItem(
    isNew: Boolean,
    pulse: Int,
    reduceMotion: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val startTy = with(LocalDensity.current) { (-24).dp.toPx() }
    val useSpring = isNew && !reduceMotion
    val ty = remember { Animatable(if (useSpring) startTy else 0f) }
    val scale = remember { Animatable(if (useSpring) 0.96f else 1f) }
    val alpha = remember { Animatable(if (isNew && reduceMotion) 0f else 1f) }

    LaunchedEffect(Unit) {
        if (!isNew) return@LaunchedEffect
        if (reduceMotion) {
            alpha.animateTo(1f, tween(150))
        } else {
            val spec = spring<Float>(dampingRatio = 0.75f, stiffness = Spring.StiffnessMediumLow)
            launch { ty.animateTo(0f, spec) }
            launch { scale.animateTo(1f, spec) }
        }
    }

    var prevPulse by remember { mutableIntStateOf(pulse) }
    LaunchedEffect(pulse) {
        if (pulse > prevPulse && !isNew && !reduceMotion) {
            alpha.animateTo(0.6f, tween(125))
            alpha.animateTo(1f, tween(125))
        }
        prevPulse = pulse
    }

    Box(
        modifier.graphicsLayer {
            translationY = ty.value
            scaleX = scale.value
            scaleY = scale.value
            this.alpha = alpha.value
        },
    ) { content() }
}
