import Chart from 'chart.js/auto'
import React, { useEffect } from "react";
import { ChartConfigItem } from "../types";
// @ts-ignore
import { Resizable, ResizableBox } from 'react-resizable';
import { useInjectStyles } from "@firecms/ui";

export function ChartView(config: ChartConfigItem) {
    const ref = React.useRef<HTMLCanvasElement>(null);

    useInjectStyles("chart", `.react-resizable {
  position: relative;
}
.react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}`);

    useEffect(() => {
        const current = ref.current;
        if (!current) return;
        if (!config.chart) {
            return ;
            throw new Error("No chart configuration provided");
        }
        console.log("config", config.chart);
        const chartConfig = {
            ...config.chart,
            options: {
                ...config.chart?.options,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: config.chart.options?.plugins?.legend?.position || "right"
                    }
                }
            }
        };
        const chart = new Chart(
            current,
            chartConfig as any
        );
        return () => {
            chart.destroy();
        };
    }, []);

    // return <canvas id="my-canvas"
    //                className={"max-w-xl"}
    //                ref={ref}>Test Chart
    // </canvas>;
    return <ResizableBox width={500}
                         height={400}
                         minConstraints={[200, 200]}
                         maxConstraints={[1200, 500]}
                         className={"bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"}
    >
        <canvas id="my-canvas"
                className={"w-full h-full"}
                ref={ref}>Test Chart
        </canvas>
    </ResizableBox>
}

