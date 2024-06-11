import Chart from "chart.js/auto"
import React, { useEffect } from "react";
import { ChartConfig, WidgetSize } from "../../types";
import { useModeController } from "@firecms/core";

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
        const chartConfig = {
            ...config,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {},
                    // legend: {
                    //     position: config.options?.plugins?.legend?.position || "bottom"
                    // },
                    // title: {
                    //     display: true,
                    //     text: title
                    // },
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
        <canvas className={"absolute"} style={{
            top: 16,
            width: size.width
        }}
                ref={canvasRef}/>
    </div>;
}
