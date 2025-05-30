import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Product,
  PlatformPriceData,
  AlertData,
  PriceHistoryEntry,
  PriceDataPoint,
  ComparisonDocumentData,
} from "@/types";
import {
  transformProductFromFirestore,
  transformPriceHistory,
  transformPlatformData,
} from "@/lib/dataTransform";

export const getProductDetails = async (
  productId: string,
  userId: string,
): Promise<Product | null> => {
  try {
    // Verify user is tracking this product
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (
      !userSnap.exists() ||
      !userSnap.data().trackedProducts?.includes(productId)
    ) {
      return null;
    }

    // Get product data
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return null;
    }

    const productData = productSnap.data();

    // Get alert info if exists
    const alertsQuery = query(
      collection(db, "alerts"),
      where("productId", "==", productId),
      where("userId", "==", userId),
    );
    const alertSnap = await getDocs(alertsQuery);

    let alertInfo = null;
    if (!alertSnap.empty) {
      alertInfo = alertSnap.docs[0].data();
    }

    // Format price history
    const priceHistory =
      productData.priceHistory?.map((entry: any) => ({
        date: entry.date?.toDate() || new Date(),
        price: entry.price,
      })) || [];

    return transformProductFromFirestore({
      id: productSnap.id,
      ...productData,
      alertEnabled: !!alertInfo,
      targetPrice: alertInfo?.targetPrice || null,
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
};

export const getPriceHistory = async (
  productId: string,
): Promise<PriceDataPoint[]> => {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) return [];

    return transformPriceHistory(productSnap.data().priceHistory);
  } catch (error) {
    console.error("Error fetching price history:", error);
    throw error;
  }
};

export const getPlatformComparisons = async (
  productId: string,
): Promise<PlatformPriceData[]> => {
  try {
    // 1. Reference the specific document in the top-level 'comparisons' collection
    const comparisonDocRef = doc(db, "comparisons", productId);

    // 2. Fetch the document
    const docSnap = await getDoc(comparisonDocRef);

    // 3. Check if the document exists
    if (docSnap.exists()) {
      // 4. Cast the data to your expected interface
      const data = docSnap.data() as ComparisonDocumentData;

      // 5. Return the similarProducts array.
      // Ensure data.similarProducts is an array, as it might be undefined or null if not set
      return data.similarProducts || [];
    } else {
      // Document does not exist, meaning no comparison data for this product yet
      console.warn(`No comparison document found for productId: ${productId}`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching platform comparisons:", error);
    return [];
  }
};

export const setPriceAlert = async (
  productId: string,
  userId: string,
  targetPrice: number,
  email: string,
): Promise<void> => {
  try {
    const alertRef = doc(collection(db, "alerts"));

    await setDoc(alertRef, {
      id: alertRef.id,
      productId,
      userId,
      targetPrice,
      email,
      isActive: true,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error setting price alert:", error);
    throw error;
  }
};

export const removePriceAlert = async (
  productId: string,
  userId: string,
): Promise<void> => {
  try {
    const alertsQuery = query(
      collection(db, "alerts"),
      where("productId", "==", productId),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(alertsQuery);

    if (!querySnapshot.empty) {
      await deleteDoc(querySnapshot.docs[0].ref);
    }
  } catch (error) {
    console.error("Error removing price alert:", error);
    throw error;
  }
};
