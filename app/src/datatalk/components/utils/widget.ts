import { DashboardWidgetConfig, DryWidgetConfig } from "../../types";

export function getConfigWithoutSize(config: DryWidgetConfig | DashboardWidgetConfig): DryWidgetConfig {
    const {
        size,
        // @ts-ignore
        position,
        ...rest
    } = config;
    return rest;
}
