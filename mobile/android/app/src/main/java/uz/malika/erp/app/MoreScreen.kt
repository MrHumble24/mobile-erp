package uz.malika.erp.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Store
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.auth.data.UserStore
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.ui.AppBottomSheet
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The "More" overflow page:
 * - Active store name at the top (Item 4). Users with >1 store can switch it here;
 *   users with 1 store see the name with no control.
 * - Overflow navigation destinations as a grouped Warm Card.
 */
@Composable
fun MoreScreen(
    items: List<NavItem>,
    activeStoreName: String,
    stores: List<UserStore>,
    onSwitchStore: (String) -> Unit,
    onSelect: (String) -> Unit,
    onRefreshMore: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current
    var showSwitchSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        onRefreshMore?.invoke()
    }

    Column(
        modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, top = Tokens.Space.md, bottom = Tokens.Space.lg),
    ) {
        // Active Store Banner at the top of the More tab
        AppCard(
            modifier = Modifier.fillMaxWidth(),
            padding = androidx.compose.foundation.layout.PaddingValues(0.dp),
        ) {
            val canSwitch = stores.size > 1
            Row(
                Modifier
                    .fillMaxWidth()
                    .then(if (canSwitch) Modifier.clickable { showSwitchSheet = true } else Modifier)
                    .heightIn(min = 56.dp)
                    .padding(horizontal = Tokens.Space.lg, vertical = Tokens.Space.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    Icons.Outlined.Store,
                    contentDescription = null,
                    tint = Tokens.action,
                    modifier = Modifier.size(24.dp),
                )
                Spacer(Modifier.width(Tokens.Space.md))
                Column(Modifier.weight(1f)) {
                    Text(
                        t("stores.activeStore", null),
                        style = MaterialTheme.typography.labelSmall,
                        color = Tokens.muted,
                    )
                    Text(
                        activeStoreName.ifBlank { "..." },
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = Tokens.text,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                if (canSwitch) {
                    Text(
                        t("stores.switchStore", null),
                        style = MaterialTheme.typography.labelMedium,
                        color = Tokens.action,
                        fontWeight = FontWeight.Medium,
                    )
                    Spacer(Modifier.width(Tokens.Space.xs))
                    Icon(
                        Icons.Outlined.ChevronRight,
                        contentDescription = null,
                        tint = Tokens.action,
                        modifier = Modifier.size(20.dp),
                    )
                }
            }
        }

        Spacer(Modifier.height(Tokens.Space.md))

        // Navigation overflow rows
        AppCard(Modifier.fillMaxWidth(), padding = androidx.compose.foundation.layout.PaddingValues(0.dp)) {
            items.forEachIndexed { i, item ->
                MoreRow(item, t, onClick = { onSelect(item.route) })
                if (i < items.lastIndex) HorizontalDivider(color = Tokens.border, modifier = Modifier.padding(start = Tokens.Space.lg))
            }
        }
    }

    if (showSwitchSheet) {
        AppBottomSheet(onDismiss = { showSwitchSheet = false }) {
            Column(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Tokens.Space.lg, vertical = Tokens.Space.md),
            ) {
                Text(
                    t("stores.switchStore", null),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Tokens.text,
                    modifier = Modifier.padding(bottom = Tokens.Space.md),
                )
                stores.forEachIndexed { i, store ->
                    val isCurrent = store.name == activeStoreName
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clickable {
                                showSwitchSheet = false
                                if (!isCurrent) onSwitchStore(store.id)
                            }
                            .heightIn(min = 52.dp)
                            .padding(vertical = Tokens.Space.sm),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            Icons.Outlined.Store,
                            contentDescription = null,
                            tint = if (isCurrent) Tokens.action else Tokens.text,
                            modifier = Modifier.size(22.dp),
                        )
                        Spacer(Modifier.width(Tokens.Space.md))
                        Text(
                            store.name,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = if (isCurrent) FontWeight.SemiBold else FontWeight.Normal,
                            color = Tokens.text,
                            modifier = Modifier.weight(1f),
                        )
                        if (isCurrent) {
                            Icon(
                                Icons.Outlined.Check,
                                contentDescription = null,
                                tint = Tokens.success,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }
                    if (i < stores.lastIndex) {
                        HorizontalDivider(color = Tokens.border)
                    }
                }
            }
        }
    }
}

@Composable
private fun MoreRow(item: NavItem, t: Translate, onClick: () -> Unit) {
    val badgeCount = item.badge?.collectAsState()?.value
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).heightIn(min = 52.dp)
            .padding(horizontal = Tokens.Space.lg, vertical = Tokens.Space.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(item.icon, contentDescription = null, tint = Tokens.text, modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(Tokens.Space.md))
        Text(
            t(item.labelKey, null),
            color = Tokens.text,
            style = MaterialTheme.typography.bodyMedium,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        if (badgeCount != null && badgeCount > 0) {
            Box(
                modifier = Modifier
                    .padding(end = Tokens.Space.sm)
                    .clip(RoundedCornerShape(Tokens.Radius.pill))
                    .background(Tokens.action)
                    .padding(horizontal = 7.dp, vertical = 2.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = badgeCount.toString(),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontFamily = MonoFamily,
                        fontWeight = FontWeight.Bold,
                    ),
                    color = Color.White,
                )
            }
        }
        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.muted, modifier = Modifier.size(20.dp))
    }
}
