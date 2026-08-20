import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { resolveAssetUrl } from "@/lib/assets";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import { calculatePaymentAmounts } from "@/shared/payment";

type PendingPayment = { id: number; subtotal: number; customerFee: number; customerTotal: number };

const shellText = StyleSheet.create({
  title: { color: "#F7F9FF" },
  body: { color: "#C5D5FF" },
  label: { color: "#E2EAFF" },
});

export default function OrderCheckoutScreen() {
  const params = useLocalSearchParams<{ productId?: string }>();
  const { allProducts } = useApp();
  const { isAuthenticated, startLogin } = useAuth();
  const product = allProducts.find((item) => item.id === params.productId);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createOrder = trpc.orders.create.useMutation();
  const confirmTestPayment = trpc.orders.confirmTestPayment.useMutation();
  const numericProductId = useMemo(() => (product && /^\d+$/.test(product.id) ? Number(product.id) : null), [product]);
  const preview = calculatePaymentAmounts(product ? Math.round(product.price * quantity * 100) : 0);

  const createPayment = async () => {
    setErrorMessage(null);
    if (!product || !numericProductId) return setErrorMessage("ეს პროდუქტი ჯერ გადახდისთვის ხელმისაწვდომი არ არის.");
    if (!isAuthenticated) {
      const authenticated = await startLogin().catch(() => false);
      if (!authenticated) setErrorMessage("შეკვეთის გასაგრძელებლად საჭიროა რეგისტრაცია ან შესვლა.");
      return;
    }
    if (customerName.trim().length < 2 || customerPhone.trim().length < 5 || deliveryAddress.trim().length < 8) {
      setErrorMessage("მიუთითე სახელი, ტელეფონი და სრული მიწოდების მისამართი.");
      haptic.error();
      return;
    }
    try {
      const result = await createOrder.mutateAsync({ productId: numericProductId, quantity, customerName: customerName.trim(), customerPhone: customerPhone.trim(), deliveryAddress: deliveryAddress.trim(), note: note.trim() || undefined });
      setPendingPayment({ id: result.orderId, subtotal: result.grossAmountInTetri, customerFee: result.customerPaymentFeeInTetri, customerTotal: result.customerTotalInTetri });
      haptic.light();
    } catch (error) {
      haptic.error();
      setErrorMessage(error instanceof Error ? error.message : "შეკვეთის შექმნა ამჯერად ვერ დასრულდა. სცადე ხელახლა.");
    }
  };

  const confirmPayment = async () => {
    if (!pendingPayment) return;
    setErrorMessage(null);
    try {
      await confirmTestPayment.mutateAsync({ id: pendingPayment.id });
      haptic.success();
      setPaymentConfirmed(true);
    } catch (error) {
      haptic.error();
      setErrorMessage(error instanceof Error ? error.message : "გადახდის დადასტურება ამჯერად ვერ დასრულდა. სცადე ხელახლა.");
    }
  };

  if (!product) return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.center}><MaterialIcons name="inventory-2" size={42} color="#C8BCC2" /><Text style={[styles.centerTitle, shellText.title]}>პროდუქტი ვერ მოიძებნა</Text><PrimaryButton label="უკან დაბრუნება" variant="secondary" onPress={() => router.back()} /></View></ScreenContainer>;
  if (paymentConfirmed && pendingPayment) return <PaymentSuccess productName={product.name} payment={pendingPayment} />;
  if (pendingPayment) return <PaymentConfirmation productName={product.name} payment={pendingPayment} errorMessage={errorMessage} loading={confirmTestPayment.isPending} onConfirm={() => void confirmPayment()} onBack={() => { setErrorMessage(null); setPendingPayment(null); }} />;

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Header title="შეკვეთის შექმნა" onBack={() => router.back()} /><Text style={[styles.helper, shellText.body]}>გადახდის შემდეგ ბიზნესი აპშივე მიიღებს შეკვეთას და მიწოდების დეტალებს.</Text>{errorMessage ? <ErrorBanner message={errorMessage} /> : null}<View style={styles.productCard}><Image source={resolveAssetUrl(product.imageUrl)} contentFit="cover" style={styles.productImage} /><View style={styles.productCopy}><Text style={styles.business}>{product.businessName}</Text><Text style={styles.productName}>{product.name}</Text><Text style={styles.unitPrice}>{product.price} ₾</Text></View></View><View style={styles.section}><Text style={[styles.sectionTitle, shellText.title]}>რაოდენობა</Text><View style={styles.quantityRow}><Pressable onPress={() => setQuantity((value) => Math.max(1, value - 1))} style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}><MaterialIcons name="remove" size={21} color="#7057D9" /></Pressable><Text style={styles.quantity}>{quantity}</Text><Pressable onPress={() => setQuantity((value) => Math.min(20, value + 1))} style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}><MaterialIcons name="add" size={21} color="#7057D9" /></Pressable><Text style={styles.total}>{(preview.grossAmountInTetri / 100).toFixed(2)} ₾</Text></View></View><PaymentSummary subtotal={preview.grossAmountInTetri} fee={preview.customerPaymentFeeInTetri} total={preview.customerTotalInTetri} /><View style={styles.section}><Text style={[styles.sectionTitle, shellText.title]}>მიწოდების ინფორმაცია</Text><Input label="სახელი და გვარი *" value={customerName} onChangeText={setCustomerName} placeholder="მაგ. ნინო ბერიძე" /><Input label="ტელეფონი *" value={customerPhone} onChangeText={setCustomerPhone} placeholder="+995 5XX XX XX XX" keyboardType="phone-pad" /><Input label="მიწოდების მისამართი *" value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="ქალაქი, ქუჩა, კორპუსი, ბინა" multiline /><Input label="შენიშვნა" value={note} onChangeText={setNote} placeholder="სასურველი დრო ან სხვა დეტალი" multiline /></View></ScrollView><View style={styles.footer}><PrimaryButton label={isAuthenticated ? "გადახდაზე გაგრძელება" : "შესვლა და გაგრძელება"} icon={isAuthenticated ? "credit-card" : "login"} loading={createOrder.isPending} onPress={() => void createPayment()} /><Text style={styles.footerText}>შეკვეთა ბიზნესს მხოლოდ წარმატებული გადახდის შემდეგ გადაეგზავნება.</Text></View></KeyboardAvoidingView></ScreenContainer>;
}

function PaymentSummary({ subtotal, fee, total }: { subtotal: number; fee: number; total: number }) { return <View style={styles.paymentSummary}><Text style={styles.sectionTitle}>გადახდის შეჯამება</Text><SummaryRow label="პროდუქტები" value={subtotal} /><SummaryRow label="გადახდის მომსახურება" hint="3% ერთჯერადი საკომისიო" value={fee} /><View style={styles.divider} /><SummaryRow label="საბოლოო გადასახდელი" value={total} strong /></View>; }
function SummaryRow({ label, hint, value, strong = false }: { label: string; hint?: string; value: number; strong?: boolean }) { return <View style={styles.summaryRow}><View><Text style={strong ? styles.summaryStrong : styles.summaryLabel}>{label}</Text>{hint ? <Text style={styles.summaryHint}>{hint}</Text> : null}</View><Text style={strong ? styles.summaryTotal : styles.summaryValue}>{(value / 100).toFixed(2)} ₾</Text></View>; }
function PaymentConfirmation({ productName, payment, errorMessage, loading, onConfirm, onBack }: { productName: string; payment: PendingPayment; errorMessage: string | null; loading: boolean; onConfirm: () => void; onBack: () => void }) { return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.confirmScreen}><Header title="გადახდის დადასტურება" onBack={onBack} /><View style={styles.confirmCopy}><View style={styles.confirmIcon}><MaterialIcons name="credit-card" size={43} color="#E94F6D" /></View><Text style={[styles.confirmTitle, shellText.title]}>შეამოწმე შეკვეთა</Text><Text style={[styles.confirmText, shellText.body]}>„{productName}“ მზადაა გადახდისთვის.</Text></View>{errorMessage ? <ErrorBanner message={errorMessage} /> : null}<View style={styles.finalPriceCard}><Text style={styles.finalPriceLabel}>საბოლოო გადასახდელი თანხა</Text><Text style={styles.finalPriceValue}>{(payment.customerTotal / 100).toFixed(2)} ₾</Text><Text style={styles.finalPriceHint}>მათ შორის {(payment.customerFee / 100).toFixed(2)} ₾ გადახდის მომსახურება (3%)</Text></View><View style={styles.confirmFooter}><PrimaryButton label="გადახდის დადასტურება" icon="check-circle" loading={loading} onPress={onConfirm} /></View></View></ScreenContainer>; }
function PaymentSuccess({ productName, payment }: { productName: string; payment: PendingPayment }) { const reveal = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.timing(reveal, { toValue: 1, duration: 280, useNativeDriver: true }).start(); }, [reveal]); return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.successScreen}><Animated.View style={[styles.successIcon, { opacity: reveal, transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1] }) }] }]}><MaterialIcons name="check" size={48} color="#FFFFFF" /></Animated.View><Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}><Text style={[styles.successTitle, shellText.title]}>გადახდა დადასტურდა</Text></Animated.View><Text style={[styles.successText, shellText.body]}>შეკვეთა #{payment.id} გადაეგზავნა ბიზნესს. „{productName}“-ს შესრულების დეტალებს ბიზნესი პირდაპირ აპში დაამუშავებს.</Text><View style={styles.totalCard}><Text style={styles.totalLabel}>გადახდილი თანხა</Text><Text style={styles.totalValue}>{(payment.customerTotal / 100).toFixed(2)} ₾</Text><Text style={styles.totalHint}>მომსახურების საკომისიო: {(payment.customerFee / 100).toFixed(2)} ₾</Text></View><PrimaryButton label="მთავარ ეკრანზე დაბრუნება" icon="home" onPress={() => router.replace("/(tabs)" as never)} /></View></ScreenContainer>; }
function ErrorBanner({ message }: { message: string }) { return <View style={styles.errorBanner}><View style={styles.errorIcon}><MaterialIcons name="error-outline" size={21} color="#C93B58" /></View><View style={styles.errorCopy}><Text style={styles.errorTitle}>მოქმედება ვერ დასრულდა</Text><Text style={styles.errorText}>{message}</Text></View></View>; }
function Header({ title, onBack }: { title: string; onBack: () => void }) { return <View style={styles.header}><Pressable onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back-ios-new" size={20} color="#251F24" /></Pressable><Text style={[styles.headerTitle, shellText.title]}>{title}</Text><View style={styles.headerSpacer} /></View>; }
function Input({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) { return <View style={styles.inputGroup}><Text style={[styles.inputLabel, shellText.label]}>{label}</Text><TextInput {...props} placeholderTextColor="#8796B9" style={[styles.input, props.multiline && styles.textarea]} textAlignVertical={props.multiline ? "top" : "center"} /></View>; }

const styles = StyleSheet.create({ flex: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 120, gap: 19 }, header: { height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA", alignItems: "center", justifyContent: "center" }, headerTitle: { color: "#251F24", fontSize: 17, lineHeight: 22, fontWeight: "800" }, headerSpacer: { width: 42 }, helper: { color: "#756B70", fontSize: 13, lineHeight: 19 }, errorBanner: { flexDirection: "row", gap: 10, padding: 13, borderRadius: 17, backgroundColor: "#FBE2E8", borderWidth: 1, borderColor: "#F0BAC7" }, errorIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, errorCopy: { flex: 1, gap: 2 }, errorTitle: { color: "#9A2F49", fontSize: 13, lineHeight: 18, fontWeight: "900" }, errorText: { color: "#9C6673", fontSize: 12, lineHeight: 17 }, productCard: { flexDirection: "row", gap: 13, backgroundColor: "#FFFFFF", borderRadius: 21, padding: 12, borderWidth: 1, borderColor: "#EADFDA" }, productImage: { width: 76, height: 76, borderRadius: 15, backgroundColor: "#F7EAE5" }, productCopy: { flex: 1, gap: 3, justifyContent: "center" }, business: { color: "#7057D9", fontSize: 11, lineHeight: 15, fontWeight: "800", textTransform: "uppercase" }, productName: { color: "#251F24", fontSize: 15, lineHeight: 20, fontWeight: "800" }, unitPrice: { color: "#E94F6D", fontSize: 16, lineHeight: 21, fontWeight: "900" }, section: { gap: 12 }, sectionTitle: { color: "#251F24", fontSize: 19, lineHeight: 25, fontWeight: "900" }, quantityRow: { height: 58, flexDirection: "row", alignItems: "center", gap: 15, backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: "#EADFDA" }, quantityButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#EEE8FF", alignItems: "center", justifyContent: "center" }, quantity: { minWidth: 22, textAlign: "center", color: "#251F24", fontSize: 18, lineHeight: 24, fontWeight: "800" }, total: { marginLeft: "auto", color: "#E94F6D", fontSize: 19, lineHeight: 25, fontWeight: "900" }, paymentSummary: { gap: 10, padding: 15, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EADFDA" }, summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, summaryLabel: { color: "#756B70", fontSize: 13, lineHeight: 18 }, summaryHint: { color: "#A79CA1", fontSize: 10, lineHeight: 14 }, summaryValue: { color: "#4C4247", fontSize: 14, lineHeight: 19, fontWeight: "800" }, divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#EADFDA" }, summaryStrong: { color: "#251F24", fontSize: 15, lineHeight: 21, fontWeight: "900" }, summaryTotal: { color: "#E94F6D", fontSize: 19, lineHeight: 25, fontWeight: "900" }, inputGroup: { gap: 6 }, inputLabel: { color: "#4C4247", fontSize: 13, lineHeight: 18, fontWeight: "700" }, input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: "#EADFDA", backgroundColor: "#FFFFFF", color: "#251F24", fontSize: 14, lineHeight: 20 }, textarea: { minHeight: 86, paddingTop: 13 }, footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, backgroundColor: "rgba(255,248,245,0.98)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EADFDA", gap: 7 }, footerText: { color: "#8C7F85", fontSize: 10, lineHeight: 14, textAlign: "center" }, pressed: { opacity: 0.65 }, confirmScreen: { flex: 1, paddingHorizontal: 20, paddingBottom: 18, gap: 18 }, confirmCopy: { alignItems: "center", gap: 9, paddingHorizontal: 10, marginTop: 55 }, confirmIcon: { width: 82, height: 82, borderRadius: 28, backgroundColor: "#FBE2E8", alignItems: "center", justifyContent: "center" }, confirmTitle: { color: "#251F24", fontSize: 27, lineHeight: 34, fontWeight: "900", textAlign: "center" }, confirmText: { color: "#756B70", fontSize: 14, lineHeight: 21, textAlign: "center" }, finalPriceCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 17, alignItems: "center", borderWidth: 1, borderColor: "#EADFDA", gap: 3 }, finalPriceLabel: { color: "#756B70", fontSize: 12, lineHeight: 17, fontWeight: "700" }, finalPriceValue: { color: "#E94F6D", fontSize: 28, lineHeight: 35, fontWeight: "900" }, finalPriceHint: { color: "#8C7F85", fontSize: 11, lineHeight: 16 }, confirmFooter: { marginTop: "auto", gap: 7 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 }, centerTitle: { color: "#251F24", fontSize: 20, lineHeight: 26, fontWeight: "800" }, successScreen: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 }, successIcon: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#2E9D74", alignItems: "center", justifyContent: "center" }, successTitle: { color: "#251F24", fontSize: 27, lineHeight: 34, fontWeight: "900", textAlign: "center" }, successText: { color: "#756B70", fontSize: 14, lineHeight: 21, textAlign: "center" }, totalCard: { alignSelf: "stretch", borderRadius: 18, padding: 16, backgroundColor: "#E7F5EF", alignItems: "center", gap: 3 }, totalLabel: { color: "#39745D", fontSize: 12, lineHeight: 17, fontWeight: "700" }, totalValue: { color: "#236B51", fontSize: 23, lineHeight: 29, fontWeight: "900" }, totalHint: { color: "#5F8B77", fontSize: 11, lineHeight: 16 } });
