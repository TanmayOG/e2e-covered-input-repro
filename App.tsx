import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const FOOTER_HEIGHT = 112;
const FIELD_HEIGHT = 48;
const GAP = 24;
/** How far below the footer's top edge the Brand input starts. */
const BRAND_UNDER_FOOTER = 16;

export default function App() {
  return (
    <SafeAreaProvider>
      <ProductForm />
    </SafeAreaProvider>
  );
}

/**
 * A product form with a sticky Back/Next footer, the shape from
 * tester-army/e2e#1324.
 *
 * The footer sits on top of the form and rises with the keyboard. In a real
 * app, whether it ends up over the next input depends on the screen and
 * keyboard size, which is why the reported failure is flaky. Here a spacer is
 * sized from the form's measured height so that the Brand input always starts
 * BRAND_UNDER_FOOTER below the footer's top edge, keyboard open or closed, on
 * any screen. Product name sits just above the footer and stays uncovered.
 *
 * The form scrolls: the fields below Brand and the bottom padding leave room
 * to scroll Brand clear of the footer, so one swipe would make it visible.
 */
function ProductForm() {
  const insets = useSafeAreaInsets();
  const formRef = useRef<ScrollView>(null);
  const [formHeight, setFormHeight] = useState(0);
  const [product, setProduct] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [notes, setNotes] = useState('');
  const [focused, setFocused] = useState('none');
  const [footerTaps, setFooterTaps] = useState(0);
  const [footerShown, setFooterShown] = useState(true);

  // The content's `gap` also falls between the spacer and Product name, so
  // Brand starts at spacer + GAP + FIELD_HEIGHT + GAP.
  const footerTop = formHeight - FOOTER_HEIGHT;
  const spacer = Math.max(0, footerTop + BRAND_UNDER_FOOTER - FIELD_HEIGHT - 2 * GAP);

  const focus = (name: string) => ({
    onFocus: () => setFocused(name),
    onBlur: () => setFocused((current) => (current === name ? 'none' : current)),
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.status}>
        <Text style={styles.title}>New product</Text>
        <Text testID="status-focused">Focused: {focused}</Text>
        <Text testID="status-footer-taps">Footer taps: {footerTaps}</Text>
        <Text testID="status-values">
          Product name = "{product}" · Brand = "{brand}"
        </Text>
        <Pressable
          testID="toggle-footer"
          accessibilityRole="button"
          style={styles.toggle}
          onPress={() => setFooterShown((shown) => !shown)}
        >
          <Text style={styles.toggleText}>{footerShown ? 'Hide footer' : 'Show footer'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.flex}>
          <ScrollView
            testID="form"
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            onLayout={(event) => setFormHeight(event.nativeEvent.layout.height)}
            // When the keyboard opens, the form shrinks and Android scrolls it
            // to keep the focused field in view. The spacer then shrinks too,
            // so that scroll would lift Brand out from under the footer. Back
            // to the top whenever the spacer changes keeps Brand pinned.
            onContentSizeChange={() => formRef.current?.scrollTo({ y: 0, animated: false })}
            ref={formRef}
          >
            <View style={{ height: spacer }} />
            <TextInput
              testID="product-name"
              placeholder="Product name"
              style={styles.input}
              placeholderTextColor="#777"
              value={product}
              onChangeText={setProduct}
              {...focus('Product name')}
            />
            <TextInput
              testID="brand"
              placeholder="Brand"
              style={styles.input}
              placeholderTextColor="#777"
              value={brand}
              onChangeText={setBrand}
              {...focus('Brand')}
            />
            <TextInput
              testID="price"
              placeholder="Price"
              style={styles.input}
              placeholderTextColor="#777"
              value={price}
              onChangeText={setPrice}
              {...focus('Price')}
            />
            <TextInput
              testID="sku"
              placeholder="SKU"
              style={styles.input}
              placeholderTextColor="#777"
              value={sku}
              onChangeText={setSku}
              {...focus('SKU')}
            />
            <TextInput
              testID="notes"
              placeholder="Notes"
              style={styles.input}
              placeholderTextColor="#777"
              value={notes}
              onChangeText={setNotes}
              {...focus('Notes')}
            />
          </ScrollView>

          {footerShown && (
            <View testID="footer" style={styles.footer}>
              <Pressable
                testID="footer-back"
                accessibilityRole="button"
                style={styles.footerButton}
                onPress={() => setFooterTaps((taps) => taps + 1)}
              >
                <Text style={styles.footerText}>Back</Text>
              </Pressable>
              <Pressable
                testID="footer-next"
                accessibilityRole="button"
                style={[styles.footerButton, styles.footerNext]}
                onPress={() => setFooterTaps((taps) => taps + 1)}
              >
                <Text style={styles.footerText}>Next</Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  status: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  toggleText: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: FOOTER_HEIGHT + GAP,
    gap: GAP,
  },
  input: {
    height: FIELD_HEIGHT,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FOOTER_HEIGHT,
    flexDirection: 'row',
    backgroundColor: '#222',
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNext: {
    backgroundColor: '#2a5bd7',
  },
  footerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
