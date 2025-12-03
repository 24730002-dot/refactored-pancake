import * as React from "react";

import { cn } from "./utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // 모바일: w-full + 간격 살짝 축소, 큰 화면에서 gap 확대
        "bg-card text-card-foreground flex w-full flex-col gap-4 sm:gap-6 rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // 모바일 패딩 축소, border 있을 때 하단 패딩도 모바일/PC 분리
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 pt-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 sm:px-6 sm:pt-6 sm:[.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
      <div
        data-slot="card-content"
        className={cn(
          // 모바일 패딩 축소, 마지막 child일 때만 하단 패딩
          "px-4 [&:last-child]:pb-4 sm:px-6 sm:[&:last-child]:pb-6",
          className,
        )}
        {...props}
      />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // 모바일: 세로 정렬 + 간격, 데스크톱: 가로 정렬
        "flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-center sm:px-6 sm:pb-6 [.border-t]:pt-4 sm:[.border-t]:pt-6",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
