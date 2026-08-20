import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DEMO_PRODUCTS } from "@/data/catalog";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import type { BusinessProfile, GiftProduct, ProductDraft, UserRole } from "@/shared/achuqe";

interface PersistedAppState {
  role: UserRole | null;
  onboardingComplete: boolean;
  favoriteIds: string[];
  notificationsEnabled: boolean;
  businessProfile: BusinessProfile;
  businessProducts: GiftProduct[];
  removedBusinessProductIds: string[];
}

interface AppContextValue extends PersistedAppState {
  isHydrated: boolean;
  allProducts: GiftProduct[];
  chooseRole: (role: UserRole) => void;
  completeOnboarding: () => void;
  setBusinessProfile: (profile: BusinessProfile) => void;
  toggleFavorite: (productId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  saveProduct: (draft: ProductDraft) => string;
  setProductStatus: (productId: string, status: GiftProduct["status"]) => void;
  removeProduct: (productId: string) => void;
  resetExperience: () => void;
}

const STORAGE_KEY = "achuqe-app-state-v1";

const defaultBusinessProfile: BusinessProfile = {
  name: "ჩემი სახელოსნო",
  category: "საჩუქრები და ხელნაკეთი ნივთები",
  description: "პატარა ქართული ბიზნესი, რომელიც განსაკუთრებული დღეებისთვის თბილ საჩუქრებს ქმნის.",
  city: "თბილისი",
  contact: "+995 555 12 34 56",
  payoutAccountIban: "",
};

const defaultState: PersistedAppState = {
  role: null,
  onboardingComplete: false,
  favoriteIds: [],
  notificationsEnabled: true,
  businessProfile: defaultBusinessProfile,
  businessProducts: [],
  removedBusinessProductIds: [],
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: serverProducts = [] } = trpc.products.active.useQuery(undefined, { retry: 1, staleTime: 60_000 });
  const { data: serverBusinessRows = [] } = trpc.products.mine.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const saved = JSON.parse(stored) as Partial<PersistedAppState>;
          setState({
            ...defaultState,
            ...saved,
            businessProfile: { ...defaultBusinessProfile, ...(saved.businessProfile ?? {}) },
          });
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (isHydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const chooseRole = useCallback((role: UserRole) => setState((current) => ({ ...current, role })), []);
  const completeOnboarding = useCallback(() => setState((current) => ({ ...current, onboardingComplete: true })), []);
  const setNotificationsEnabled = useCallback((notificationsEnabled: boolean) => setState((current) => ({ ...current, notificationsEnabled })), []);
  const setBusinessProfile = useCallback((businessProfile: BusinessProfile) => setState((current) => ({ ...current, businessProfile })), []);

  const toggleFavorite = useCallback((productId: string) => {
    setState((current) => ({
      ...current,
      favoriteIds: current.favoriteIds.includes(productId)
        ? current.favoriteIds.filter((id) => id !== productId)
        : [...current.favoriteIds, productId],
    }));
  }, []);

  const saveProduct = useCallback((draft: ProductDraft) => {
    const productId = draft.id ?? `business-${Date.now()}`;
    setState((current) => {
      const product: GiftProduct = {
        id: productId,
        businessId: "my-business",
        businessName: current.businessProfile.name,
        name: draft.name,
        description: draft.description,
        price: Number(draft.price),
        currency: "₾",
        imageUrl: draft.imageUrl || "/manus-storage/achuqe-product-headphones_277f9213.png",
        occasions: draft.occasions,
        interests: draft.interests,
        ageRanges: draft.ageRanges,
        genders: draft.genders,
        relationships: draft.relationships,
        deliveryLabel: draft.deliveryLabel,
        city: draft.city,
        status: draft.status,
      };
      const exists = current.businessProducts.some((item) => item.id === productId);
      return {
        ...current,
        removedBusinessProductIds: current.removedBusinessProductIds.filter((id) => id !== productId),
        businessProducts: exists
          ? current.businessProducts.map((item) => (item.id === productId ? product : item))
          : [product, ...current.businessProducts],
      };
    });
    return productId;
  }, []);

  const setProductStatus = useCallback((productId: string, status: GiftProduct["status"]) => {
    setState((current) => ({
      ...current,
      businessProducts: current.businessProducts.map((product) => product.id === productId ? { ...product, status } : product),
    }));
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setState((current) => ({
      ...current,
      favoriteIds: current.favoriteIds.filter((id) => id !== productId),
      businessProducts: current.businessProducts.filter((product) => product.id !== productId),
      removedBusinessProductIds: current.removedBusinessProductIds.includes(productId)
        ? current.removedBusinessProductIds
        : [...current.removedBusinessProductIds, productId],
    }));
  }, []);

  const resetExperience = useCallback(() => setState(defaultState), []);

  const businessProducts = useMemo(() => {
    const merged = new Map<string, GiftProduct>();
    serverBusinessRows.forEach((product) => {
      if (state.removedBusinessProductIds.includes(String(product.id))) return;
      merged.set(String(product.id), {
        id: String(product.id),
        businessId: String(product.businessId),
        businessName: state.businessProfile.name,
        name: product.name,
        description: product.description,
        price: product.priceInTetri / 100,
        currency: "₾",
        imageUrl: product.imageUrl,
        occasions: product.occasions as GiftProduct["occasions"],
        interests: product.interests as GiftProduct["interests"],
        ageRanges: product.ageRanges as GiftProduct["ageRanges"],
        genders: product.genders as GiftProduct["genders"],
        relationships: product.relationships as GiftProduct["relationships"],
        deliveryLabel: product.deliveryLabel,
        city: product.city,
        status: product.status,
      });
    });
    state.businessProducts
      .filter((product) => !state.removedBusinessProductIds.includes(product.id))
      .forEach((product) => merged.set(product.id, product));
    return [...merged.values()];
  }, [serverBusinessRows, state.businessProducts, state.businessProfile.name, state.removedBusinessProductIds]);

  const allProducts = useMemo(() => {
    const merged = new Map<string, GiftProduct>();
    [...businessProducts.filter((product) => product.status === "active"), ...serverProducts, ...DEMO_PRODUCTS]
      .forEach((product) => merged.set(product.id, product));
    return [...merged.values()];
  }, [businessProducts, serverProducts]);

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    businessProducts,
    isHydrated,
    allProducts,
    chooseRole,
    completeOnboarding,
    setBusinessProfile,
    toggleFavorite,
    setNotificationsEnabled,
    saveProduct,
    setProductStatus,
    removeProduct,
    resetExperience,
  }), [
    allProducts,
    businessProducts,
    chooseRole,
    completeOnboarding,
    isHydrated,
    resetExperience,
    removeProduct,
    saveProduct,
    setBusinessProfile,
    setNotificationsEnabled,
    setProductStatus,
    state,
    toggleFavorite,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
