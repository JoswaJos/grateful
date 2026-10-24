import { cssInterop } from "nativewind";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

cssInterop(SafeAreaView, { className: "style" });

type ScreenProps = {
  children: ReactNode;
  className?: string;
};

export function Screen({ children, className = "" }: ScreenProps) {
  return (
    <SafeAreaView edges={["top"]} className={`flex-1 bg-cream px-5 ${className}`}>
      {children}
    </SafeAreaView>
  );
}
