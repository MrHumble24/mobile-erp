import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// Scan input that works with a hardware HID scanner (keyboard-wedge: it types
/// the code and sends Enter) AND a phone camera. The field stays focused so a
/// wedge scan lands here; [onScan] fires on submit or on a camera detection.
///
/// The field is visible so cashiers can also type/paste an IMEI.
class ScannerField extends StatefulWidget {
  const ScannerField({
    required this.onScan,
    this.hintText,
    this.autofocus = true,
    this.enableCamera = true,
    super.key,
  });

  final ValueChanged<String> onScan;
  final String? hintText;
  final bool autofocus;
  final bool enableCamera;

  @override
  State<ScannerField> createState() => _ScannerFieldState();
}

class _ScannerFieldState extends State<ScannerField> {
  final _controller = TextEditingController();
  final _focus = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _submit(String raw) {
    final code = raw.trim();
    _controller.clear();
    if (widget.autofocus) _focus.requestFocus();
    if (code.isNotEmpty) widget.onScan(code);
  }

  Future<void> _openCamera() async {
    final code = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _CameraScanSheet(),
    );
    if (code != null) _submit(code);
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      focusNode: _focus,
      autofocus: widget.autofocus,
      textInputAction: TextInputAction.done,
      onSubmitted: _submit,
      inputFormatters: [FilteringTextInputFormatter.singleLineFormatter],
      decoration: InputDecoration(
        hintText: widget.hintText,
        prefixIcon: const Icon(Icons.qr_code_scanner),
        suffixIcon: widget.enableCamera
            ? IconButton(
                icon: const Icon(Icons.photo_camera_outlined),
                onPressed: _openCamera,
              )
            : null,
      ),
    );
  }
}

class _CameraScanSheet extends StatelessWidget {
  const _CameraScanSheet();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.6,
      child: MobileScanner(
        onDetect: (capture) {
          final value = capture.barcodes
              .map((b) => b.rawValue)
              .firstWhere((v) => v != null && v.isNotEmpty, orElse: () => null);
          if (value != null) Navigator.of(context).pop(value);
        },
      ),
    );
  }
}
