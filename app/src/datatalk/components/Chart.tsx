import Chart from 'chart.js/auto'
import React, { useEffect } from "react";
import { EnrichedChartConfigItem } from "../types";

export function ChartView(config: EnrichedChartConfigItem) {
    const ref = React.useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const current = ref.current;
        if (!current) return;
        if (!config.chart) {
            throw new Error("No chart configuration provided");
        }
        console.log("config", config.chart)
        const chart = new Chart(
            current,
            config.chart as any
        );
        return () => {
            chart.destroy();
        };
    }, []);

    return <canvas id="my-canvas"
                   className={"max-w-xl"}
                   ref={ref}>Test Chart</canvas>
}

