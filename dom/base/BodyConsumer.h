/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef mozilla_dom_BodyConsumer_h
#define mozilla_dom_BodyConsumer_h

#include "mozilla/GlobalTeardownObserver.h"
#include "mozilla/GlobalFreezeObserver.h"
#include "mozilla/dom/AbortFollower.h"
#include "mozilla/dom/MutableBlobStorage.h"
#include "nsIInputStreamPump.h"

class nsIThread;

namespace mozilla::dom {

class Promise;
class ThreadSafeWorkerRef;

// In order to keep alive the object all the time, we use a ThreadSafeWorkerRef,
// if created on workers.
class BodyConsumer final : public AbortFollower,
                           public GlobalTeardownObserver,
                           public GlobalFreezeObserver {
 public:
  NS_DECL_THREADSAFE_ISUPPORTS

  enum class ConsumeType {
    ArrayBuffer,
    Blob,
    Bytes,
    FormData,
    JSON,
    Text,
  };

  /**
   * Returns a promise which will be resolved when the body is completely
   * consumed and converted to the wanted type (See ConsumeType).
   *
   * @param aGlobal the global to construct the Promise.
   * @param aMainThreadEventTarget the main-thread event target. The reading
   *          needs to start on the main-thread because of nsIInputStreamPump.
   * @param aBodyStream the stream to read.
   * @param aSignalImpl an AbortSignal object. Optional.
   * @param aType the consume type.
   * @param aBodyBlobURISpec this is used only if the consume type is
   *          ConsumeType::Blob. Optional.
   * @param aBodyLocalPath local path in case the blob is created from a local
   *          file. Used only by ConsumeType::Blob. Optional.
   * @param aBodyMimeType the mime-type for blob. Used only by
   * ConsumeType::Blob. Optional.
   * @param aMixedCaseMimeType is needed to get mixed case multipart
   *          boundary value to FormDataParser.
   * @param aBlobStorageType Blobs can be saved in temporary file. This is the
   *          type of blob storage to use. Used only by ConsumeType::Blob.
   * @param aRv An ErrorResult.
   */
  static already_AddRefed<Promise> Create(
      nsIGlobalObject* aGlobal, nsISerialEventTarget* aMainThreadEventTarget,
      nsIInputStream* aBodyStream, AbortSignalImpl* aSignalImpl,
      ConsumeType aType, const nsACString& aBodyBlobURISpec,
      const nsAString& aBodyLocalPath, const nsACString& aBodyMimeType,
      const nsACString& aMixedCaseMimeType,
      MutableBlobStorage::MutableBlobStorageType aBlobStorageType,
      ErrorResult& aRv);

  void ReleaseObject();

  void BeginConsumeBodyMainThread(ThreadSafeWorkerRef* aWorkerRef);

  void OnBlobResult(BlobImpl* aBlobImpl,
                    ThreadSafeWorkerRef* aWorkerRef = nullptr);

  void ContinueConsumeBody(nsresult aStatus, uint32_t aResultLength,
                           uint8_t* aResult, bool aShuttingDown = false);

  void ContinueConsumeBlobBody(BlobImpl* aBlobImpl, bool aShuttingDown = false);

  void DispatchContinueConsumeBlobBody(BlobImpl* aBlobImpl,
                                       ThreadSafeWorkerRef* aWorkerRef);

  void ShutDownMainThreadConsuming();

  void NullifyConsumeBodyPump() {
    mShuttingDown = true;
    mConsumeBodyPump = nullptr;
  }

  // AbortFollower
  void RunAbortAlgorithm() override;

 private:
  BodyConsumer(nsISerialEventTarget* aMainThreadEventTarget,
               nsIGlobalObject* aGlobalObject, nsIInputStream* aBodyStream,
               Promise* aPromise, ConsumeType aType,
               const nsACString& aBodyBlobURISpec,
               const nsAString& aBodyLocalPath, const nsACString& aBodyMimeType,
               const nsACString& aMixedCaseMimeType,
               MutableBlobStorage::MutableBlobStorageType aBlobStorageType);

  ~BodyConsumer();

  nsresult GetBodyLocalFile(nsIFile** aFile) const;

  void AssertIsOnTargetThread() const;

  void MaybeAbortConsumption();

  void DisconnectFromOwner() override {
    MaybeAbortConsumption();
    GlobalTeardownObserver::DisconnectFromOwner();
  }
  void FrozenCallback(nsIGlobalObject* aGlobal) override {
    // XXX: But we should not abort on window freeze, see bug 1910124
    MaybeAbortConsumption();
  }

  nsCOMPtr<nsIThread> mTargetThread;
  nsCOMPtr<nsISerialEventTarget> mMainThreadEventTarget;

  // This is nullified when the consuming of the body starts.
  nsCOMPtr<nsIInputStream> mBodyStream;

  MutableBlobStorage::MutableBlobStorageType mBlobStorageType;
  nsCString mBodyMimeType;
  nsCString mMixedCaseMimeType;

  nsCString mBodyBlobURISpec;
  nsString mBodyLocalPath;

  nsCOMPtr<nsIGlobalObject> mGlobal;

  // Touched on the main-thread only.
  nsCOMPtr<nsIInputStreamPump> mConsumeBodyPump;

  // Only ever set once, always on target thread.
  ConsumeType mConsumeType;
  RefPtr<Promise> mConsumePromise;

  // touched only on the target thread.
  bool mBodyConsumed;

  // touched only on the main-thread.
  bool mShuttingDown;
};

}  // namespace mozilla::dom

#endif  // mozilla_dom_BodyConsumer_h
