package uz.malika.erp.shared.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.IndicationNodeFactory
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.ContentDrawScope
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.node.DelegatableNode
import androidx.compose.ui.node.DrawModifierNode
import kotlinx.coroutines.launch

/**
 * The Warm Card press feedback (DESIGN.md Elevation & Depth): on press the node
 * springs down to 0.98 and a soft [overlay] (surface-2) state-layer wash fades in
 * over 120 ms; on release both ease back with no bounce. Replaces the Material
 * ripple everywhere — provided as `LocalIndication` in [MalikaTheme] with
 * `LocalRippleConfiguration` set to null so no ripple remains.
 *
 * The overlay is a translucent wash, not an opaque swap, so card content stays
 * legible while pressed. Built from this one [overlay] colour; the theme passes
 * the current `Tokens.surface2`, so it rebuilds when the scheme flips.
 */
class PressIndication(private val overlay: Color) : IndicationNodeFactory {
    override fun create(interactionSource: InteractionSource): DelegatableNode =
        PressNode(interactionSource, overlay)

    override fun equals(other: Any?): Boolean = other is PressIndication && other.overlay == overlay
    override fun hashCode(): Int = overlay.hashCode()
}

private const val PRESS_SCALE = 0.98f
private const val MAX_TINT = 0.4f
private val easing = CubicBezierEasing(0.2f, 0f, 0f, 1f) // DESIGN.md press curve

private class PressNode(
    private val interactionSource: InteractionSource,
    private val overlay: Color,
) : Modifier.Node(), DrawModifierNode {
    private val scaleAnim = Animatable(1f)
    private val tintAnim = Animatable(0f)
    private val spec get() = tween<Float>(durationMillis = 120, easing = easing)

    override fun onAttach() {
        coroutineScope.launch {
            val presses = mutableListOf<PressInteraction.Press>()
            interactionSource.interactions.collect { interaction ->
                when (interaction) {
                    is PressInteraction.Press -> presses.add(interaction)
                    is PressInteraction.Release -> presses.remove(interaction.press)
                    is PressInteraction.Cancel -> presses.remove(interaction.press)
                }
                val pressed = presses.isNotEmpty()
                launch { scaleAnim.animateTo(if (pressed) PRESS_SCALE else 1f, spec) }
                launch { tintAnim.animateTo(if (pressed) 1f else 0f, spec) }
            }
        }
    }

    override fun ContentDrawScope.draw() {
        val s = scaleAnim.value
        scale(s, s) { this@draw.drawContent() }
        val t = tintAnim.value
        if (t > 0f) drawRect(color = overlay, alpha = t * MAX_TINT)
    }
}
