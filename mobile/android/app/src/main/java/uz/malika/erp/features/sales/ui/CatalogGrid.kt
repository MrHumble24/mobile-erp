package uz.malika.erp.features.sales.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import uz.malika.erp.features.sales.data.CatalogCard
import uz.malika.erp.features.sales.lib.Pricing
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.lib.formatMoney
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ProductImage
import uz.malika.erp.ui.theme.MonoFamily
import uz.malika.erp.ui.theme.Tokens

/**
 * The till Catalog grid (ADR 0031): two columns of tappable product cards —
 * picture, name, in-stock count and price. Render + dispatch only; the tap rules
 * live in `lib/CardTap.kt`, the picture in `shared/ui/ProductImage`.
 */
@Composable
fun CatalogGrid(
    cards: List<CatalogCard>,
    baseUrl: String,
    level: String,
    onTap: (CatalogCard) -> Unit,
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(Tokens.Space.screenH),
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        verticalArrangement = Arrangement.spacedBy(Tokens.Space.md),
        contentPadding = contentPadding,
    ) {
        items(cards, key = { it.modelId }) { card -> CatalogCardItem(card, baseUrl, level, onTap) }
    }
}

@Composable
private fun CatalogCardItem(card: CatalogCard, baseUrl: String, level: String, onTap: (CatalogCard) -> Unit) {
    val t = LocalT.current
    AppCard(
        onClick = { onTap(card) },
        padding = PaddingValues(Tokens.Space.md),
    ) {
        ProductImage(
            imageUrl = card.imageUrl,
            baseUrl = baseUrl,
            contentDescription = card.label,
            modifier = Modifier.fillMaxWidth().aspectRatio(1f),
        )
        Spacer(Modifier.height(Tokens.Space.sm))
        Text(
            card.label,
            style = MaterialTheme.typography.titleSmall,
            color = Tokens.text,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(Modifier.height(Tokens.Space.xs))
        Text(
            t("catalog.inStockCount", mapOf("count" to card.inStock)),
            style = MaterialTheme.typography.bodySmall,
            color = Tokens.muted,
        )
        Spacer(Modifier.height(Tokens.Space.xs))
        Text(
            priceLabel(card, level),
            style = MaterialTheme.typography.titleSmall.copy(fontFamily = MonoFamily),
            color = Tokens.text,
        )
    }
}

/** The card's price line at the current level (ADR 0034), falling back to the per-piece/range price. */
private fun priceLabel(card: CatalogCard, level: String): String {
    Pricing.levelPrice(card.prices, level)?.let { return formatMoney(it.toPlainString()) }
    if (card.isQuantity) return card.salePrice?.let { formatMoney(it) } ?: "—"
    val min = card.minTargetPrice
    val max = card.maxTargetPrice
    return when {
        min == null -> "—"
        max != null && max != min -> "${formatMoney(min)} – ${formatMoney(max)}"
        else -> formatMoney(min)
    }
}
