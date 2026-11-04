package uz.malika.erp.shared.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import uz.malika.erp.ui.theme.Tokens

private val InputShape = RoundedCornerShape(Tokens.Radius.inputs) // 12
private val FieldHeight = 52.dp

/**
 * The one text input (Warm Card): radius 12, white card container, a 1 dp warm
 * [Tokens.border] unfocused thickening to a 2 dp [Tokens.text] ring on focus
 * (never orange — the scan field is focused all day and must not compete with the
 * pay button), muted placeholder, danger error border. Feature screens use this
 * (or [AppFormField]) — never a raw Material field.
 */
@Composable
fun AppTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    enabled: Boolean = true,
    isError: Boolean = false,
    singleLine: Boolean = true,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    showKeyboardOnFocus: Boolean = true,
    interactionSource: MutableInteractionSource = remember { MutableInteractionSource() },
    leadingIcon: (@Composable () -> Unit)? = null,
    trailingIcon: (@Composable () -> Unit)? = null,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth().then(if (singleLine) Modifier.height(FieldHeight) else Modifier),
        enabled = enabled,
        isError = isError,
        singleLine = singleLine,
        shape = InputShape,
        placeholder = placeholder?.let { { Text(it, maxLines = 1, overflow = TextOverflow.Ellipsis) } },
        interactionSource = interactionSource,
        leadingIcon = leadingIcon,
        trailingIcon = trailingIcon,
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = imeAction,
            showKeyboardOnFocus = showKeyboardOnFocus,
        ),
        keyboardActions = keyboardActions,
        visualTransformation = visualTransformation,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Tokens.text,
            unfocusedBorderColor = Tokens.border,
            errorBorderColor = Tokens.danger,
            cursorColor = Tokens.text,
            focusedContainerColor = Tokens.card,
            unfocusedContainerColor = Tokens.card,
            focusedPlaceholderColor = Tokens.muted,
            unfocusedPlaceholderColor = Tokens.muted,
        ),
    )
}

/** A labelled field: 13/600 muted label above an [AppTextField], inline error. */
@Composable
fun AppFormField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    enabled: Boolean = true,
    error: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Default,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
) {
    Column(modifier) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = Tokens.muted)
        Spacer(Modifier.height(6.dp))
        AppTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = placeholder,
            enabled = enabled,
            isError = error != null,
            keyboardType = keyboardType,
            imeAction = imeAction,
            visualTransformation = visualTransformation,
            keyboardActions = keyboardActions,
        )
        if (error != null) {
            Spacer(Modifier.height(4.dp))
            Text(error, style = MaterialTheme.typography.bodySmall, color = Tokens.danger)
        }
    }
}
