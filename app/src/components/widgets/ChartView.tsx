import Chart from "chart.js/auto"
import { Colors } from "chart.js";
import { FunnelController, TrapezoidElement } from "chartjs-chart-funnel";

import React, { useEffect } from "react";
import { ChartConfig, WidgetSize } from "../../types";
import { useModeController } from "@firecms/core";

Chart.register(Colors, FunnelController, TrapezoidElement);

export function ChartView({
                              config,
                              size,
                              ref
                          }: {
    ref?: React.RefObject<HTMLDivElement | null>,
    config: ChartConfig,
    size: WidgetSize
}) {

    const modeController = useModeController();
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        Chart.defaults.font.family = "'Rubik', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
        if (modeController.mode === "dark")
            Chart.defaults.color = "#ccc";
        else if (modeController.mode === "light")
            Chart.defaults.color = "#333";

        const current = canvasRef.current;
        if (!current) return;
        if (!config) {
            return;
        }

        // const chartConfig = {
        //     type: 'line',
        //     data: config.data,
        //     options: {
        //         interaction: {
        //             mode: 'index',
        //             intersect: false,
        //         },
        //         plugins: {
        //             title: {
        //                 display: true,
        //                 text: 'Chart.js Line Chart - External Tooltips'
        //             },
        //             tooltip: {
        //                 enabled: false,
        //                 position: 'nearest',
        //                 external: externalTooltipHandler
        //             }
        //         }
        //     }
        // };
        const chartConfig = {
            ...config,
            options: {
                interaction: {
                    mode: "index",
                    intersect: false
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    ...config?.options?.plugins
                },
                ...config?.options
            }
        };
        const chart = new Chart(
            current,
            chartConfig as any
        );
        return () => {
            chart.destroy();
        };
    }, [config, modeController.mode]);

    return <div ref={ref} className={"relative flex-grow p-4 bg-white dark:bg-gray-950"}>
        <canvas className={"absolute"}
                style={{
                    top: 16,
                    width: size.width
                }}
                ref={canvasRef}/>
    </div>;
}
