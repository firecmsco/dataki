import { DashboardParams, DryWidgetConfig } from "../../types";

export function DryChartConfigView({
                                        dryConfig,
                                        params,
                                        onUpdated,
                                        onRemoveClick,
                                        zoom,
                                        maxWidth
                                    }: {
    dryConfig: DryWidgetConfig,
    params?: DashboardParams,
    onUpdated?: (newConfig: DryWidgetConfig) => void,
    onRemoveClick?: () => void,
    maxWidth?: number,
    zoom?: number,
}) {

}
