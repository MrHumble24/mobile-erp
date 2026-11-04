package uz.malika.erp.app

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.ui.theme.Tokens

/**
 * The "More" overflow page: the destinations that did not fit the bottom bar
 * as one Warm Card of icon + label + chevron rows split by hairlines (no
 * border — contrast against the ground is the edge). The shell renders the
 * `nav.more` title; tapping a row navigates via [onSelect] and the More tab
 * stays selected because the active route is in [items].
 */
@Composable
fun MoreScreen(items: List<NavItem>, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    Column(
        modifier.fillMaxSize().verticalScroll(rememberScrollState())
            .padding(start = Tokens.Space.screenH, end = Tokens.Space.screenH, top = Tokens.Space.md, bottom = Tokens.Space.lg),
    ) {
        AppCard(Modifier.fillMaxWidth(), padding = androidx.compose.foundation.layout.PaddingValues(0.dp)) {
            items.forEachIndexed { i, item ->
                MoreRow(item, t, onClick = { onSelect(item.route) })
                if (i < items.lastIndex) HorizontalDivider(color = Tokens.border, modifier = Modifier.padding(start = Tokens.Space.lg))
            }
        }
    }
}

@Composable
private fun MoreRow(item: NavItem, t: Translate, onClick: () -> Unit) {
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
        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.muted, modifier = Modifier.size(20.dp))
    }
}
