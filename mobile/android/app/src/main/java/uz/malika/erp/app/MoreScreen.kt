package uz.malika.erp.app

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.i18n.Translate
import uz.malika.erp.ui.theme.Tokens

private val CARD_RADIUS = 16.dp

/**
 * The "More" overflow page (One UI pattern): the destinations that did not fit
 * the bottom bar, as a single grouped [Tokens.surfaceCard] card of icon + label
 * + chevron rows split by hairline dividers. The shell already renders the
 * `nav.more` title; tapping a row navigates via [onSelect] and the More tab then
 * stays selected because the active route is in [items].
 */
@Composable
fun MoreScreen(items: List<NavItem>, onSelect: (String) -> Unit, modifier: Modifier = Modifier) {
    val t = LocalT.current
    Column(
        modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Tokens.Space.screenH, vertical = Tokens.Space.section),
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(CARD_RADIUS))
                .background(Tokens.surfaceCard)
                .border(1.dp, Tokens.hairline, RoundedCornerShape(CARD_RADIUS)),
        ) {
            items.forEachIndexed { i, item ->
                MoreRow(item, t, onClick = { onSelect(item.route) })
                if (i < items.lastIndex) HorizontalDivider(color = Tokens.hairline)
            }
        }
    }
}

@Composable
private fun MoreRow(item: NavItem, t: Translate, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(Tokens.Space.cardInner),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(item.icon, contentDescription = null, tint = Tokens.foreground, modifier = Modifier.size(24.dp))
        Spacer(Modifier.width(Tokens.Space.section))
        Text(
            t(item.labelKey, null),
            color = Tokens.foreground,
            style = MaterialTheme.typography.bodyLarge,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        Icon(Icons.Outlined.ChevronRight, contentDescription = null, tint = Tokens.mutedForeground, modifier = Modifier.size(20.dp))
    }
}
