import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    // 초기 값 세팅
    onChange(mql);

    // addEventListener / addListener 둘 다 대응
    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange as (e: MediaQueryListEvent) => void);
      return () =>
        mql.removeEventListener(
          "change",
          onChange as (e: MediaQueryListEvent) => void,
        );
    } else {
      // 구형 브라우저 대응
      // @ts-expect-error - legacy API
      mql.addListener(onChange);
      return () => {
        // @ts-expect-error - legacy API
        mql.removeListener(onChange);
      };
    }
  }, []);

  return !!isMobile;
}
