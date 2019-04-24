import { useEffect, useRef } from "react";

export type callbackType = () => void;

export function useInterval(callback: callbackType, delay: number) {
  const savedCallback = useRef<callbackType>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
