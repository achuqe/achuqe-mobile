import AsyncStorage from "@react-native-async-storage/async-storage";

import { parseSavedCatalogFilters, type SavedCatalogFilter } from "@/shared/saved-catalog-filters";

const SAVED_CATALOG_FILTERS_KEY = "achuqe.saved-catalog-filters.v1";

export async function loadSavedCatalogFilters(): Promise<SavedCatalogFilter[]> {
  try {
    return parseSavedCatalogFilters(await AsyncStorage.getItem(SAVED_CATALOG_FILTERS_KEY));
  } catch {
    return [];
  }
}

export async function persistSavedCatalogFilters(filters: SavedCatalogFilter[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_CATALOG_FILTERS_KEY, JSON.stringify(filters));
}
