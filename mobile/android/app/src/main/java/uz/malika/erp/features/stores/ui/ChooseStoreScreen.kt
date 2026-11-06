package uz.malika.erp.features.stores.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.Store
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import uz.malika.erp.features.auth.data.UserStore
import uz.malika.erp.i18n.LocalT
import uz.malika.erp.shared.ui.AppCard
import uz.malika.erp.shared.ui.ButtonVariant
import uz.malika.erp.shared.ui.PillButton
import uz.malika.erp.ui.theme.Tokens

/**
 * Choose a store screen (Item 2).
 * Shown after sign-in when the user works in multiple stores and none is active yet,
 * or when STORE_REQUIRED is encountered.
 */
@Composable
fun ChooseStoreScreen(
    stores: List<UserStore>,
    onChoose: (UserStore) -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val t = LocalT.current

    Box(
        modifier
            .fillMaxSize()
            .background(Tokens.surfaceCard)
            .padding(Tokens.Space.screenH),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            Modifier
                .widthIn(max = 440.dp)
                .fillMaxWidth()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Outlined.Store,
                contentDescription = null,
                tint = Tokens.action,
                modifier = Modifier.size(48.dp),
            )
            Spacer(Modifier.height(Tokens.Space.md))
            Text(
                t("stores.chooseStore", null),
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Tokens.text,
            )
            Spacer(Modifier.height(Tokens.Space.xs))
            Text(
                t("stores.chooseStoreSubtitle", null),
                style = MaterialTheme.typography.bodyMedium,
                color = Tokens.muted,
            )

            Spacer(Modifier.height(Tokens.Space.cardPad))

            if (stores.isEmpty()) {
                Text(
                    t("stores.noStores", null),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Tokens.muted,
                )
            } else {
                AppCard(
                    Modifier.fillMaxWidth(),
                    padding = androidx.compose.foundation.layout.PaddingValues(0.dp),
                ) {
                    stores.forEachIndexed { i, store ->
                        StoreRow(store = store, onClick = { onChoose(store) })
                        if (i < stores.lastIndex) {
                            HorizontalDivider(
                                color = Tokens.border,
                                modifier = Modifier.padding(start = Tokens.Space.lg),
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(Tokens.Space.cardPad))

            PillButton(
                text = t("auth.logout", null),
                onClick = onLogout,
                variant = ButtonVariant.GHOST,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun StoreRow(store: UserStore, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .heightIn(min = 56.dp)
            .padding(horizontal = Tokens.Space.lg, vertical = Tokens.Space.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            Icons.Outlined.Store,
            contentDescription = null,
            tint = Tokens.text,
            modifier = Modifier.size(24.dp),
        )
        Spacer(Modifier.width(Tokens.Space.md))
        Text(
            store.name,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium,
            color = Tokens.text,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f),
        )
        Icon(
            Icons.Outlined.ChevronRight,
            contentDescription = null,
            tint = Tokens.muted,
            modifier = Modifier.size(20.dp),
        )
    }
}
