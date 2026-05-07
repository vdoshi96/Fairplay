"use client";

import { useEffect } from "react";

export const GUIDE_PRACTICE_COMPLETE_EVENT = "fairplay:guide-practice-complete";
export const GUIDE_PRACTICE_REQUEST_EVENT = "fairplay:guide-practice-request";
export const GUIDE_PRACTICE_RESET_EVENT = "fairplay:guide-practice-reset";

type GuidePracticeEventDetail = {
  eventId: string;
};

export function completeGuidePractice(eventId: string) {
  window.dispatchEvent(
    new CustomEvent<GuidePracticeEventDetail>(GUIDE_PRACTICE_COMPLETE_EVENT, {
      detail: { eventId }
    })
  );
}

export function requestGuidePractice(eventId: string) {
  window.dispatchEvent(
    new CustomEvent<GuidePracticeEventDetail>(GUIDE_PRACTICE_REQUEST_EVENT, {
      detail: { eventId }
    })
  );
}

export function resetGuidePractice(eventId: string) {
  window.dispatchEvent(
    new CustomEvent<GuidePracticeEventDetail>(GUIDE_PRACTICE_RESET_EVENT, {
      detail: { eventId }
    })
  );
}

export function useGuidePracticeRequest(
  eventId: string,
  onRequest: () => void
) {
  useEffect(() => {
    function handleRequest(event: Event) {
      const detail = (event as CustomEvent<GuidePracticeEventDetail>).detail;

      if (detail?.eventId === eventId) {
        onRequest();
      }
    }

    window.addEventListener(GUIDE_PRACTICE_REQUEST_EVENT, handleRequest);

    return () => {
      window.removeEventListener(GUIDE_PRACTICE_REQUEST_EVENT, handleRequest);
    };
  }, [eventId, onRequest]);
}

export function useGuidePracticeReset(eventId: string, onReset: () => void) {
  useEffect(() => {
    function handleReset(event: Event) {
      const detail = (event as CustomEvent<GuidePracticeEventDetail>).detail;

      if (detail?.eventId === eventId) {
        onReset();
      }
    }

    window.addEventListener(GUIDE_PRACTICE_RESET_EVENT, handleReset);

    return () => {
      window.removeEventListener(GUIDE_PRACTICE_RESET_EVENT, handleReset);
    };
  }, [eventId, onReset]);
}
