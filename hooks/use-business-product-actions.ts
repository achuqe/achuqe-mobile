import { Alert } from "react-native";
import { useCallback, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useApp } from "@/lib/app-context";
import { haptic } from "@/lib/haptics";
import { trpc } from "@/lib/trpc";
import type { ProductStatus } from "@/shared/achuqe";

type ManageableProductStatus = Exclude<ProductStatus, "deleted">;

export function useBusinessProductActions() {
  const { isAuthenticated } = useAuth();
  const { businessProducts, setProductStatus, removeProduct } = useApp();
  const statusMutation = trpc.products.setStatus.useMutation();
  const deleteMutation = trpc.products.delete.useMutation();
  const utils = trpc.useUtils();
  const [changingProductId, setChangingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const changeStatus = useCallback(async (productId: string, nextStatus: ManageableProductStatus) => {
    const previousStatus = businessProducts.find((product) => product.id === productId)?.status;
    if (!previousStatus || previousStatus === nextStatus) return;

    setProductStatus(productId, nextStatus);
    setChangingProductId(productId);
    haptic.medium();

    if (!isAuthenticated || !/^\d+$/.test(productId)) {
      setChangingProductId(null);
      return;
    }

    try {
      await statusMutation.mutateAsync({ id: Number(productId), status: nextStatus });
      await Promise.all([utils.products.mine.invalidate(), utils.products.active.invalidate()]);
    } catch {
      setProductStatus(productId, previousStatus);
      haptic.error();
      Alert.alert("სტატუსი ვერ განახლდა", "ცვლილება ამჯერად ვერ შეინახა. შეამოწმე ინტერნეტი და სცადე ხელახლა.");
    } finally {
      setChangingProductId(null);
    }
  }, [businessProducts, isAuthenticated, setProductStatus, statusMutation, utils.products.active, utils.products.mine]);

  const deleteProduct = useCallback(async (productId: string) => {
    setDeletingProductId(productId);
    if (!isAuthenticated || !/^\d+$/.test(productId)) {
      removeProduct(productId);
      haptic.success();
      setDeletingProductId(null);
      return;
    }
    try {
      await deleteMutation.mutateAsync({ id: Number(productId) });
      removeProduct(productId);
      haptic.success();
      await Promise.all([utils.products.mine.invalidate(), utils.products.active.invalidate()]);
    } catch {
      haptic.error();
      Alert.alert("პროდუქტი ვერ წაიშალა", "წაშლა ამჯერად ვერ დასრულდა. შეამოწმე ინტერნეტი და სცადე ხელახლა.");
    } finally {
      setDeletingProductId(null);
    }
  }, [deleteMutation, isAuthenticated, removeProduct, utils.products.active, utils.products.mine]);

  return { changeStatus, deleteProduct, changingProductId, deletingProductId };
}
