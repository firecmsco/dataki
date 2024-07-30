import { useOnboardingTooltip } from "../hooks/useOnboardingTooltip";
import { Tooltip } from "@firecms/ui";
import React from "react";

export function OnboardingTooltip({
                                      id,
                                      title,
                                      side,
                                      children,
                                      className
                                  }: {
    id: string,
    title: string,
    side?: "top" | "bottom" | "left" | "right",
    children: React.ReactNode,
    className?: string
}) {

    const {
        defaultOpen,
        close
    } = useOnboardingTooltip(id);

    return (
        <Tooltip title={title}
                 className={className}
                 tooltipClassName={"animate-bounce tooltip-onboarding"}
                 sideOffset={16}
                 side={side}
                 open={defaultOpen}
                 defaultOpen={defaultOpen}
                 onOpenChange={(open) => {
                     if (!open) {
                         close();
                     }
                 }}
        >
            {children}
        </Tooltip>
    )
}
