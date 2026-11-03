package uz.malika.erp.features.devconsole

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Login
import androidx.compose.material.icons.automirrored.outlined.Subject
import androidx.compose.material.icons.outlined.Dns
import androidx.compose.material.icons.outlined.SwapHoriz
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import uz.malika.erp.AppContainer
import uz.malika.erp.features.devconsole.ui.EnvironmentSection
import uz.malika.erp.features.devconsole.ui.LogsSection
import uz.malika.erp.features.devconsole.ui.NetworkSection
import uz.malika.erp.features.devconsole.ui.QuickLoginSection

/**
 * One tab in the Developer Console. Its [content] renders the section body.
 * Adding a future developer setting = one new file + one entry in [all].
 */
data class DevConsoleSection(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val content: @Composable (AppContainer) -> Unit,
)

/** The single source of truth for the console's sections, in display order. */
object DevConsoleSections {
    val all: List<DevConsoleSection> = listOf(
        DevConsoleSection("quicklogin", "Quick Login", Icons.AutoMirrored.Outlined.Login) { QuickLoginSection(it) },
        DevConsoleSection("environment", "Environment", Icons.Outlined.Dns) { EnvironmentSection(it) },
        DevConsoleSection("network", "Network", Icons.Outlined.SwapHoriz) { NetworkSection(it) },
        DevConsoleSection("logs", "Logs", Icons.AutoMirrored.Outlined.Subject) { LogsSection() },
    )
}
