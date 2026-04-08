'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * InternalQuery type (for extracting path safely)
 */
export interface InternalQuery extends Query<DocumentData> {
  _query?: {
    path?: {
      canonicalString(): string;
      toString(): string;
    };
  };
}

/**
 * React hook to subscribe to Firestore collection/query
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery:
    | ((CollectionReference<DocumentData> | Query<DocumentData>) & {
        __memo?: boolean;
      })
    | null
    | undefined
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // 🚫 Guard 1: No query provided
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 🔍 Extract path safely
    let path = "";

    try {
      if (memoizedTargetRefOrQuery.type === 'collection') {
        path = (memoizedTargetRefOrQuery as CollectionReference).path;
      } else {
        path =
          (memoizedTargetRefOrQuery as unknown as InternalQuery)?._query?.path?.canonicalString?.() ||
          "collectionGroup query";
      }
    } catch {
      path = "unknown";
    }

    // 🛑 Guard 2: Prevent invalid root query
    if (!path || path === "") {
      console.warn("❌ Invalid Firestore query path detected:", path);
      setIsLoading(false);
      return;
    }

    console.log("🔥 Firestore Query Path:", path);

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];

        snapshot.docs.forEach((doc) => {
          results.push({
            ...(doc.data() as T),
            id: doc.id,
          });
        });

        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error("🔥 Firestore Error:", err);

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  // 🚨 Enforce memoization (important for performance)
  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(
      "Firestore query must be memoized using useMemoFirebase"
    );
  }

  return { data, isLoading, error };
}